import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'auth/login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: '**', redirectTo: '' }
];
