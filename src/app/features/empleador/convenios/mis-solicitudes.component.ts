import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ConvenioService, ConvenioOutput } from '../services/convenio.service';

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-solicitudes.component.html',
  styleUrls: ['./mis-solicitudes.component.scss']
})
export class MisSolicitudesComponent implements OnInit {
  
  solicitudes: ConvenioOutput[] = [];
  isLoading = false;
  errorMessage = '';
  selectedSolicitud: ConvenioOutput | null = null;

  constructor(
    private convenioService: ConvenioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.convenioService.listarSolicitudes().subscribe({
      next: (response) => {
        this.solicitudes = response.solicitudes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
        this.errorMessage = 'Error al cargar las solicitudes. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  verDetalle(solicitud: ConvenioOutput): void {
    this.selectedSolicitud = solicitud;
  }

  cerrarDetalle(): void {
    this.selectedSolicitud = null;
  }

  getEstadoClass(estado: string): string {
    const estadoMap: { [key: string]: string } = {
      'Pendiente': 'estado-pendiente',
      'En Revisión': 'estado-revision',
      'Aprobado': 'estado-aprobado',
      'Rechazado': 'estado-rechazado',
      'Vigente': 'estado-vigente'
    };
    return estadoMap[estado] || 'estado-default';
  }

  getEstadoIcon(estado: string): string {
    const iconMap: { [key: string]: string } = {
      'Pendiente': '[P]',
      'En Revisión': '[R]',
      'Aprobado': '[OK]',
      'Rechazado': '[X]',
      'Vigente': '[V]'
    };
    return iconMap[estado] || '[?]';
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  nuevaSolicitud(): void {
    this.router.navigate(['/empleador/convenios/solicitar']);
  }
}
