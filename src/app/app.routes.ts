import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardEmpleador } from './features/empleador/dashboard-empleador/dashboard-empleador';
import { AdministrarPerfilEmpleador } from './features/empleador/administrar-perfil-empleador/administrar-perfil-empleador';
import { BuscarPortafoliosComponent } from './features/empleador/buscar-portafolios/buscar-portafolios';
import { GestionUsuariosComponent } from './features/empleador/gestion-usuarios/gestion-usuarios';
import { OpportunityListComponent } from './oportunidades/components/opportunity-list/opportunity-list.component';
import { OpportunityFormComponent } from './oportunidades/components/opportunity-form/opportunity-form.component';
import { PostulacionesEmpresaComponent } from './features/empleador/postulaciones-empresa/postulaciones-empresa.component';
import { SolicitarConvenioComponent } from './features/empleador/solicitar-convenio/solicitar-convenio';
import { MisSolicitudesComponent } from './features/empleador/mis-solicitudes/mis-solicitudes';
import { ConveniosVigentesComponent } from './features/empleador/convenios-vigentes/convenios-vigentes';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  { path: 'dashboard/empleador', component: DashboardEmpleador },
  { path: 'dashboard/empleador/perfil', component: AdministrarPerfilEmpleador },
  { path: 'dashboard/empleador/buscar-candidatos', component: BuscarPortafoliosComponent },
  { path: 'dashboard/empleador/gestion-usuarios', component: GestionUsuariosComponent },
  { path: 'dashboard/empleador/solicitar-convenio', component: SolicitarConvenioComponent },
  { path: 'dashboard/empleador/mis-solicitudes', component: MisSolicitudesComponent },
  { path: 'dashboard/empleador/convenios-vigentes', component: ConveniosVigentesComponent },
  
  { path: 'oportunidades', component: OpportunityListComponent },
  { path: 'oportunidades/nueva', component: OpportunityFormComponent },
  { path: 'oportunidades/:id/editar', component: OpportunityFormComponent },
  
  { path: 'empleador/postulaciones', component: PostulacionesEmpresaComponent },
  
  { path: '**', redirectTo: '/login' }
];
