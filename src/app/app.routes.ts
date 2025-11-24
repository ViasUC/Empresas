import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardEmpleador } from './features/empleador/dashboard-empleador/dashboard-empleador';
import { AdministrarPerfilEmpleador } from './features/empleador/administrar-perfil-empleador/administrar-perfil-empleador';
import { BuscarPortafoliosComponent } from './features/empleador/buscar-portafolios/buscar-portafolios';
import { GestionUsuariosComponent } from './features/empleador/gestion-usuarios/gestion-usuarios';
// Módulo Oportunidades
import { OpportunityListComponent } from './features/oportunidades/opportunity-list/opportunity-list.component';
import { OpportunityFormComponent } from './features/oportunidades/opportunity-form/opportunity-form.component';
// Módulo Convenios
import { SolicitarConvenioComponent } from './features/empleador/solicitar-convenio/solicitar-convenio';
import { MisSolicitudesComponent } from './features/empleador/mis-solicitudes/mis-solicitudes';
import { ConveniosVigentesComponent } from './features/empleador/convenios-vigentes/convenios-vigentes';
// Módulo Endorsements
import { EmpresaEndorsementsComponent } from './features/empleador/empresa-endorsements/empresa-endorsements';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard/empleador', component: DashboardEmpleador },
  { path: 'dashboard/empleador/perfil', component: AdministrarPerfilEmpleador },
  { path: 'dashboard/empleador/buscar-candidatos', component: BuscarPortafoliosComponent },
  { path: 'dashboard/empleador/gestion-usuarios', component: GestionUsuariosComponent },
  // Rutas Oportunidades
  { path: 'oportunidades', component: OpportunityListComponent },
  { path: 'oportunidades/nueva', component: OpportunityFormComponent },
  { path: 'oportunidades/:id/editar', component: OpportunityFormComponent },
  // Rutas Convenios
  { path: 'dashboard/empleador/solicitar-convenio', component: SolicitarConvenioComponent },
  { path: 'dashboard/empleador/mis-solicitudes', component: MisSolicitudesComponent },
  { path: 'dashboard/empleador/convenios-vigentes', component: ConveniosVigentesComponent },
  // Rutas Endorsements
  { path: 'dashboard/empleador/endorsements', component: EmpresaEndorsementsComponent },
  { path: '**', redirectTo: '/login' }
];
