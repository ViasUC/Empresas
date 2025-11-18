import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ConvenioService, ConvenioOutput, ConvenioUpdateInput } from '../services/convenio.service';

@Component({
  selector: 'app-convenios-vigentes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    private convenioService: ConvenioService
  ) {}

  ngOnInit(): void {
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
    this.isLoading = true;
    this.errorMessage = '';

    this.convenioService.listarConveniosVigentes().subscribe({
      next: (response) => {
        this.convenios = response.convenios;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar convenios:', error);
        this.errorMessage = 'Error al cargar los convenios. Por favor, intente nuevamente.';
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
    this.selectedConvenio = convenio;
    this.updateForm.patchValue({
      responsables: convenio.responsables || '',
      observaciones: convenio.observaciones || ''
    });
    this.showUpdateModal = true;
  }

  abrirModalRenovar(convenio: ConvenioOutput): void {
    this.selectedConvenio = convenio;
    this.showRenovarModal = true;
  }

  abrirModalBaja(convenio: ConvenioOutput): void {
    this.selectedConvenio = convenio;
    this.bajaForm.reset();
    this.showBajaModal = true;
  }

  cerrarModales(): void {
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
      next: (response) => {
        this.successMessage = 'Responsable actualizado exitosamente';
        this.cerrarModales();
        this.cargarConvenios();
      },
      error: (error) => {
        console.error('Error al actualizar responsable:', error);
        this.errorMessage = error.error?.message || 'Error al actualizar el responsable';
        this.isSubmitting = false;
      }
    });
  }

  solicitarRenovacion(): void {
    if (!this.selectedConvenio) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.convenioService.solicitarRenovacion(this.selectedConvenio.idConven).subscribe({
      next: (response) => {
        this.successMessage = 'Solicitud de renovación enviada exitosamente';
        this.cerrarModales();
        this.cargarConvenios();
      },
      error: (error) => {
        console.error('Error al solicitar renovación:', error);
        this.errorMessage = error.error?.message || 'Error al solicitar la renovación';
        this.isSubmitting = false;
      }
    });
  }

  darDeBaja(): void {
    if (this.bajaForm.invalid || !this.selectedConvenio) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const motivo = this.bajaForm.value.motivo;

    this.convenioService.darDeBajaConvenio(this.selectedConvenio.idConven, motivo).subscribe({
      next: (response) => {
        this.successMessage = 'Convenio dado de baja exitosamente';
        this.cerrarModales();
        this.cargarConvenios();
      },
      error: (error) => {
        console.error('Error al dar de baja:', error);
        this.errorMessage = error.error?.message || 'Error al dar de baja el convenio';
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
      'Vigente': 'estado-vigente',
      'Aprobado': 'estado-aprobado',
      'En Renovación': 'estado-renovacion'
    };
    return estadoMap[estado] || 'estado-default';
  }
}
