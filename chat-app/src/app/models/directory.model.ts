export interface Directory {
  codigo_diretorio: string;
  codigo_proprietario: string;
  nome_diretorio: string;
  codigo_diretorio_pai: string;
  caminho_diretorio: string;
  criado_em: string;
  sub_diretorios: Directory[];
  documentos: Document[];
  analises: any[];
  base_conhecimento: string;
}

export interface Document {
  codigo_documento: string;
  nome_documento: string;
  caminho_documento: string;
  status_documento: string;
  criado_em: string;
}

export interface DirectoryResponse {
  data: Directory;
}

export interface DocumentUploadResponse {
  data: {
    codigo_documento: string;
    nome_documento: string;
    caminho_documento: string;
    status_documento: string;
    criado_em: string;
  };
}

export interface AttachDocumentRequest {
  codigo_documento: string;
}

export interface AttachDocumentResponse {
  data: {
    codigo_mensagem: string;
    mensagem: string;
    data_mensagem: string;
    tipo_mensagem: string;
    nome_documento: string;
    extensao_documento: string;
  };
}
