import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConvenioService } from '../../../core/services/convenio.service';

@Component({
  selector: 'app-solicitar-convenio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitar-convenio.html',
  styleUrl: './solicitar-convenio.scss'
})
export class SolicitarConvenioComponent {
  convenio = {
    institucion: '',
    descripcion: '',
    fechaIni: '',
    fechaFin: '',
    responsables: '',
    duracion: '',
    cantHoras: '',
    objetivos: '',
    beneficios: '',
    requisitos: ''
  };
  
  archivoSeleccionado: File | null = null;
  archivoNombre: string = '';
  archivoError: string = '';
  submitting = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private convenioService: ConvenioService
  ) {}

  onArchivoSeleccionado(event: any): void {
    const file = event.target.files[0];
    this.archivoError = '';
    
    if (file) {
      // Validar tamaño (10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.archivoError = 'El archivo no debe superar los 10 MB';
        this.archivoSeleccionado = null;
        this.archivoNombre = '';
        event.target.value = '';
        return;
      }

      // Validar tipo de archivo (documentos e imágenes)
      const tiposPermitidos = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif'
      ];

      if (!tiposPermitidos.includes(file.type)) {
        this.archivoError = 'Tipo de archivo no permitido. Use PDF, DOC, DOCX o imágenes (JPG, PNG, GIF)';
        this.archivoSeleccionado = null;
        this.archivoNombre = '';
        event.target.value = '';
        return;
      }

      this.archivoSeleccionado = file;
      this.archivoNombre = file.name;
    }
  }

  eliminarArchivo(): void {
    this.archivoSeleccionado = null;
    this.archivoNombre = '';
    this.archivoError = '';
  }

  formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  onSubmit(): void {
    if (this.submitting) return;
    
    this.submitting = true;
    this.errorMessage = '';
    
    // TODO: Si hay archivo, subirlo primero al servicio de archivos
    // Por ahora solo guardamos el nombre del archivo
    const convenioData: any = { ...this.convenio };
    if (this.archivoSeleccionado) {
      convenioData.documentoAdjunto = this.archivoNombre;
      // Aquí se subiría el archivo al servidor
      console.log('Archivo a subir:', this.archivoSeleccionado);
    }
    
    this.convenioService.solicitarConvenio(convenioData).subscribe({
      next: (response: any) => {
        console.log('Convenio solicitado:', response);
        alert('Convenio solicitado exitosamente. Estado: Pendiente');
        this.router.navigate(['/dashboard/empleador/mis-solicitudes']);
      },
      error: (error: any) => {
        console.error('Error al solicitar convenio:', error);
        this.errorMessage = error.error?.message || 'Error al solicitar el convenio. Por favor intente nuevamente.';
        this.submitting = false;
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }
}
