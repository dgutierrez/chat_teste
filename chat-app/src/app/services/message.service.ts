import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SendMessageRequest, 
  SendMessageResponse,
  MessageProcessingStatus 
} from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly API_URL = 'https://lawrana.com';

  constructor(private http: HttpClient) {}

  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${this.API_URL}/mensagemV3`, request);
  }

  getMessageProcessingStatus(processingId: string): Observable<MessageProcessingStatus> {
    return this.http.get<MessageProcessingStatus>(
      `${this.API_URL}/mensagem/processamento/${processingId}`
    );
  }
}
