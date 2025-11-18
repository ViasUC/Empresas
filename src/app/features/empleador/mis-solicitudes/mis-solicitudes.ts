import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ConvenioService } from '../services/convenio.service';

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './mis-solicitudes.html',
  styleUrl: './mis-solicitudes.scss'
})
export class MisSolicitudesComponent implements OnInit {
  solicitudes: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private convenioService: ConvenioService
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.convenioService.listarSolicitudes().subscribe({
      next: (response) => {
        this.solicitudes = response.solicitudes || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
        this.errorMessage = 'Error al cargar las solicitudes';
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }
}
