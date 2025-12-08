import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription, of } from 'rxjs';
import { switchMap, takeWhile, retry, catchError, take, finalize } from 'rxjs/operators';
import { ChatService } from '../../services/chat.service';
import { MessageService } from '../../services/message.service';
import { DirectoryService } from '../../services/directory.service';
import { ChatDetail, Message } from '../../models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          // Continuar enquanto estiver processando (sem limite de tentativas)
          const shouldContinue = status.status_processamento_mensagem === 'Processando';
          console.log(`Should continue polling: ${shouldContinue} (status: ${status.status_processamento_mensagem}, attempts: ${this.pollingAttempts})`);
          return shouldContinue;
        }, true) // true = emitir o último valor mesmo que a condição seja falsa
      )
      .subscribe({
        next: (status) => {
          console.log('Polling status:', status);
          
          if (status.status_processamento_mensagem === 'Processado') {
            console.log('Message processed successfully! Reloading chat...');
            this.processingMessageId = null;
            this.pollingAttempts = 0;
            this.stopPolling();
            this.loadChat();
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
        })
      )
      .subscribe({
        next: (uploadResponse) => {
          console.log('Document uploaded:', uploadResponse);
          this.uploadProgress = 'Anexando ao chat...';
          
          // Passo 2: Anexar documento ao chat
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
                  extensao_documento: attachResponse.data.extensao_documento
                };

                if (this.chat) {
                  this.chat.mensagens.push(documentMessage);
                  this.cdr.detectChanges();
                  this.scrollToBottom();
                }

                // NÃO iniciar polling aqui - aguardar usuário enviar mensagem
                // this.processingMessageId = attachResponse.data.codigo_mensagem;
                // this.startPolling();
              },
              error: (error) => {
                console.error('Error attaching document:', error);
                this.errorMessage = 'Erro ao anexar documento ao chat';
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
