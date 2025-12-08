import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SendMessageRequest, 
  SendMessageResponse,
  MessageProcessingStatus 
} from '../models/message.model';
import { API_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(private http: HttpClient) {}

  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${API_URL}/mensagemV3`, request);
  }

  getMessageProcessingStatus(processingId: string): Observable<MessageProcessingStatus> {
    return this.http.get<MessageProcessingStatus>(
      `${API_URL}/mensagem/processamento/${processingId}`
    );
  }
}
