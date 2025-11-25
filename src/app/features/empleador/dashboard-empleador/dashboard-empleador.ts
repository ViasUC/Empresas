import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { EmpleadorService } from '../../../core/services/empleador.service';

@Component({
  selector: 'app-dashboard-empleador',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard-empleador.html',
  styleUrl: './dashboard-empleador.scss'
})
export class DashboardEmpleador implements OnInit, OnDestroy {
  nombreCompleto: string = '';
  email: string = '';
  nombreEmpresa: string = '';
  telefonoEmpresa: string = '';
  idUsuario: number | null = null;
  idEmpresa: number | null = null;
  private userSubscription?: Subscription;
  private empresaSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private empleadorService: EmpleadorService
  ) {}

  ngOnInit(): void {
    console.log('=== Dashboard Empleador - ngOnInit ===');
    
    // Cargar usuario y empresa actual inmediatamente
    this.cargarDatosUsuario();
    this.cargarDatosEmpresa();
    
    // Suscribirse a cambios del usuario
    this.userSubscription = this.authService.currentUser$.subscribe(usuario => {
      console.log('Usuario actualizado en dashboard:', usuario);
      if (usuario) {
        this.nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
        this.email = usuario.email || '';
        this.idUsuario = usuario.id || null;
        console.log('Dashboard actualizado:', { nombreCompleto: this.nombreCompleto, email: this.email, idUsuario: this.idUsuario });
      } else {
        // Si no hay usuario, intentar cargar desde localStorage
        this.cargarDatosUsuario();
      }
    });

    // Suscribirse a cambios de la empresa
    this.empresaSubscription = this.empleadorService.empresaActualizada$.subscribe(empresa => {
      if (empresa) {
        console.log('Empresa actualizada detectada en dashboard:', empresa);
        this.nombreEmpresa = empresa.nombreEmpresa || empresa.razonSocial || 'Empresa';
        this.telefonoEmpresa = empresa.contacto || '';
        this.idEmpresa = Number(empresa.idEmpresa || empresa.id) || null;
        console.log('Dashboard empresa actualizado:', { 
          nombreEmpresa: this.nombreEmpresa, 
          telefonoEmpresa: this.telefonoEmpresa,
          idEmpresa: this.idEmpresa
        });
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.empresaSubscription) {
      this.empresaSubscription.unsubscribe();
    }
  }

  private cargarDatosUsuario(): void {
    // Intentar obtener usuario actual
    const usuario = this.authService.getCurrentUser();
    
    if (usuario) {
      this.nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
      this.email = usuario.email || '';
      this.idUsuario = usuario.id || null;
      console.log('Datos usuario cargados:', { nombreCompleto: this.nombreCompleto, email: this.email, idUsuario: this.idUsuario });
    } else {
      // Si no hay usuario en el servicio, intentar desde localStorage directamente
      const usuarioStorage = localStorage.getItem('usuario');
      if (usuarioStorage) {
        try {
          const usuarioParsed = JSON.parse(usuarioStorage);
          this.nombreCompleto = `${usuarioParsed.nombre || ''} ${usuarioParsed.apellido || ''}`.trim();
          this.email = usuarioParsed.email || '';
          this.idUsuario = usuarioParsed.id || null;
          console.log('Datos cargados desde localStorage:', { nombreCompleto: this.nombreCompleto, email: this.email, idUsuario: this.idUsuario });
        } catch (error) {
          console.error('Error al parsear usuario de localStorage:', error);
          this.nombreCompleto = 'Usuario';
          this.email = '';
          this.idUsuario = null;
        }
      } else {
        console.warn('No se encontró usuario en servicio ni localStorage');
        this.nombreCompleto = 'Usuario';
        this.email = '';
        this.idUsuario = null;
      }
    }
  }

  private cargarDatosEmpresa(): void {
    // Intentar obtener datos de empresa desde localStorage
    const empresaStorage = localStorage.getItem('empresa');
    if (empresaStorage) {
      try {
        const empresa = JSON.parse(empresaStorage);
        this.nombreEmpresa = empresa.nombreEmpresa || empresa.razonSocial || 'Empresa';
        // El campo en el backend es "contacto", no "telefono"
        this.telefonoEmpresa = empresa.contacto || empresa.telefono || empresa.telefonoContacto || '';
        this.idEmpresa = Number(empresa.idEmpresa || empresa.id) || null;
        console.log('Datos empresa cargados:', { 
          nombreEmpresa: this.nombreEmpresa, 
          telefonoEmpresa: this.telefonoEmpresa,
          idEmpresa: this.idEmpresa,
          empresaCompleta: empresa 
        });
      } catch (error) {
        console.error('Error al parsear empresa de localStorage:', error);
        this.nombreEmpresa = 'Empresa';
        this.telefonoEmpresa = '';
        this.idEmpresa = null;
      }
    } else {
      console.warn('No se encontró empresa en localStorage');
      this.nombreEmpresa = 'Empresa';
      this.telefonoEmpresa = '';
      this.idEmpresa = null;
    }
  }

  irAPerfil(): void {
    this.router.navigate(['/dashboard/empleador/perfil']);
  }

  irAPerfilPublico(): void {
    this.router.navigate(['/dashboard/empleador/perfil-publico']);
  }

  irABusqueda(): void {
    this.router.navigate(['/dashboard/empleador/buscar-candidatos']);
  }

  irAGestionUsuarios(): void {
    this.router.navigate(['/dashboard/empleador/gestion-usuarios']);
  }

  irASolicitarConvenio(): void {
    this.router.navigate(['/dashboard/empleador/solicitar-convenio']);
  }

  irAMisSolicitudes(): void {
    this.router.navigate(['/dashboard/empleador/mis-solicitudes']);
  }

  irAConveniosVigentes(): void {
    this.router.navigate(['/dashboard/empleador/convenios-vigentes']);
  }
  
  irAEndorsements(): void {
    this.router.navigate(['/dashboard/empleador/endorsements']);
  }

  esAdministrador(): boolean {
    // Puedes mejorar esto según cómo guardes el rol en el dashboard
    const empresaStr = localStorage.getItem('empresa');
    if (empresaStr) {
      try {
        const empresa = JSON.parse(empresaStr);
        return empresa.rol_en_empresa === 'ADMINISTRADOR' || empresa.rolEnEmpresa === 'ADMINISTRADOR';
      } catch {
        return false;
      }
    }
    return false;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesion:', error);
        this.router.navigate(['/login']);
      }
    });
  }
}
