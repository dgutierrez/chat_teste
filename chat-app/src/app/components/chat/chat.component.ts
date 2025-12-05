import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription, of } from 'rxjs';
import { switchMap, takeWhile, retry, catchError, take } from 'rxjs/operators';
import { ChatService } from '../../services/chat.service';
import { MessageService } from '../../services/message.service';
import { ChatDetail, Message } from '../../models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chatId = this.route.snapshot.paramMap.get('id') || '';
    if (this.chatId) {
      this.loadChat();
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

    // Polling a cada 5 segundos, máximo 4 tentativas
    this.pollingSubscription = interval(5000)
      .pipe(
        take(this.maxPollingAttempts),
        switchMap(() => {
          this.pollingAttempts++;
          console.log(`Polling attempt ${this.pollingAttempts}/${this.maxPollingAttempts}`);
          
          return this.messageService.getMessageProcessingStatus(this.processingMessageId!).pipe(
            catchError((error) => {
              console.log('Polling error (will retry):', error);
              // Se for 400 ou erro de rede, continuar tentando
              // Retornar um status de processamento para continuar o polling
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
          // Continuar enquanto estiver processando e não atingiu o máximo de tentativas
          return status.status_processamento_mensagem === 'Processando' && this.pollingAttempts < this.maxPollingAttempts;
        }, true) // true = emitir o último valor mesmo que a condição seja falsa
      )
      .subscribe({
        next: (status) => {
          console.log('Polling status:', status);
          
          if (status.status_processamento_mensagem === 'Processado') {
            console.log('Message processed successfully!');
            this.processingMessageId = null;
            this.pollingAttempts = 0;
            this.stopPolling();
            this.loadChat();
          } else if (this.pollingAttempts >= this.maxPollingAttempts) {
            console.log('Max polling attempts reached');
            this.errorMessage = 'Tempo limite excedido. A mensagem ainda está sendo processada.';
            this.processingMessageId = null;
            this.pollingAttempts = 0;
            this.stopPolling();
            // Recarregar o chat mesmo assim para ver se a mensagem foi adicionada
            this.loadChat();
          }
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
}
