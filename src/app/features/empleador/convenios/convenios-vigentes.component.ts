import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ConvenioService, ConvenioOutput, ConvenioUpdateInput } from '../../../core/services/convenio.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-convenios-vigentes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './convenios-vigentes.component.html',
  styleUrls: ['./convenios-vigentes.component.scss']
})
export class ConveniosVigentesComponent implements OnInit {
  
  convenios: ConvenioOutput[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  selectedConvenio: ConvenioOutput | null = null;
  
  // Modales
  showUpdateModal = false;
  showRenovarModal = false;
  showBajaModal = false;
  
  // Formularios
  updateForm!: FormGroup;
  bajaForm!: FormGroup;
  
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private convenioService: ConvenioService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('ConveniosVigentesComponent inicializado');
    this.initForms();
    this.cargarConvenios();
  }

  private initForms(): void {
    this.updateForm = this.fb.group({
      responsables: ['', Validators.required],
      observaciones: ['']
    });

    this.bajaForm = this.fb.group({
      motivo: ['', Validators.required]
    });
  }

  cargarConvenios(): void {
    console.log('Cargando convenios vigentes...');
    
    // Verificar que el usuario tenga empresa asociada
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    console.log('Usuario desde localStorage:', usuario);
    console.log('idEmpresa:', usuario.idEmpresa);
    
    if (!usuario.idEmpresa) {
      console.warn('El usuario no tiene idEmpresa en localStorage');
      this.errorMessage = 'Usuario no pertenece a ninguna empresa. Por favor, cierra sesion y vuelve a iniciar sesion.';
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';

    this.convenioService.listarConveniosVigentes().subscribe({
      next: (response: any) => {
        console.log('Convenios cargados:', response.convenios);
        this.convenios = response.convenios || [];
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar convenios:', error);
        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Por favor, cierra sesión e inicia sesión nuevamente.';
        } else if (error.status === 500 && error.error?.message?.includes('no pertenece a ninguna empresa')) {
          this.errorMessage = 'Usuario no pertenece a ninguna empresa. Por favor, cierra sesión y vuelve a iniciar sesión para actualizar tus datos.';
        } else {
          this.errorMessage = error.error?.message || 'Error al cargar los convenios. Por favor, intente nuevamente.';
        }
        this.isLoading = false;
      }
    });
  }

  verDetalle(convenio: ConvenioOutput): void {
    this.selectedConvenio = convenio;
  }

  cerrarDetalle(): void {
    this.selectedConvenio = null;
  }

  abrirModalActualizar(convenio: ConvenioOutput): void {
    console.log('=== CLICK EN ACTUALIZAR RESPONSABLE ===');
    console.log('Convenio recibido:', convenio);
    this.selectedConvenio = convenio;
    this.updateForm.patchValue({
      responsables: convenio.responsables || '',
      observaciones: convenio.observaciones || ''
    });
    this.showUpdateModal = true;
    console.log('Modal actualizar abierto:', this.showUpdateModal);
  }

  abrirModalRenovar(convenio: ConvenioOutput): void {
    console.log('=== CLICK EN RENOVAR ===');
    console.log('Convenio recibido:', convenio);
    this.selectedConvenio = convenio;
    this.showRenovarModal = true;
    console.log('Modal renovar abierto:', this.showRenovarModal);
  }

  abrirModalBaja(convenio: ConvenioOutput): void {
    console.log('=== CLICK EN DAR DE BAJA ===');
    console.log('Convenio recibido:', convenio);
    this.selectedConvenio = convenio;
    this.bajaForm.reset();
    this.showBajaModal = true;
    console.log('Modal baja abierto:', this.showBajaModal);
  }

  cerrarModales(): void {
    console.log('Cerrando todos los modales');
    this.showUpdateModal = false;
    this.showRenovarModal = false;
    this.showBajaModal = false;
    this.selectedConvenio = null;
    this.isSubmitting = false;
  }

  actualizarResponsable(): void {
    if (this.updateForm.invalid || !this.selectedConvenio) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const input: ConvenioUpdateInput = {
      responsables: this.updateForm.value.responsables,
      observaciones: this.updateForm.value.observaciones || undefined
    };

    this.convenioService.actualizarResponsable(this.selectedConvenio.idConven, input).subscribe({
      next: (response: any) => {
        this.successMessage = 'Responsable actualizado exitosamente';
        this.cerrarModales();
        this.cargarConvenios();
      },
      error: (error: any) => {
        console.error('Error al actualizar responsable:', error);
        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Por favor, cierra sesión e inicia sesión nuevamente.';
        } else {
          this.errorMessage = error.error?.message || 'Error al actualizar el responsable';
        }
        this.isSubmitting = false;
      }
    });
  }

  solicitarRenovacion(): void {
    if (!this.selectedConvenio) {
      console.error('No hay convenio seleccionado');
      return;
    }

    console.log('Solicitando renovación para convenio:', this.selectedConvenio.idConven);
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.convenioService.solicitarRenovacion(this.selectedConvenio.idConven).subscribe({
      next: (response: any) => {
        console.log('Renovación exitosa:', response);
        this.successMessage = 'Convenio renovado exitosamente. Se creó un nuevo convenio con fechas extendidas.';
        this.cerrarModales();
        this.cargarConvenios();
      },
      error: (error: any) => {
        console.error('Error al solicitar renovación:', error);
        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Por favor, cierra sesión e inicia sesión nuevamente.';
        } else {
          this.errorMessage = error.error?.message || 'Error al solicitar la renovación';
        }
        this.isSubmitting = false;
      }
    });
  }

  darDeBaja(): void {
    if (this.bajaForm.invalid || !this.selectedConvenio) {
      console.error('Formulario inválido o no hay convenio seleccionado');
      return;
    }

    console.log('Dando de baja convenio:', this.selectedConvenio.idConven);
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const motivo = this.bajaForm.value.motivo;

    this.convenioService.darDeBajaConvenio(this.selectedConvenio.idConven, motivo).subscribe({
      next: (response: any) => {
        console.log('Baja exitosa:', response);
        this.successMessage = 'Convenio dado de baja exitosamente. Estado cambiado a Finalizado.';
        this.cerrarModales();
        this.cargarConvenios();
      },
      error: (error: any) => {
        console.error('Error al dar de baja:', error);
        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Por favor, cierra sesión e inicia sesión nuevamente.';
        } else {
          this.errorMessage = error.error?.message || 'Error al dar de baja el convenio';
        }
        this.isSubmitting = false;
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getEstadoClass(estado: string): string {
    const estadoMap: { [key: string]: string } = {
      'Pendiente': 'estado-pendiente',
      'Aprobado': 'estado-aprobado',
      'Activo': 'estado-activo',
      'Finalizado': 'estado-finalizado'
    };
    return estadoMap[estado] || 'estado-default';
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
