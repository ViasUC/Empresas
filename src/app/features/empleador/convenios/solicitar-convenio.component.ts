import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConvenioService, ConvenioInput } from '../services/convenio.service';

@Component({
  selector: 'app-solicitar-convenio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitar-convenio.component.html',
  styleUrls: ['./solicitar-convenio.component.scss']
})
export class SolicitarConvenioComponent implements OnInit {
  
  convenioForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  documentoAdjunto: string | null = null;

  constructor(
    private fb: FormBuilder,
    private convenioService: ConvenioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.convenioForm = this.fb.group({
      institucion: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      fechaIni: ['', Validators.required],
      fechaFin: ['', Validators.required],
      responsables: ['', Validators.required],
      duracion: [''],
      cantHoras: [''],
      objetivos: [''],
      beneficios: [''],
      requisitos: [''],
      documentoAdjunto: ['']
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Aquí iría la lógica para subir el archivo a un servicio de archivos
      // Por ahora, solo guardamos el nombre del archivo
      this.documentoAdjunto = file.name;
      this.convenioForm.patchValue({ documentoAdjunto: file.name });
    }
  }

  onSubmit(): void {
    if (this.convenioForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos obligatorios';
      return;
    }

    // Validar fechas
    const fechaIni = new Date(this.convenioForm.value.fechaIni);
    const fechaFin = new Date(this.convenioForm.value.fechaFin);
    
    if (fechaFin <= fechaIni) {
      this.errorMessage = 'La fecha de fin debe ser posterior a la fecha de inicio';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const input: ConvenioInput = {
      institucion: this.convenioForm.value.institucion,
      descripcion: this.convenioForm.value.descripcion,
      fechaIni: this.convenioForm.value.fechaIni,
      fechaFin: this.convenioForm.value.fechaFin,
      responsables: this.convenioForm.value.responsables,
      duracion: this.convenioForm.value.duracion || undefined,
      cantHoras: this.convenioForm.value.cantHoras || undefined,
      objetivos: this.convenioForm.value.objetivos || undefined,
      beneficios: this.convenioForm.value.beneficios || undefined,
      requisitos: this.convenioForm.value.requisitos || undefined,
      documentoAdjunto: this.documentoAdjunto || undefined
    };

    this.convenioService.solicitarConvenio(input).subscribe({
      next: (response) => {
        this.successMessage = `Solicitud de convenio creada exitosamente. ID: ${response.idConvenio}`;
        this.convenioForm.reset();
        this.documentoAdjunto = null;
        
        // Redirigir a la lista de solicitudes después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/empleador/convenios/solicitudes']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al solicitar convenio:', error);
        this.errorMessage = error.error?.message || 'Error al solicitar convenio. Por favor, intente nuevamente.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/empleador/dashboard']);
  }
}
