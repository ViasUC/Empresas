import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConvenioService } from '../../../core/services/convenio.service';

@Component({
  selector: 'app-convenios-vigentes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './convenios-vigentes.html',
  styleUrl: './convenios-vigentes.scss'
})
export class ConveniosVigentesComponent implements OnInit {
  convenios: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private convenioService: ConvenioService
  ) {}

  ngOnInit(): void {
    this.cargarConvenios();
  }

  cargarConvenios(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.convenioService.listarConveniosVigentes().subscribe({
      next: (response: any) => {
        this.convenios = response.convenios || [];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar convenios:', error);
        this.errorMessage = 'Error al cargar los convenios';
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }
}
