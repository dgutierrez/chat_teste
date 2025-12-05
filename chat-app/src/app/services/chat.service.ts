import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Chat, 
  ChatListResponse, 
  CreateChatRequest, 
  ChatDetail,
  ChatDetailResponse 
} from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_URL = 'https://lawrana.com';

  constructor(private http: HttpClient) {}

  listChats(): Observable<ChatListResponse> {
    return this.http.get<ChatListResponse>(`${this.API_URL}/chat`);
  }

  createChat(request: CreateChatRequest): Observable<ChatDetail> {
    return this.http.post<ChatDetail>(`${this.API_URL}/chat`, request);
  }

  getChatById(chatId: string): Observable<ChatDetailResponse> {
    return this.http.get<ChatDetailResponse>(`${this.API_URL}/chat/${chatId}`);
  }
}
