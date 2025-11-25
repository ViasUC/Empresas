import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConvenioService } from '../../../core/services/convenio.service';

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, FormsModule],
  templateUrl: './mis-solicitudes.html',
  styleUrl: './mis-solicitudes.scss'
})
export class MisSolicitudesComponent implements OnInit {
  solicitudes: any[] = [];
  solicitudesFiltradas: any[] = [];
  loading = false;
  errorMessage = '';
  convenioEditando: any = null;
  formEdicion!: FormGroup;
  guardando = false;
  
  // Filtros
  filtroEstado: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  constructor(
    private router: Router,
    private convenioService: ConvenioService,
    private fb: FormBuilder
  ) {
    this.inicializarFormulario();
    // No inicializar fechas automáticamente - dejar que el usuario filtre manualmente
  }

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  inicializarFechasDelMes(): void {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // Formatear a YYYY-MM-DD para los inputs tipo date
    this.filtroFechaInicio = this.formatearFechaYYYYMMDD(primerDia);
    this.filtroFechaFin = this.formatearFechaYYYYMMDD(ultimoDia);
  }

  formatearFechaYYYYMMDD(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  inicializarFormulario(): void {
    this.formEdicion = this.fb.group({
      institucion: ['', Validators.required],
      descripcion: ['', Validators.required],
      fechaIni: ['', Validators.required],
      fechaFin: ['', Validators.required],
      responsables: ['', Validators.required],
      duracion: [''],
      cantHoras: [''],
      objetivos: [''],
      beneficios: ['']
    });
  }

  cargarSolicitudes(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.convenioService.listarSolicitudes().subscribe({
      next: (response: any) => {
        this.solicitudes = response.solicitudes || [];
        this.solicitudesFiltradas = [...this.solicitudes];
        this.loading = false;
        this.aplicarFiltros();
      },
      error: (error: any) => {
        console.error('Error al cargar solicitudes:', error);
        this.errorMessage = 'Error al cargar las solicitudes';
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    console.log('Aplicando filtros:', {
      estado: this.filtroEstado,
      fechaInicio: this.filtroFechaInicio,
      fechaFin: this.filtroFechaFin,
      totalSolicitudes: this.solicitudes.length
    });

    this.solicitudesFiltradas = this.solicitudes.filter((solicitud: any) => {
      // Filtro por estado
      if (this.filtroEstado && solicitud.estado !== this.filtroEstado) {
        console.log('Filtrado por estado:', solicitud.estado, '!==', this.filtroEstado);
        return false;
      }

      // Filtro por rango de fechas - solo si están definidos
      if (this.filtroFechaInicio) {
        const fechaIniSolicitud = this.convertirFechaADate(solicitud.fechaIni);
        const fechaFiltroInicio = new Date(this.filtroFechaInicio);
        // Excluir si la fecha de inicio del convenio es ANTES del filtro
        if (fechaIniSolicitud < fechaFiltroInicio) {
          console.log('Filtrado por fecha inicio:', fechaIniSolicitud, '<', fechaFiltroInicio);
          return false;
        }
      }

      if (this.filtroFechaFin) {
        const fechaIniSolicitud = this.convertirFechaADate(solicitud.fechaIni);
        const fechaFiltroFin = new Date(this.filtroFechaFin);
        // Excluir si la fecha de inicio del convenio es DESPUES del filtro de fin
        if (fechaIniSolicitud > fechaFiltroFin) {
          console.log('Filtrado por fecha fin:', fechaIniSolicitud, '>', fechaFiltroFin);
          return false;
        }
      }

      return true;
    });

    console.log('Convenios filtrados:', this.solicitudesFiltradas.length);
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.aplicarFiltros();
  }

  convertirFechaADate(fecha: string): Date {
    // Si la fecha viene en formato DD/MM/YYYY
    if (fecha.includes('/')) {
      const partes = fecha.split('/');
      return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    }
    // Si ya viene en formato YYYY-MM-DD
    return new Date(fecha);
  }

  aprobarConvenio(convenio: any): void {
    if (!confirm('¿Estás seguro de aprobar este convenio?')) {
      return;
    }

    this.convenioService.aprobarConvenio(convenio.idConven).subscribe({
      next: (response: any) => {
        alert('Convenio aprobado exitosamente');
        // Recargar la lista para obtener el estado actualizado
        this.cargarSolicitudes();
      },
      error: (error: any) => {
        console.error('Error al aprobar convenio:', error);
        alert('Error al aprobar el convenio. Por favor intenta nuevamente.');
      }
    });
  }

  toggleActivo(convenio: any): void {
    // Determinar el estado actual basado en el campo estado
    const esActivo = convenio.estado === 'Activo';
    const nuevoEstado = !esActivo;
    const mensaje = nuevoEstado ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de ${mensaje} este convenio?`)) {
      return;
    }

    this.convenioService.toggleActivoConvenio(convenio.idConven, nuevoEstado).subscribe({
      next: (response: any) => {
        alert(`Convenio ${mensaje}do exitosamente`);
        // Recargar la lista para obtener el estado actualizado
        this.cargarSolicitudes();
      },
      error: (error: any) => {
        console.error('Error al cambiar estado:', error);
        alert(`Error al ${mensaje} el convenio. Por favor intenta nuevamente.`);
      }
    });
  }

  editarConvenio(convenio: any): void {
    this.convenioEditando = convenio;
    
    // Formatear fechas al formato YYYY-MM-DD para el input date
    const fechaIni = convenio.fechaIni ? this.formatearFechaParaInput(convenio.fechaIni) : '';
    const fechaFin = convenio.fechaFin ? this.formatearFechaParaInput(convenio.fechaFin) : '';
    
    this.formEdicion.patchValue({
      institucion: convenio.institucion || '',
      descripcion: convenio.descripcion || '',
      fechaIni: fechaIni,
      fechaFin: fechaFin,
      responsables: convenio.responsables || '',
      duracion: convenio.duracion || '',
      cantHoras: convenio.cantHoras || '',
      objetivos: convenio.objetivos || '',
      beneficios: convenio.beneficios || ''
    });
  }

  formatearFechaParaInput(fecha: string): string {
    // Convertir fecha de formato DD/MM/YYYY a YYYY-MM-DD
    if (fecha.includes('/')) {
      const partes = fecha.split('/');
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return fecha;
  }

  cerrarModal(): void {
    this.convenioEditando = null;
    this.formEdicion.reset();
  }

  guardarCambios(): void {
    if (!this.formEdicion.valid) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    this.guardando = true;
    const datosActualizados = {
      idConven: this.convenioEditando.idConven,
      ...this.formEdicion.value
    };

    this.convenioService.actualizarConvenio(datosActualizados).subscribe({
      next: (response: any) => {
        alert('Convenio actualizado exitosamente');
        this.guardando = false;
        this.cerrarModal();
        this.cargarSolicitudes(); // Recargar la lista
      },
      error: (error: any) => {
        console.error('Error al actualizar convenio:', error);
        alert('Error al actualizar el convenio. Por favor intenta nuevamente.');
        this.guardando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }
}
