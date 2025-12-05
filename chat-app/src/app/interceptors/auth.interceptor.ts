import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Gerar UUID v4 para correlation-id
  const correlationId = crypto.randomUUID();
  
  // Clonar a requisição e adicionar o correlation-id
  let modifiedReq = req.clone({
    setHeaders: {
      'x-correlation-id': correlationId
    }
  });

  // Se não for a rota de login, adicionar o token de autenticação
  if (!req.url.includes('/usuario/login')) {
    const token = authService.getToken();
    
    if (token) {
      modifiedReq = modifiedReq.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'x-correlation-id': correlationId
        }
      });
    }
  }

  return next(modifiedReq);
};
