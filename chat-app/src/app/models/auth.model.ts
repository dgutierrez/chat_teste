export interface LoginRequest {
  codigo_empresa: string;
  email: string;
  senha: string;
}

export interface LoginResponse {
  data: {
    token: string;
    token_csfr: string | null;
    data_expiracao: string;
  };
}

export interface AuthUser {
  token: string;
  dataExpiracao: string;
}
