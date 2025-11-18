import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardEmpleador } from './features/empleador/dashboard-empleador/dashboard-empleador';
import { AdministrarPerfilEmpleador } from './features/empleador/administrar-perfil-empleador/administrar-perfil-empleador';
import { BuscarPortafoliosComponent } from './features/empleador/buscar-portafolios/buscar-portafolios';
import { GestionUsuariosComponent } from './features/empleador/gestion-usuarios/gestion-usuarios';
import { OpportunityListComponent } from './features/oportunidades/opportunity-list/opportunity-list.component';
import { OpportunityFormComponent } from './features/oportunidades/opportunity-form/opportunity-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard/empleador', component: DashboardEmpleador },
  { path: 'dashboard/empleador/perfil', component: AdministrarPerfilEmpleador },
  { path: 'dashboard/empleador/buscar-candidatos', component: BuscarPortafoliosComponent },
  { path: 'dashboard/empleador/gestion-usuarios', component: GestionUsuariosComponent },
  { path: 'oportunidades', component: OpportunityListComponent },
  { path: 'oportunidades/nueva', component: OpportunityFormComponent },
  { path: 'oportunidades/:id/editar', component: OpportunityFormComponent },
  { path: '**', redirectTo: '/login' }
];
