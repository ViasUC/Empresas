import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BusquedaService, Portafolio, FiltrosDisponibles, ResultadoBusqueda } from '../services/busqueda.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-buscar-portafolios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './buscar-portafolios.html',
  styleUrl: './buscar-portafolios.scss'
})
export class BuscarPortafoliosComponent implements OnInit {
  filtrosForm!: FormGroup;
  filtrosDisponibles: FiltrosDisponibles | null = null;
  resultados: Portafolio[] = [];
  total: number = 0;
  paginaActual: number = 1;
  totalPaginas: number = 0;
  cargando: boolean = false;
  busquedaRealizada: boolean = false;

  constructor(
    private fb: FormBuilder,
    private busquedaService: BusquedaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Inicializar formulario de filtros
    this.filtrosForm = this.fb.group({
      carrera: [''],
      habilidades: [''],
      ubicacion: ['']
    });

    // Cargar filtros disponibles
    this.cargarFiltrosDisponibles();

    // Realizar busqueda inicial (sin filtros)
    this.buscar();
  }

  cargarFiltrosDisponibles(): void {
    this.busquedaService.obtenerFiltros().subscribe({
      next: (filtros) => {
        this.filtrosDisponibles = filtros;
        console.log('Filtros disponibles cargados:', filtros);
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
        alert('Error al cargar filtros de busqueda');
      }
    });
  }

  buscar(pagina: number = 1): void {
    this.cargando = true;
    this.paginaActual = pagina;
    this.busquedaRealizada = true;

    const formValue = this.filtrosForm.value;
    
    // Construir filtros
    const filtros: any = {
      pagina,
      limite: 20
    };

    if (formValue.carrera) {
      filtros.carrera = formValue.carrera;
    }

    if (formValue.habilidades) {
      // Dividir habilidades por comas
      const habilidadesArray = formValue.habilidades
        .split(',')
        .map((h: string) => h.trim())
        .filter((h: string) => h.length > 0);
      
      if (habilidadesArray.length > 0) {
        filtros.habilidades = habilidadesArray;
      }
    }

    if (formValue.ubicacion) {
      filtros.ubicacion = formValue.ubicacion;
    }

    console.log('Buscando con filtros:', filtros);

    this.busquedaService.buscarPortafolios(filtros).subscribe({
      next: (resultado: ResultadoBusqueda) => {
        this.resultados = resultado.portafolios;
        this.total = resultado.total;
        this.totalPaginas = resultado.totalPaginas;
        this.cargando = false;
        console.log(`Busqueda completada: ${this.resultados.length} resultados de ${this.total} total`);
      },
      error: (error) => {
        console.error('Error en busqueda:', error);
        this.cargando = false;
        alert('Error al buscar portafolios. Por favor intente nuevamente.');
      }
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.buscar(1);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.buscar(this.paginaActual - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.buscar(this.paginaActual + 1);
    }
  }

  verPortafolio(portafolio: Portafolio): void {
    // TODO: Implementar vista de portafolio detallado
    console.log('Ver portafolio:', portafolio);
    alert(`Funcionalidad en desarrollo: Ver portafolio de ${portafolio.nombre} ${portafolio.apellido}`);
  }

  invitarPostular(portafolio: Portafolio): void {
    // TODO: Implementar invitar a postular
    console.log('Invitar a postular:', portafolio);
    alert(`Funcionalidad en desarrollo: Invitar a ${portafolio.nombre} ${portafolio.apellido}`);
  }

  descargarPerfil(portafolio: Portafolio): void {
    // TODO: Implementar descarga de perfil
    console.log('Descargar perfil:', portafolio);
    alert(`Funcionalidad en desarrollo: Descargar perfil de ${portafolio.nombre} ${portafolio.apellido}`);
  }

  enviarMensaje(portafolio: Portafolio): void {
    // TODO: Implementar mensajeria
    console.log('Enviar mensaje:', portafolio);
    alert(`Funcionalidad en desarrollo: Mensaje a ${portafolio.nombre} ${portafolio.apellido}`);
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
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
