import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import { BaseConhecimento, CreateBaseConhecimentoRequest } from '../models/knowledge-base.model';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseService {
  private apiUrl = `${API_URL}/baseconhecimento`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todas as bases de conhecimento
   */
  getKnowledgeBases(): Observable<BaseConhecimento[]> {
    return this.http.get<BaseConhecimento[]>(this.apiUrl);
  }

  /**
   * Busca uma base de conhecimento por ID
   */
  getKnowledgeBaseById(id: string): Observable<BaseConhecimento> {
    return this.http.get<BaseConhecimento>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cria uma nova base de conhecimento
   */
  createKnowledgeBase(request: CreateBaseConhecimentoRequest): Observable<BaseConhecimento> {
    return this.http.post<BaseConhecimento>(this.apiUrl, request);
  }

  /**
   * Deleta uma base de conhecimento
   */
  deleteKnowledgeBase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Adiciona um documento à base de conhecimento
   */
  addDocumentToKnowledgeBase(knowledgeBaseId: string, documentId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${knowledgeBaseId}/documento/${documentId}`, {});
  }
}
