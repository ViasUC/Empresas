import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioEmpresaService, UsuarioEmpresa, RolEmpresa, SolicitudAcceso } from '../services/usuario-empresa.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrls: ['./gestion-usuarios.scss']
})
export class GestionUsuariosComponent implements OnInit {
  // Tabs
  tabActiva: 'usuarios' | 'solicitudes' = 'usuarios';
  
  // Usuarios
  usuarios: UsuarioEmpresa[] = [];
  
  // Solicitudes pendientes
  solicitudes: SolicitudAcceso[] = [];
  
  cargando = false;
  error: string | null = null;
  idEmpresa: number = 0;
  idUsuarioActual: string = '';
  rolActual: RolEmpresa | null = null;
  
  // Modal de edición de rol
  mostrarModalRol = false;
  usuarioEditando: UsuarioEmpresa | null = null;
  nuevoRol: RolEmpresa = RolEmpresa.AUXILIAR_RRHH;
  
  RolEmpresa = RolEmpresa;
  rolesDisponibles = [
    { valor: RolEmpresa.ADMINISTRADOR, nombre: 'Administrador' },
    { valor: RolEmpresa.GERENTE_RRHH, nombre: 'Gerente de RRHH' },
    { valor: RolEmpresa.AUXILIAR_RRHH, nombre: 'Auxiliar de RRHH' }
  ];

  constructor(
    private usuarioEmpresaService: UsuarioEmpresaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.error = 'Debes iniciar sesión para acceder a esta página';
      this.router.navigate(['/login']);
      return;
    }
    
    const usuario = this.authService.getCurrentUser();
    
    if (!usuario) {
      this.error = 'No se encontró el usuario actual. Por favor, inicia sesión nuevamente.';
      return;
    }
    
    if (!usuario.id) {
      this.error = 'Error: El usuario no tiene un ID válido';
      return;
    }
    
    this.idUsuarioActual = usuario.id.toString();
    
    this.cargarIdEmpresa();
  }

  cargarIdEmpresa(): void {
    // Obtener ID de empresa del localStorage
    const empresaStr = localStorage.getItem('empresa');
    
    if (empresaStr) {
      try {
        const empresa = JSON.parse(empresaStr);
        this.idEmpresa = parseInt(empresa.id || empresa.idEmpresa, 10);
        
        if (this.idEmpresa && !isNaN(this.idEmpresa)) {
          this.cargarDatos();
        } else {
          this.error = 'ID de empresa inválido';
        }
      } catch (e) {
        this.error = 'Error al obtener información de la empresa';
      }
    } else {
      this.error = 'No se encontró información de la empresa';
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    // Cargar rol del usuario actual
    this.usuarioEmpresaService.obtenerRolUsuario(this.idEmpresa, this.idUsuarioActual)
      .subscribe({
        next: (rol) => {
          this.rolActual = rol;
          // Solo si es ADMINISTRADOR puede ver la lista
          if (rol === RolEmpresa.ADMINISTRADOR) {
            this.cargarUsuarios();
          } else {
            this.cargando = false;
          }
        },
        error: (err) => {
          this.cargando = false;
          this.error = 'Error al verificar permisos: ' + (err.message || 'Error desconocido');
        }
      });
  }

  cargarUsuarios(): void {
    this.usuarioEmpresaService.listarUsuariosEmpresa(this.idEmpresa)
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios;
          this.cargando = false;
          // También cargar solicitudes para tener el contador
          this.cargarSolicitudes();
        },
        error: (err) => {
          console.error('Error al cargar usuarios:', err);
          this.error = 'Error al cargar la lista de usuarios';
          this.cargando = false;
        }
      });
  }

  cargarSolicitudes(): void {
    this.usuarioEmpresaService.listarSolicitudesPendientes(this.idEmpresa)
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes = solicitudes;
        },
        error: (err) => {
          // No mostrar error aquí, es secundario
        }
      });
  }

  cambiarTab(tab: 'usuarios' | 'solicitudes'): void {
    this.tabActiva = tab;
    this.error = null;
  }

  aprobarSolicitud(solicitud: SolicitudAcceso): void {
    if (!confirm(`¿Aprobar la solicitud de ${solicitud.usuario.nombre} ${solicitud.usuario.apellido}?`)) {
      return;
    }

    this.cargando = true;
    this.usuarioEmpresaService.aprobarUsuario(
      this.idEmpresa,
      solicitud.idUsuario,
      this.idUsuarioActual
    ).subscribe({
      next: () => {
        this.cargarUsuarios(); // Recarga usuarios y solicitudes
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al aprobar solicitud:', err);
        this.error = err.message || 'Error al aprobar la solicitud';
        this.cargando = false;
      }
    });
  }

  rechazarSolicitud(solicitud: SolicitudAcceso): void {
    if (!confirm(`¿Rechazar la solicitud de ${solicitud.usuario.nombre} ${solicitud.usuario.apellido}? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.cargando = true;
    this.usuarioEmpresaService.rechazarUsuario(
      this.idEmpresa,
      solicitud.idUsuario,
      this.idUsuarioActual
    ).subscribe({
      next: () => {
        this.cargarUsuarios(); // Recarga usuarios y solicitudes
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al rechazar solicitud:', err);
        this.error = err.message || 'Error al rechazar la solicitud';
        this.cargando = false;
      }
    });
  }

  abrirModalCambiarRol(usuario: UsuarioEmpresa): void {
    this.usuarioEditando = usuario;
    this.nuevoRol = usuario.rolEnEmpresa;
    this.mostrarModalRol = true;
  }

  cerrarModalRol(): void {
    this.mostrarModalRol = false;
    this.usuarioEditando = null;
  }

  cambiarRol(): void {
    if (!this.usuarioEditando) return;

    this.cargando = true;
    this.usuarioEmpresaService.cambiarRolUsuario(
      this.idEmpresa,
      this.usuarioEditando.idUsuario,
      this.nuevoRol,
      this.idUsuarioActual
    ).subscribe({
      next: () => {
        this.cerrarModalRol();
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al cambiar rol:', err);
        this.error = err.message || 'Error al cambiar el rol del usuario';
        this.cargando = false;
      }
    });
  }

  desactivarUsuario(usuario: UsuarioEmpresa): void {
    if (!confirm(`¿Estás seguro de desactivar a ${usuario.usuario.nombre} ${usuario.usuario.apellido}?`)) {
      return;
    }

    this.cargando = true;
    this.usuarioEmpresaService.desactivarUsuario(
      this.idEmpresa,
      usuario.idUsuario,
      this.idUsuarioActual
    ).subscribe({
      next: () => {
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al desactivar usuario:', err);
        this.error = err.message || 'Error al desactivar el usuario';
        this.cargando = false;
      }
    });
  }

  getNombreRol(rol: RolEmpresa): string {
    return this.usuarioEmpresaService.getNombreRol(rol);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PY');
  }

  esAdministrador(): boolean {
    return this.rolActual === RolEmpresa.ADMINISTRADOR;
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }

  getRolClass(rol: RolEmpresa): string {
    switch (rol) {
      case RolEmpresa.ADMINISTRADOR:
        return 'rol-administrador';
      case RolEmpresa.GERENTE_RRHH:
        return 'rol-gerente';
      case RolEmpresa.AUXILIAR_RRHH:
        return 'rol-auxiliar';
      default:
        return '';
    }
  }

  confirmarDesactivar(usuario: UsuarioEmpresa): void {
    if (confirm(`¿Estás seguro de desactivar a ${usuario.usuario.nombre} ${usuario.usuario.apellido}?\n\nEl usuario no podrá acceder al sistema hasta que sea reactivado.`)) {
      this.desactivarUsuario(usuario);
    }
  }
}
