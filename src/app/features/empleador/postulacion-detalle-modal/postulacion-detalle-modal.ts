import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { 
  Postulacion, 
  PostulanteResumen, 
  Evidencia 
} from '../../../core/models/postulacion.model';

@Component({
  selector: 'app-postulacion-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  templateUrl: './postulacion-detalle-modal.html',
  styleUrl: './postulacion-detalle-modal.scss'
})
export class PostulacionDetalleModal {
  postulacion: Postulacion;

  constructor(
    public dialogRef: MatDialogRef<PostulacionDetalleModal>,
    @Inject(MAT_DIALOG_DATA) public data: { postulacion: Postulacion }
  ) {
    this.postulacion = data.postulacion;
  }

  get postulante(): PostulanteResumen {
    return this.postulacion.postulante!;
  }

  get nombreCompleto(): string {
    return `${this.postulante.nombre} ${this.postulante.apellido || ''}`;
  }

  get iniciales(): string {
    const nombre = this.postulante.nombre?.charAt(0) || '';
    const apellido = this.postulante.apellido?.charAt(0) || '';
    return `${nombre}${apellido}`.toUpperCase();
  }

  get habilidades(): string[] {
    if (!this.postulante.portafolio?.skills) return [];
    return this.postulante.portafolio.skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  get evidencias(): Evidencia[] {
    return this.postulante.portafolio?.evidencias || [];
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  contactar(): void {
    if (this.postulante.email) {
      window.location.href = `mailto:${this.postulante.email}`;
    }
  }

  abrirRecurso(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
