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
import { API_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient) {}

  listChats(): Observable<ChatListResponse> {
    return this.http.get<ChatListResponse>(`${API_URL}/chat`);
  }

  createChat(request: CreateChatRequest): Observable<ChatDetail> {
    return this.http.post<ChatDetail>(`${API_URL}/chat`, request);
  }

  getChatById(chatId: string): Observable<ChatDetailResponse> {
    return this.http.get<ChatDetailResponse>(`${API_URL}/chat/${chatId}`);
  }
}
