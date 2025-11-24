import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardEmpleador } from './features/empleador/dashboard-empleador/dashboard-empleador';
import { AdministrarPerfilEmpleador } from './features/empleador/administrar-perfil-empleador/administrar-perfil-empleador';
import { BuscarPortafoliosComponent } from './features/empleador/buscar-portafolios/buscar-portafolios';
import { EmpresaEndorsementsComponent } from './features/empleador/empresa-endorsements/empresa-endorsements';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard/empleador', component: DashboardEmpleador },
  { path: 'dashboard/empleador/perfil', component: AdministrarPerfilEmpleador },
  { path: 'dashboard/empleador/buscar-candidatos', component: BuscarPortafoliosComponent },
  { path: 'dashboard/empleador/endorsements', component: EmpresaEndorsementsComponent },
  { path: '**', redirectTo: '/login' }
];
