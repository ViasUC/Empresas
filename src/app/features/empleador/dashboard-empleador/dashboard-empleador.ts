import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-empleador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-empleador.html',
  styleUrl: './dashboard-empleador.scss'
})
export class DashboardEmpleador implements OnInit {
  nombreCompleto: string = '';
  email: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.getCurrentUser();
    if (usuario) {
      this.nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
      this.email = usuario.email;
    }
  }

  irAPerfil(): void {
    this.router.navigate(['/dashboard/empleador/perfil']);
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
