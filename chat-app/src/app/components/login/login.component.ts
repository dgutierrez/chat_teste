import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials: LoginRequest = {
    codigo_empresa: 'b9214ed2-811f-4718-9da7-9a99b3be9860',
    email: '',
    senha: ''
  };

  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.senha) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    console.log('Attempting login with credentials:', {
      email: this.credentials.email,
      codigo_empresa: this.credentials.codigo_empresa
    });

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.loading = false;
        this.router.navigate(['/chats']);
      },
      error: (error) => {
        console.error('Login error details:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.loading = false;
        
        if (error.status === 0) {
          this.errorMessage = 'Erro de conexão. Verifique sua internet ou se o servidor está acessível.';
        } else if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Email ou senha incorretos.';
        } else if (error.status === 404) {
          this.errorMessage = 'Serviço de login não encontrado.';
        } else {
          this.errorMessage = 'Erro ao fazer login. Tente novamente.';
        }
      }
    });
  }
}
