import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  Postulacion,
  PostulacionesEmpresaResponse,
} from '../../../core/models/postulacion.model';
import { PostulacionesService } from '../../../core/services/postulaciones.service';
import { AuthService } from '../../../core/services/auth.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-postulaciones-empresa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './postulaciones-empresa.component.html',
  styleUrls: ['./postulaciones-empresa.component.scss'],
})
export class PostulacionesEmpresaComponent implements OnInit {
  postulaciones: Postulacion[] = [];
  total = 0;
  page = 0;

  loading = false;
  errorMessage: string | null = null;

  constructor(
    private postulacionesService: PostulacionesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPagina(0);
  }

  cargarPagina(page: number): void {
    this.loading = true;
    this.errorMessage = null;

    const usuarioActual = this.authService.getCurrentUser();

    if (!usuarioActual || !usuarioActual.id) {
      this.loading = false;
      this.errorMessage = 'No se encontró el usuario autenticado.';
      return;
    }

    const idOfertante = usuarioActual.id.toString();

    this.postulacionesService
      .getPostulacionesEmpresa({
        idOfertante,
        page,
        size: PAGE_SIZE,
        sort: 'fechaPostulacion,desc',
        filtro: null,
      })
      .subscribe({
        next: (res: PostulacionesEmpresaResponse) => {
          const payload = res.postulacionesEmpresa;
          this.postulaciones = payload.items;
          this.total = payload.total;
          this.page = payload.page;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar postulaciones:', err);
          this.errorMessage = 'Error al cargar las postulaciones.';
          this.loading = false;
        },
      });
  }

  paginaAnterior(): void {
    if (this.page > 0) {
      this.cargarPagina(this.page - 1);
    }
  }

  paginaSiguiente(): void {
    const maxPage = Math.floor((this.total - 1) / PAGE_SIZE);
    if (this.page < maxPage) {
      this.cargarPagina(this.page + 1);
    }
  }

  get puedeIrAtras(): boolean {
    return this.page > 0;
  }

  get puedeIrAdelante(): boolean {
    return (this.page + 1) * PAGE_SIZE < this.total;
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  recargar(): void {
    this.cargarPagina(this.page);
  }

  getEstadoClass(estado: string): string {
    const estadoLower = estado?.toLowerCase() || '';
    if (estadoLower === 'pendiente') return 'estado-pendiente';
    if (estadoLower === 'aceptada') return 'estado-aceptada';
    if (estadoLower === 'rechazada') return 'estado-rechazada';
    if (estadoLower === 'cancelada') return 'estado-cancelada';
    return 'estado-default';
  }
}
