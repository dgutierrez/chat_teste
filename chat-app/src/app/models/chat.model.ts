export interface Chat {
  codigo_chat: string;
  codigo_assistente: string;
  nome_assistente: string;
  criado_em: string;
  nome_chat: string;
  foto_assistente: string;
}

export interface ChatListResponse {
  data: Chat[];
}

export interface CreateChatRequest {
  nome_chat: string;
}

export interface ChatDetail {
  foto_assistente: string;
  nome_assistente: string;
  codigo_base_conhecimento: string | null;
  nome_base_conhecimento: string | null;
  mensagens: Message[];
  codigo_chat: string;
  codigo_assistente: string;
  criado_em: string;
  nome_chat: string;
}

export interface ChatDetailResponse {
  data: ChatDetail;
}

export interface Message {
  codigo_mensagem: string;
  mensagem: string;
  data_mensagem: string;
  tipo_mensagem: 'Usuario' | 'Assistente';
  nome_documento: string;
  extensao_documento: string;
  isNewlyAttached?: boolean;
}

export interface UpdateChatKnowledgeBaseRequest {
  codigo_base_conhecimento: string;
}
