import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardEmpleador } from './features/empleador/dashboard-empleador/dashboard-empleador';
// import { SearchPortfolioComponent } from './features/search/search-portfolio.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard/empleador', component: DashboardEmpleador },
  // { path: 'search', component: SearchPortfolioComponent }, // Temporalmente deshabilitado
  { path: '**', redirectTo: '/login' }
];
