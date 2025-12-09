import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription, of, Observable } from 'rxjs';
import { switchMap, takeWhile, retry, catchError, take, finalize } from 'rxjs/operators';
import { ChatService } from '../../services/chat.service';
import { MessageService } from '../../services/message.service';
import { DirectoryService } from '../../services/directory.service';
import { ChatDetail, Message } from '../../models/chat.model';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
    // Configurar marked para usar quebras de linha
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  transform(value: string): SafeHtml {
    if (!value) return '';
    const html = marked.parse(value);
    return this.sanitizer.sanitize(1, html) || '';
  }
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  chatId: string = '';
  chat: ChatDetail | null = null;
  newMessage = '';
  loading = false;
  sending = false;
  errorMessage = '';
  processingMessageId: string | null = null;
  pollingSubscription?: Subscription;
  pollingAttempts = 0;
  maxPollingAttempts = 4;
  
  // Upload
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = '';
  rootDirectoryId: string | null = null;
  uploadingFileName: string = '';
  isIndexing = false;
  indexingComplete = false;
  
  // Streaming effect
  streamingMessage: string = '';
  isStreaming = false;
  streamingSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private messageService: MessageService,
    private directoryService: DirectoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chatId = this.route.snapshot.paramMap.get('id') || '';
    if (this.chatId) {
      this.loadChat();
      this.loadRootDirectory();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.stopStreaming();
  }

  loadChat(): void {
    this.loading = true;
    this.errorMessage = '';

    console.log('Loading chat with ID:', this.chatId);

    this.chatService.getChatById(this.chatId).subscribe({
      next: (response) => {
        console.log('Chat loaded successfully:', response);
        this.chat = response.data;
        this.loading = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading chat:', error);
        this.loading = false;
        this.errorMessage = `Erro ao carregar chat: ${error.message || 'Erro desconhecido'}`;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || this.sending) {
      return;
    }

    this.sending = true;
    this.errorMessage = '';

    const messageText = this.newMessage;
    this.newMessage = '';

    // Adicionar mensagem do usuário à lista
    const userMessage: Message = {
      codigo_mensagem: '',
      mensagem: messageText,
      data_mensagem: new Date().toISOString(),
      tipo_mensagem: 'Usuario',
      nome_documento: '',
      extensao_documento: ''
    };

    if (this.chat) {
      this.chat.mensagens.push(userMessage);
      this.cdr.detectChanges();
      this.scrollToBottom();
    }

    this.messageService.sendMessage({
      codigo_chat: this.chatId,
      mensagem: messageText,
      codigo_base_conhecimento: ''
    }).subscribe({
      next: (response) => {
        this.sending = false;
        this.processingMessageId = response.idProcessamento;
        this.startPolling();
      },
      error: (error) => {
        this.sending = false;
        this.errorMessage = 'Erro ao enviar mensagem';
        console.error('Error sending message:', error);
        // Remover mensagem se houver erro
        if (this.chat) {
          this.chat.mensagens.pop();
        }
      }
    });
  }

  startPolling(): void {
    if (!this.processingMessageId) {
      return;
    }

    this.stopPolling();
    this.pollingAttempts = 0;

    // Polling a cada 5 segundos - continua indefinidamente até processar
    this.pollingSubscription = interval(5000)
      .pipe(
        switchMap(() => {
          this.pollingAttempts++;
          console.log(`Polling attempt ${this.pollingAttempts}`);
          
          return this.messageService.getMessageProcessingStatus(this.processingMessageId!).pipe(
            catchError((error) => {
              console.log('Polling error (will retry):', error);
              // Retornar status "Processando" para continuar o polling
              return of({ 
                codigo_processamento_mensagem: this.processingMessageId!,
                data_criacao: '',
                data_atualizacao: '',
                status_processamento_mensagem: 'Processando' as const
              });
            })
          );
        }),
        takeWhile((status) => {
          // Continuar enquanto estiver processando ou pendente (sem limite de tentativas)
          const shouldContinue = status.status_processamento_mensagem === 'Processando' || status.status_processamento_mensagem === 'Pendente';
          console.log(`Should continue polling: ${shouldContinue} (status: ${status.status_processamento_mensagem}, attempts: ${this.pollingAttempts})`);
          return shouldContinue;
        }, true) // true = emitir o último valor mesmo que a condição seja falsa
      )
      .subscribe({
        next: (status) => {
          console.log('Polling status:', status);
          
          if (status.status_processamento_mensagem === 'Processado') {
            console.log('Message processed successfully! Loading with streaming effect...');
            this.processingMessageId = null;
            this.pollingAttempts = 0;
            this.stopPolling();
            this.loadChatWithStreaming();
          }
          // Continua o polling automaticamente enquanto status for "Processando"
        },
        error: (error) => {
          console.error('Fatal polling error:', error);
          this.errorMessage = 'Erro ao verificar status da mensagem';
          this.processingMessageId = null;
          this.pollingAttempts = 0;
          this.stopPolling();
        },
        complete: () => {
          console.log('Polling completed');
        }
      });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  goBack(): void {
    this.router.navigate(['/chats']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  loadChatWithStreaming(): void {
    this.chatService.getChatById(this.chatId).subscribe({
      next: (response) => {
        const previousMessagesCount = this.chat?.mensagens.length || 0;
        this.chat = response.data;
        
        // Verificar se há nova mensagem do assistente
        if (this.chat.mensagens.length > previousMessagesCount) {
          const lastMessage = this.chat.mensagens[this.chat.mensagens.length - 1];
          
          if (lastMessage.tipo_mensagem === 'Assistente') {
            // Iniciar efeito de streaming para a última mensagem
            this.startStreamingEffect(lastMessage);
          } else {
            this.cdr.detectChanges();
            this.scrollToBottom();
          }
        } else {
          this.cdr.detectChanges();
          this.scrollToBottom();
        }
      },
      error: (error) => {
        console.error('Error loading chat:', error);
        this.errorMessage = 'Erro ao carregar chat';
      }
    });
  }

  startStreamingEffect(message: Message): void {
    const fullText = message.mensagem;
    this.isStreaming = true;
    this.streamingMessage = '';
    
    // Temporariamente substituir a mensagem completa por vazio
    const messageIndex = this.chat!.mensagens.length - 1;
    const originalMessage = this.chat!.mensagens[messageIndex].mensagem;
    this.chat!.mensagens[messageIndex].mensagem = '';
    
    let currentIndex = 0;
    const charsPerInterval = 3; // Quantos caracteres por vez
    const intervalTime = 20; // Milissegundos entre cada atualização
    
    this.streamingSubscription = interval(intervalTime)
      .pipe(
        takeWhile(() => currentIndex < fullText.length)
      )
      .subscribe({
        next: () => {
          currentIndex += charsPerInterval;
          const displayText = fullText.substring(0, Math.min(currentIndex, fullText.length));
          this.chat!.mensagens[messageIndex].mensagem = displayText;
          this.cdr.detectChanges();
          this.scrollToBottom();
        },
        complete: () => {
          // Garantir que o texto completo seja exibido
          this.chat!.mensagens[messageIndex].mensagem = originalMessage;
          this.isStreaming = false;
          this.streamingMessage = '';
          this.cdr.detectChanges();
          this.scrollToBottom();
        }
      });
  }

  stopStreaming(): void {
    if (this.streamingSubscription) {
      this.streamingSubscription.unsubscribe();
      this.streamingSubscription = undefined;
    }
    this.isStreaming = false;
    this.streamingMessage = '';
  }

  waitForDocumentIndexing(documentId: string): Observable<void> {
    return new Observable<void>(observer => {
      console.log('Starting document indexing polling...');
      
      const checkIndexing = () => {
        this.directoryService.getDirectories().subscribe({
          next: (response) => {
            // Procurar o documento em todos os diretórios
            const findDocument = (dir: any): any => {
              // Verificar documentos no diretório atual
              const doc = dir.documentos?.find((d: any) => d.codigo_documento === documentId);
              if (doc) return doc;
              
              // Verificar subdiretórios recursivamente
              for (const subDir of dir.sub_diretorios || []) {
                const found = findDocument(subDir);
                if (found) return found;
              }
              return null;
            };
            
            const document = findDocument(response.data);
            
            if (document) {
              console.log('Document status:', document.status_documento);
              
              if (document.status_documento === 'Finalizado') {
                console.log('Document indexed!');
                observer.next();
                observer.complete();
              } else {
                // Continuar verificando a cada 2 segundos
                setTimeout(checkIndexing, 2000);
              }
            } else {
              // Documento não encontrado ainda, continuar verificando
              setTimeout(checkIndexing, 2000);
            }
          },
          error: (err) => {
            console.error('Error checking document status:', err);
            // Continuar tentando mesmo com erro
            setTimeout(checkIndexing, 2000);
          }
        });
      };
      
      // Iniciar verificação
      checkIndexing();
    });
  }

  // Upload de documentos
  loadRootDirectory(): void {
    this.directoryService.getDirectories().subscribe({
      next: (response) => {
        this.rootDirectoryId = response.data.codigo_diretorio;
        console.log('Root directory ID:', this.rootDirectoryId);
      },
      error: (error) => {
        console.error('Error loading root directory:', error);
        this.errorMessage = 'Erro ao carregar diretório raiz';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    
    // Validar tipo de arquivo
    if (file.type !== 'application/pdf') {
      this.errorMessage = 'Apenas arquivos PDF são aceitos';
      input.value = '';
      return;
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB em bytes
    if (file.size > maxSize) {
      this.errorMessage = 'O arquivo deve ter no máximo 10MB';
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.uploadDocument();
  }

  triggerFileInput(): void {
    if (!this.uploading) {
      this.fileInput.nativeElement.click();
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile || !this.rootDirectoryId || this.uploading) {
      return;
    }

    this.uploading = true;
    this.errorMessage = '';
    this.uploadProgress = 'Enviando arquivo...';
    this.uploadingFileName = this.selectedFile.name;
    this.isIndexing = false;
    this.indexingComplete = false;
    this.cdr.detectChanges();

    // Passo 1: Upload do arquivo para o diretório raiz
    this.directoryService.uploadDocument(this.rootDirectoryId, this.selectedFile)
      .pipe(
        finalize(() => {
          this.uploading = false;
          this.selectedFile = null;
          // Limpar o input file
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }
          // Resetar estados após um delay
          setTimeout(() => {
            this.uploadingFileName = '';
            this.isIndexing = false;
            this.indexingComplete = false;
            this.cdr.detectChanges();
          }, 3000);
        })
      )
      .subscribe({
        next: (uploadResponse) => {
          console.log('Document uploaded:', uploadResponse);
          this.uploadProgress = 'Indexando documento...';
          this.isIndexing = true;
          this.cdr.detectChanges();
          
          // Passo 2: Aguardar indexação do documento
          this.waitForDocumentIndexing(uploadResponse.data.codigo_documento)
            .subscribe({
              next: () => {
                console.log('Document indexed successfully');
                this.uploadProgress = 'Anexando ao chat...';
                this.isIndexing = false;
                this.indexingComplete = true;
                this.cdr.detectChanges();
                
                // Passo 3: Anexar documento ao chat
                this.directoryService.attachDocumentToChat(this.chatId, uploadResponse.data.codigo_documento)
                  .subscribe({
                    next: (attachResponse) => {
                      console.log('Document attached to chat:', attachResponse);
                      this.uploadProgress = '';
                      
                      // Adicionar mensagem à lista de mensagens
                      const documentMessage: Message = {
                        codigo_mensagem: attachResponse.data.codigo_mensagem,
                        mensagem: attachResponse.data.mensagem,
                        data_mensagem: attachResponse.data.data_mensagem,
                        tipo_mensagem: attachResponse.data.tipo_mensagem as 'Usuario' | 'Assistente',
                        nome_documento: attachResponse.data.nome_documento,
                        extensao_documento: attachResponse.data.extensao_documento,
                        isNewlyAttached: true
                      };

                      if (this.chat) {
                        this.chat.mensagens.push(documentMessage);
                        this.cdr.detectChanges();
                        this.scrollToBottom();
                      }
                    },
                    error: (error) => {
                      console.error('Error attaching document:', error);
                      this.errorMessage = 'Erro ao anexar documento ao chat';
                      this.uploadProgress = '';
                    }
                  });
              },
              error: (error) => {
                console.error('Error waiting for indexing:', error);
                this.errorMessage = 'Erro ao indexar documento';
                this.uploadProgress = '';
              }
            });
        },
        error: (error) => {
          console.error('Error uploading document:', error);
          this.errorMessage = 'Erro ao enviar arquivo';
          this.uploadProgress = '';
        }
      });
  }
}
