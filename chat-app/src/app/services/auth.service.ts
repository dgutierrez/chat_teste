import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, AuthUser } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://lawrana.com';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly EXPIRATION_KEY = 'token_expiration';
  
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/usuario/login`, credentials)
      .pipe(
        tap(response => {
          const authUser: AuthUser = {
            token: response.data.token,
            dataExpiracao: response.data.data_expiracao
          };
          this.setStoredUser(authUser);
          this.currentUserSubject.next(authUser);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRATION_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const expiration = localStorage.getItem(this.EXPIRATION_KEY);
    if (!expiration) {
      return false;
    }

    return new Date(expiration) > new Date();
  }

  private getStoredUser(): AuthUser | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiration = localStorage.getItem(this.EXPIRATION_KEY);
    
    if (token && expiration) {
      return {
        token,
        dataExpiracao: expiration
      };
    }
    
    return null;
  }

  private setStoredUser(user: AuthUser): void {
    localStorage.setItem(this.TOKEN_KEY, user.token);
    localStorage.setItem(this.EXPIRATION_KEY, user.dataExpiracao);
  }
}
