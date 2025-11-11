import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'auth/login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'auth/password-reset', loadComponent: () => import('./pages/auth/password-reset/password-reset.component').then(m => m.PasswordResetComponent) },
  { path: 'auth/google/callback', loadComponent: () => import('./pages/auth/google-callback/google-callback.component').then(m => m.GoogleCallbackComponent) },
  { path: 'references', canActivate: [authGuard], loadComponent: () => import('./pages/references/references-list/references-list.component').then(m => m.ReferencesListComponent) },
  { path: 'references/major/:id', canActivate: [authGuard], loadComponent: () => import('./pages/references/topics-list/topics-list.component').then(m => m.TopicsListComponent) },
  { path: 'references/topic/:id', canActivate: [authGuard], loadComponent: () => import('./pages/references/references-by-topic/references-by-topic.component').then(m => m.ReferencesByTopicComponent) },
  { path: 'references/:id', canActivate: [authGuard], loadComponent: () => import('./pages/references/reference-detail/reference-detail.component').then(m => m.ReferenceDetailComponent) },
  { path: 'quiz/:referenceId', canActivate: [authGuard], loadComponent: () => import('./pages/quiz/quiz.component').then(m => m.QuizComponent) },
  { path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
  { path: 'blog-gallery', loadComponent: () => import('./pages/blog/blog-gallery/blog-gallery.component').then(m => m.BlogGalleryComponent) },
  { path: 'blog', loadComponent: () => import('./pages/blog/blog-list/blog-list.component').then(m => m.BlogListComponent) },
  { path: 'blog/:id', loadComponent: () => import('./pages/blog/blog-detail/blog-detail.component').then(m => m.BlogDetailComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'documents', canActivate: [authGuard], loadComponent: () => import('./pages/student-documents/student-documents.component').then(m => m.StudentDocumentsComponent) },
  { path: 'enrollment', canActivate: [authGuard], loadComponent: () => import('./pages/enrollment/enrollment.component').then(m => m.EnrollmentComponent) },
  { path: 'points', canActivate: [authGuard], loadComponent: () => import('./pages/points/points.component').then(m => m.PointsComponent) },
  { path: 'discounts', canActivate: [authGuard], loadComponent: () => import('./pages/discounts/discounts.component').then(m => m.DiscountsComponent) },
  { path: 'admin', canActivate: [authGuard], loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'admin/references/new', canActivate: [authGuard], loadComponent: () => import('./pages/admin/reference-editor/reference-editor.component').then(m => m.ReferenceEditorComponent) },
  { path: 'admin/references/:id/edit', canActivate: [authGuard], loadComponent: () => import('./pages/admin/reference-editor/reference-editor.component').then(m => m.ReferenceEditorComponent) },
  { path: '404', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
