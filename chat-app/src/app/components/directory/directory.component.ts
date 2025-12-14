import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DirectoryService } from '../../services/directory.service';
import { Directory, Documento } from '../../models/directory.model';

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.css']
})
export class DirectoryComponent implements OnInit {
  currentDirectory = signal<Directory | null>(null);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  // Modais
  showCreateDirectoryDialog = false;
  showUploadDialog = false;
  showDeleteConfirm = false;
  
  // Formulários
  newDirectoryName = '';
  selectedFile: File | null = null;
  
  // Estados
  creatingDirectory = false;
  uploading = false;
  itemToDelete: { type: 'directory' | 'document', id: string, name: string } | null = null;
  deleting = false;

  constructor(private directoryService: DirectoryService) {}

  ngOnInit(): void {
    this.loadRootDirectory();
  }

  loadRootDirectory(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    
    console.log('Loading root directory - loading:', this.loading());
    
    this.directoryService.getDirectories().subscribe({
      next: (response) => {
        console.log('Root directory loaded:', response.data);
        this.currentDirectory.set(response.data);
        this.loading.set(false);
        console.log('State updated - loading:', this.loading());
      },
      error: (error) => {
        this.errorMessage.set('Erro ao carregar diretórios');
        this.loading.set(false);
        console.error('Error loading directories:', error);
      }
    });
  }

  loadDirectory(directoryId: string): void {
    this.loading.set(true);
    this.errorMessage.set('');
    
    console.log('Loading directory:', directoryId, '- loading:', this.loading());
    
    this.directoryService.getDirectoryById(directoryId).subscribe({
      next: (response) => {
        console.log('Directory loaded:', response.data);
        this.currentDirectory.set(response.data);
        this.loading.set(false);
        console.log('State updated - loading:', this.loading());
      },
      error: (error) => {
        this.errorMessage.set('Erro ao carregar diretório');
        this.loading.set(false);
        console.error('Error loading directory:', error);
      }
    });
  }

  openCreateDirectoryDialog(): void {
    this.newDirectoryName = '';
    this.showCreateDirectoryDialog = true;
  }

  closeCreateDirectoryDialog(): void {
    this.showCreateDirectoryDialog = false;
    this.newDirectoryName = '';
  }

  createDirectory(): void {
    if (!this.newDirectoryName.trim()) return;
    
    this.creatingDirectory = true;
    this.errorMessage.set('');
    
    const request = {
      nome_pasta: this.newDirectoryName.trim(),
      codigo_pasta_pai: this.currentDirectory()?.codigo_diretorio !== this.currentDirectory()?.codigo_proprietario 
        ? this.currentDirectory()?.codigo_diretorio 
        : undefined
    };
    
    this.directoryService.createDirectory(request).subscribe({
      next: () => {
        this.creatingDirectory = false;
        this.closeCreateDirectoryDialog();
        this.showSuccess('Diretório criado com sucesso!');
        this.reloadCurrentDirectory();
      },
      error: (error) => {
        this.errorMessage.set('Erro ao criar diretório');
        this.creatingDirectory = false;
        console.error('Error creating directory:', error);
      }
    });
  }

  openUploadDialog(): void {
    this.selectedFile = null;
    this.showUploadDialog = true;
  }

  closeUploadDialog(): void {
    this.showUploadDialog = false;
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      if (file.size <= 10 * 1024 * 1024) {
        this.selectedFile = file;
        this.errorMessage.set('');
      } else {
        this.errorMessage.set('O arquivo deve ter no máximo 10MB');
        this.selectedFile = null;
      }
    } else {
      this.errorMessage.set('Apenas arquivos PDF são permitidos');
      this.selectedFile = null;
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile || !this.currentDirectory()) return;
    
    this.uploading = true;
    this.errorMessage.set('');
    
    this.directoryService.uploadDocument(this.currentDirectory()!.codigo_diretorio, this.selectedFile).subscribe({
      next: () => {
        this.uploading = false;
        this.closeUploadDialog();
        this.showSuccess('Documento enviado com sucesso!');
        this.reloadCurrentDirectory();
      },
      error: (error) => {
        this.errorMessage.set('Erro ao enviar documento');
        this.uploading = false;
        console.error('Error uploading document:', error);
      }
    });
  }

  confirmDeleteDirectory(directory: Directory): void {
    this.itemToDelete = {
      type: 'directory',
      id: directory.codigo_diretorio,
      name: directory.nome_diretorio
    };
    this.showDeleteConfirm = true;
  }

  confirmDeleteDocument(document: Documento): void {
    this.itemToDelete = {
      type: 'document',
      id: document.codigo_documento,
      name: document.nome_documento
    };
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.itemToDelete = null;
  }

  executeDelete(): void {
    if (!this.itemToDelete || !this.currentDirectory()) return;
    
    this.deleting = true;
    this.errorMessage.set('');
    
    if (this.itemToDelete.type === 'directory') {
      this.directoryService.deleteDirectory(this.itemToDelete.id).subscribe({
        next: () => {
          this.deleting = false;
          this.closeDeleteConfirm();
          this.showSuccess('Diretório excluído com sucesso!');
          this.reloadCurrentDirectory();
        },
        error: (error) => {
          this.errorMessage.set('Erro ao excluir diretório');
          this.deleting = false;
          console.error('Error deleting directory:', error);
        }
      });
    } else {
      this.directoryService.deleteDocument(this.currentDirectory()!.codigo_diretorio, this.itemToDelete.id).subscribe({
        next: () => {
          this.deleting = false;
          this.closeDeleteConfirm();
          this.showSuccess('Documento excluído com sucesso!');
          this.reloadCurrentDirectory();
        },
        error: (error) => {
          if (error.status === 422) {
            this.errorMessage.set('O documento está associado a uma base de conhecimento.');
          } else {
            this.errorMessage.set('Erro ao excluir documento');
          }
          this.deleting = false;
          console.error('Error deleting document:', error);
        }
      });
    }
  }

  reloadCurrentDirectory(): void {
    const dir = this.currentDirectory();
    if (dir) {
      if (dir.codigo_diretorio === dir.codigo_proprietario) {
        this.loadRootDirectory();
      } else {
        this.loadDirectory(dir.codigo_diretorio);
      }
    }
  }

  showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => {
      this.successMessage.set('');
    }, 3000);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  }

  isRootDirectory(): boolean {
    const dir = this.currentDirectory();
    if (!dir) return true;
    return dir.codigo_diretorio === dir.codigo_proprietario;
  }

  goBack(): void {
    const dir = this.currentDirectory();
    if (!dir || this.isRootDirectory()) return;
    
    const parentId = dir.codigo_diretorio_pai;
    
    // Se o pai for o proprietário, carrega o diretório raiz
    if (parentId === dir.codigo_proprietario) {
      this.loadRootDirectory();
    } else {
      // Caso contrário, carrega o diretório pai
      this.loadDirectory(parentId);
    }
  }
}