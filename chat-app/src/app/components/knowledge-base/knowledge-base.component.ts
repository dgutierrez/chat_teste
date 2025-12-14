import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnowledgeBaseService } from '../../services/knowledge-base.service';
import { DirectoryService } from '../../services/directory.service';
import { BaseConhecimento } from '../../models/knowledge-base.model';
import { Directory, Documento } from '../../models/directory.model';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge-base.component.html',
  styleUrls: ['./knowledge-base.component.css']
})
export class KnowledgeBaseComponent implements OnInit {
  knowledgeBases = signal<BaseConhecimento[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Modais
  showCreateDialog = false;
  showDeleteConfirm = false;
  showDocumentPickerDialog = false;
  showDetailsDialog = false;

  // Formulário de criação
  newKnowledgeBaseName = '';
  newKnowledgeBaseDescription = '';

  // Estado de deleção
  knowledgeBaseToDelete: BaseConhecimento | null = null;
  deleting = false;

  // Estado de adição de documento
  selectedKnowledgeBase: BaseConhecimento | null = null;
  currentDirectory = signal<Directory | null>(null);
  selectedDocuments: Documento[] = [];
  addingDocuments = false;

  // Estado de visualização de detalhes
  detailsKnowledgeBase = signal<BaseConhecimento | null>(null);
  loadingDetails = signal(false);

  constructor(
    private knowledgeBaseService: KnowledgeBaseService,
    private directoryService: DirectoryService
  ) {}

  ngOnInit(): void {
    this.loadKnowledgeBases();
  }

  loadKnowledgeBases(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.knowledgeBaseService.getKnowledgeBases().subscribe({
      next: (bases) => {
        this.knowledgeBases.set(bases);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar bases de conhecimento:', error);
        this.errorMessage.set('Erro ao carregar bases de conhecimento');
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    this.newKnowledgeBaseName = '';
    this.newKnowledgeBaseDescription = '';
    this.showCreateDialog = true;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
  }

  createKnowledgeBase(): void {
    if (!this.newKnowledgeBaseName.trim()) {
      this.errorMessage.set('Nome da base de conhecimento é obrigatório');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.knowledgeBaseService.createKnowledgeBase({
      nome_base_conhecimento: this.newKnowledgeBaseName,
      descricao_base_conhecimento: this.newKnowledgeBaseDescription,
      idEscopoBaseConhecimento: 1, // Privado
      codigo_diretorio: ''
    }).subscribe({
      next: (newBase) => {
        this.knowledgeBases.update(bases => [...bases, newBase]);
        this.successMessage.set('Base de conhecimento criada com sucesso');
        this.closeCreateDialog();
        this.loading.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        console.error('Erro ao criar base de conhecimento:', error);
        this.errorMessage.set('Erro ao criar base de conhecimento');
        this.loading.set(false);
      }
    });
  }

  openDeleteConfirm(knowledgeBase: BaseConhecimento): void {
    this.knowledgeBaseToDelete = knowledgeBase;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.knowledgeBaseToDelete = null;
  }

  confirmDelete(): void {
    if (!this.knowledgeBaseToDelete) return;

    this.deleting = true;
    this.errorMessage.set('');

    this.knowledgeBaseService.deleteKnowledgeBase(this.knowledgeBaseToDelete.codigo_base_conhecimento).subscribe({
      next: () => {
        this.knowledgeBases.update(bases => 
          bases.filter(b => b.codigo_base_conhecimento !== this.knowledgeBaseToDelete?.codigo_base_conhecimento)
        );
        this.successMessage.set('Base de conhecimento deletada com sucesso');
        this.closeDeleteConfirm();
        this.deleting = false;
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        console.error('Erro ao deletar base de conhecimento:', error);
        this.errorMessage.set('Erro ao deletar base de conhecimento');
        this.deleting = false;
      }
    });
  }

  openDocumentPicker(knowledgeBase: BaseConhecimento): void {
    this.selectedKnowledgeBase = knowledgeBase;
    this.selectedDocuments = [];
    this.loadRootDirectory();
    this.showDocumentPickerDialog = true;
  }

  closeDocumentPicker(): void {
    this.showDocumentPickerDialog = false;
    this.selectedKnowledgeBase = null;
    this.selectedDocuments = [];
    this.currentDirectory.set(null);
  }

  loadRootDirectory(): void {
    this.directoryService.getDirectories().subscribe({
      next: (response) => {
        this.currentDirectory.set(response.data);
      },
      error: (error) => {
        console.error('Erro ao carregar diretório:', error);
        this.errorMessage.set('Erro ao carregar diretório');
      }
    });
  }

  navigateToDirectory(directory: Directory): void {
    this.directoryService.getDirectoryById(directory.codigo_diretorio).subscribe({
      next: (response) => {
        this.currentDirectory.set(response.data);
      },
      error: (error) => {
        console.error('Erro ao navegar para o diretório:', error);
        this.errorMessage.set('Erro ao carregar diretório');
      }
    });
  }

  navigateBack(): void {
    const current = this.currentDirectory();
    if (!current || !current.codigo_diretorio_pai) return;

    this.directoryService.getDirectoryById(current.codigo_diretorio_pai).subscribe({
      next: (response) => {
        this.currentDirectory.set(response.data);
      },
      error: (error) => {
        console.error('Erro ao navegar para o diretório pai:', error);
        this.errorMessage.set('Erro ao carregar diretório');
      }
    });
  }

  toggleDocumentSelection(document: Documento): void {
    const index = this.selectedDocuments.findIndex(d => d.codigo_documento === document.codigo_documento);
    if (index > -1) {
      this.selectedDocuments.splice(index, 1);
    } else {
      this.selectedDocuments.push(document);
    }
  }

  isDocumentSelected(document: Documento): boolean {
    return this.selectedDocuments.some(d => d.codigo_documento === document.codigo_documento);
  }

  addSelectedDocuments(): void {
    if (!this.selectedKnowledgeBase || this.selectedDocuments.length === 0) return;

    this.addingDocuments = true;
    this.errorMessage.set('');

    const requests = this.selectedDocuments.map(doc =>
      this.knowledgeBaseService.addDocumentToKnowledgeBase(
        this.selectedKnowledgeBase!.codigo_base_conhecimento,
        doc.codigo_documento
      )
    );

    let completed = 0;
    let errors = 0;

    requests.forEach(request => {
      request.subscribe({
        next: () => {
          completed++;
          if (completed + errors === requests.length) {
            this.finishAddingDocuments(completed, errors);
          }
        },
        error: (error) => {
          console.error('Erro ao adicionar documento:', error);
          errors++;
          if (completed + errors === requests.length) {
            this.finishAddingDocuments(completed, errors);
          }
        }
      });
    });
  }

  private finishAddingDocuments(completed: number, errors: number): void {
    if (errors === 0) {
      this.successMessage.set(`${completed} documento(s) adicionado(s) com sucesso`);
    } else if (completed === 0) {
      this.errorMessage.set('Erro ao adicionar documentos');
    } else {
      this.successMessage.set(`${completed} documento(s) adicionado(s), ${errors} erro(s)`);
    }

    this.closeDocumentPicker();
    this.addingDocuments = false;
    this.loadKnowledgeBases(); // Recarrega para atualizar a lista
    setTimeout(() => {
      this.successMessage.set('');
      this.errorMessage.set('');
    }, 3000);
  }

  formatSize(sizeInMB: number): string {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(2)} KB`;
    }
    return `${sizeInMB.toFixed(2)} MB`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  openDetails(knowledgeBase: BaseConhecimento): void {
    this.loadingDetails.set(true);
    this.showDetailsDialog = true;
    this.errorMessage.set('');

    // Busca os detalhes completos da base de conhecimento
    this.knowledgeBaseService.getKnowledgeBaseById(knowledgeBase.codigo_base_conhecimento).subscribe({
      next: (details) => {
        this.detailsKnowledgeBase.set(details);
        this.loadingDetails.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar detalhes:', error);
        this.errorMessage.set('Erro ao carregar detalhes da base de conhecimento');
        this.loadingDetails.set(false);
        this.closeDetails();
      }
    });
  }

  closeDetails(): void {
    this.showDetailsDialog = false;
    this.detailsKnowledgeBase.set(null);
  }
}
