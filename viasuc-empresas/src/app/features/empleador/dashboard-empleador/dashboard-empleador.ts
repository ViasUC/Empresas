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
