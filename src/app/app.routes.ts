import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardEmpleador } from './features/empleador/dashboard-empleador/dashboard-empleador';
import { AdministrarPerfilEmpleador } from './features/empleador/administrar-perfil-empleador/administrar-perfil-empleador';
import { BuscarPortafoliosComponent } from './features/empleador/buscar-portafolios/buscar-portafolios';
import { OpportunityListComponent } from './oportunidades/components/opportunity-list/opportunity-list.component';
import { OpportunityFormComponent } from './oportunidades/components/opportunity-form/opportunity-form.component';
import { PostulacionesEmpresaComponent } from './features/empleador/postulaciones-empresa/postulaciones-empresa.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  {
    path: 'oportunidades',
    children: [
      {
        path: '',
        component: OpportunityListComponent,
      },
      {
        path: 'nueva',
        component: OpportunityFormComponent,
      },
      {
        path: ':id/editar',
        component: OpportunityFormComponent,
      },
    ],
  },
  
  {
    path: 'dashboard/empleador',
    component: DashboardEmpleador,
  },
  {
    path: 'dashboard/empleador/perfil',
    component: AdministrarPerfilEmpleador,
  },
  {
    path: 'dashboard/empleador/buscar-candidatos',
    component: BuscarPortafoliosComponent,
  },
  {
    path: 'empleador/postulaciones',
    component: PostulacionesEmpresaComponent,
  },
  
  { path: '**', redirectTo: '/login' },
];
