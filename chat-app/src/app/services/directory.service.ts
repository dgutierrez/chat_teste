import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DirectoryResponse, DocumentUploadResponse, AttachDocumentRequest, AttachDocumentResponse } from '../models/directory.model';
import { API_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class DirectoryService {
  constructor(private http: HttpClient) {}

  getDirectories(): Observable<DirectoryResponse> {
    return this.http.get<DirectoryResponse>(`${API_URL}/diretorio`);
  }

  uploadDocument(directoryId: string, file: File): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<DocumentUploadResponse>(
      `${API_URL}/diretorio/${directoryId}/documento`,
      formData
    );
  }

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
