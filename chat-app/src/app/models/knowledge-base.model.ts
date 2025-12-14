export interface DocumentoBaseConhecimento {
  codigo_documento: string;
  data_criacao_documento: string;
  status_documento: string;
  nome_documento: string;
}

export interface BaseConhecimento {
  codigo_base_conhecimento: string;
  nome_base_conhecimento: string;
  descricao_base_conhecimento: string;
  data_criacao_base_conhecimento: string;
  escopo_base_conhecimento: string;
  tamanho_base_conhecimento: number;
  documentos: DocumentoBaseConhecimento[] | null;
  codigo_diretorio: string;
}

export interface CreateBaseConhecimentoRequest {
  nome_base_conhecimento: string;
  descricao_base_conhecimento: string;
  idEscopoBaseConhecimento: number;
  codigo_diretorio: string;
}
