import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DirectoryResponse, DocumentUploadResponse, AttachDocumentRequest, AttachDocumentResponse, CreateDirectoryRequest } from '../models/directory.model';
import { API_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class DirectoryService {
  constructor(private http: HttpClient) {}

  // Lista o diretório raiz
  getDirectories(): Observable<DirectoryResponse> {
    return this.http.get<DirectoryResponse>(`${API_URL}/diretorio`);
  }

  // Busca um diretório específico por ID
  getDirectoryById(directoryId: string): Observable<DirectoryResponse> {
    return this.http.get<DirectoryResponse>(`${API_URL}/diretorio/${directoryId}`);
  }

  // Cria um novo diretório
  createDirectory(request: CreateDirectoryRequest): Observable<DirectoryResponse> {
    return this.http.post<DirectoryResponse>(`${API_URL}/diretorio`, request);
  }

  // Deleta um diretório
  deleteDirectory(directoryId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/diretorio/${directoryId}`);
  }

  // Upload de documento em um diretório
  uploadDocument(directoryId: string, file: File): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<DocumentUploadResponse>(
      `${API_URL}/diretorio/${directoryId}/documento`,
      formData
    );
  }

  // Deleta um documento de um diretório
  deleteDocument(directoryId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/diretorio/${directoryId}/documento/${documentId}`);
  }

  // Anexa documento ao chat
  attachDocumentToChat(chatId: string, documentId: string): Observable<AttachDocumentResponse> {
    const payload: AttachDocumentRequest = {
      codigo_documento: documentId
    };
    return this.http.post<AttachDocumentResponse>(
      `${API_URL}/chat/${chatId}/documento`,
      payload
    );
  }
}
