export interface SendMessageRequest {
  codigo_chat: string;
  mensagem: string;
  codigo_base_conhecimento: string;
}

export interface SendMessageResponse {
  idProcessamento: string;
}

export interface MessageProcessingStatus {
  codigo_processamento_mensagem: string;
  data_criacao: string;
  data_atualizacao: string;
  status_processamento_mensagem: 'Pendente' | 'Processando' | 'Processado';
}
