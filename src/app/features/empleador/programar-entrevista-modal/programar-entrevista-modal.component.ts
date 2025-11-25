import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DatosEntrevista {
  fecha: string;
  hora: string;
  medio: 'email' | 'whatsapp';
  mensaje: string;
}

@Component({
  selector: 'app-programar-entrevista-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./programar-entrevista-modal.component.scss'],
  template: `
    <div class="modal-overlay" (click)="cancelar()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Programar Entrevista</h2>
          <button class="btn-close" (click)="cancelar()">&times;</button>
        </div>

        <div class="modal-body">
          <p class="subtitulo">
            Has aceptado la postulación de <strong>{{ nombreCandidato }}</strong>.
            Programa una entrevista para continuar con el proceso.
          </p>

          <!-- FECHA Y HORA -->
          <div class="form-section">
            <h3 class="section-title">
              Fecha y Hora de la Entrevista
            </h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="fecha">Fecha *</label>
                <input
                  type="date"
                  id="fecha"
                  [(ngModel)]="datosEntrevista.fecha"
                  [min]="fechaMinima"
                  class="form-control"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="hora">Hora *</label>
                <input
                  type="time"
                  id="hora"
                  [(ngModel)]="datosEntrevista.hora"
                  class="form-control"
                  required
                />
              </div>
            </div>
          </div>

          <!-- MEDIO DE CONTACTO -->
          <div class="form-section">
            <h3 class="section-title">
              Medio de Contacto
            </h3>
            
            <div class="opciones-medio">
              <label class="opcion-card" [class.selected]="datosEntrevista.medio === 'email'">
                <input
                  type="radio"
                  name="medio"
                  value="email"
                  [(ngModel)]="datosEntrevista.medio"
                />
                <div class="card-content">
                  <span class="icon-grande"></span>
                  <span class="texto">Enviar Correo</span>
                  <small class="descripcion">Se enviará un email con los detalles</small>
                </div>
              </label>
              
              <label class="opcion-card" [class.selected]="datosEntrevista.medio === 'whatsapp'">
                <input
                  type="radio"
                  name="medio"
                  value="whatsapp"
                  [(ngModel)]="datosEntrevista.medio"
                />
                <div class="card-content">
                  <span class="icon-grande"></span>
                  <span class="texto">WhatsApp</span>
                  <small class="descripcion">Se abrirá WhatsApp con el mensaje</small>
                </div>
              </label>
            </div>
          </div>

          <!-- MENSAJE PERSONALIZADO -->
          <div class="form-section">
            <h3 class="section-title">
              Mensaje Personalizado
            </h3>
            
            <div class="form-group">
              <label for="mensaje">Mensaje (opcional)</label>
              <textarea
                id="mensaje"
                [(ngModel)]="datosEntrevista.mensaje"
                placeholder="Escribe un mensaje personalizado para el candidato..."
                rows="4"
                class="form-control"
                maxlength="500"
              ></textarea>
              <small class="contador">{{ datosEntrevista.mensaje.length }}/500 caracteres</small>
            </div>
          </div>

          <!-- VISTA PREVIA -->
          <div class="form-section preview-section" *ngIf="datosEntrevista.fecha && datosEntrevista.hora">
            <h3 class="section-title">
              Vista Previa del Mensaje
            </h3>
            <div class="preview-content">
              <p><strong>Asunto:</strong> Invitación a Entrevista - {{ tituloOportunidad }}</p>
              <p><strong>Fecha:</strong> {{ formatearFecha(datosEntrevista.fecha) }}</p>
              <p><strong>Hora:</strong> {{ datosEntrevista.hora }}</p>
              <div class="mensaje-preview" *ngIf="datosEntrevista.mensaje">
                <p><strong>Mensaje:</strong></p>
                <p>{{ datosEntrevista.mensaje }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="cancelar()">
            Cancelar
          </button>
          <button 
            class="btn btn-primary" 
            (click)="confirmar()"
            [disabled]="!formularioValido()">
            {{ datosEntrevista.medio === 'email' ? 'Enviar Correo' : 'Abrir WhatsApp' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProgramarEntrevistaModalComponent {
  @Input() nombreCandidato: string = '';
  @Input() telefonoCandidato: string = '';
  @Input() emailCandidato: string = '';
  @Input() tituloOportunidad: string = '';
  @Output() confirmarEntrevista = new EventEmitter<DatosEntrevista>();
  @Output() cancelarEntrevista = new EventEmitter<void>();

  datosEntrevista: DatosEntrevista = {
    fecha: '',
    hora: '',
    medio: 'email',
    mensaje: ''
  };

  fechaMinima: string;

  constructor() {
    // Establecer fecha mínima como hoy
    const hoy = new Date();
    this.fechaMinima = hoy.toISOString().split('T')[0];
  }

  formularioValido(): boolean {
    return !!(this.datosEntrevista.fecha && this.datosEntrevista.hora);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  confirmar(): void {
    if (this.formularioValido()) {
      this.confirmarEntrevista.emit(this.datosEntrevista);
    }
  }

  cancelar(): void {
    this.cancelarEntrevista.emit();
  }
}
