import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Chat } from '../../models/chat.model';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css']
})
export class ChatListComponent implements OnInit {
  chats: Chat[] = [];
  loading = false;
  errorMessage = '';
  showCreateDialog = false;
  newChatName = '';
  creatingChat = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadChats();
  }

  loadChats(): void {
    this.loading = true;
    this.errorMessage = '';
    
    console.log('Starting to load chats...');

    this.chatService.listChats().subscribe({
      next: (response) => {
        console.log('Response received:', response);
        console.log('Data array:', response.data);
        console.log('Number of chats:', response.data?.length);
        
        this.chats = response.data || [];
        this.loading = false;
        
        console.log('Chats array after assignment:', this.chats);
        console.log('Loading state:', this.loading);
        
        // Forçar detecção de mudanças
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading chats:', error);
        this.loading = false;
        this.errorMessage = 'Erro ao carregar os chats: ' + (error.message || 'Erro desconhecido');
      }
    });
  }

  openChat(chatId: string): void {
    this.router.navigate(['/chat', chatId]);
  }

  openCreateDialog(): void {
    this.showCreateDialog = true;
    this.newChatName = '';
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
    this.newChatName = '';
  }

  createChat(): void {
    if (!this.newChatName.trim()) {
      return;
    }

    this.creatingChat = true;
    this.errorMessage = '';

    this.chatService.createChat({ nome_chat: this.newChatName }).subscribe({
      next: (chat) => {
        console.log('Chat created successfully:', chat);
        this.creatingChat = false;
        this.closeCreateDialog();
        // O chat foi criado com sucesso, navegar para ele
        this.router.navigate(['/chat', chat.codigo_chat]);
      },
      error: (error) => {
        console.error('Error creating chat:', error);
        this.creatingChat = false;
        this.errorMessage = 'Erro ao criar chat: ' + (error.message || 'Erro desconhecido');
        // Fechar o dialog mesmo em caso de erro
        this.closeCreateDialog();
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  }
}
