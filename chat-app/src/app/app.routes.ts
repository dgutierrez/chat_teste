import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { ChatListComponent } from './components/chat-list/chat-list.component';
import { ChatComponent } from './components/chat/chat.component';
import { DirectoryComponent } from './components/directory/directory.component';
import { KnowledgeBaseComponent } from './components/knowledge-base/knowledge-base.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'chats', component: ChatListComponent, canActivate: [authGuard] },
  { path: 'chat/:id', component: ChatComponent, canActivate: [authGuard] },
  { path: 'directory', component: DirectoryComponent, canActivate: [authGuard] },
  { path: 'knowledge-base', component: KnowledgeBaseComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
