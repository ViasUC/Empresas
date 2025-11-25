import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rechazar-postulacion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="cancelar()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Rechazar Postulación</h2>
          <button class="btn-close" (click)="cancelar()">&times;</button>
        </div>

        <div class="modal-body">
          <p class="advertencia">
            Estás a punto de rechazar esta postulación. Por favor, indica el motivo del rechazo.
          </p>

          <div class="form-group">
            <label for="motivo">Motivo del rechazo: <span class="required">*</span></label>
            <textarea
              id="motivo"
              [(ngModel)]="motivo"
              rows="5"
              placeholder="Explica el motivo del rechazo (obligatorio)..."
              class="textarea-motivo"
              [class.error]="mostrarError && !motivo.trim()"
            ></textarea>
            <span class="error-message" *ngIf="mostrarError && !motivo.trim()">
              El motivo es obligatorio
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" (click)="cancelar()">Cancelar</button>
          <button class="btn-danger" (click)="confirmar()">Rechazar Postulación</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      padding: 1rem;
    }

    .modal-content {
      background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
      border-radius: 8px;
      width: 100%;
      max-width: 500px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        color: #fff;
        font-size: 1.3rem;
      }

      .btn-close {
        background: transparent;
        border: none;
        color: #fff;
        font-size: 2rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.7;
        transition: opacity 0.3s;

        &:hover {
          opacity: 1;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;
      color: #fff;
    }

    .advertencia {
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;

        .required {
          color: #ff5252;
        }
      }

      .textarea-motivo {
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: #fff;
        font-size: 0.95rem;
        font-family: inherit;
        resize: vertical;
        transition: all 0.3s;

        &:focus {
          outline: none;
          border-color: #64b5f6;
          background: rgba(255, 255, 255, 0.15);
        }

        &.error {
          border-color: #ff5252;
        }

        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
      }

      .error-message {
        color: #ff5252;
        font-size: 0.85rem;
      }
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-secondary {
      padding: 0.6rem 1.5rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.3s;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .btn-danger {
      padding: 0.6rem 1.5rem;
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid #f44336;
      color: #f44336;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.3s;

      &:hover {
        background: rgba(244, 67, 54, 0.3);
      }
    }
  `]
})
export class RechazarPostulacionModalComponent {
  @Output() confirmarRechazo = new EventEmitter<string>();
  @Output() cancelarRechazo = new EventEmitter<void>();

  motivo = '';
  mostrarError = false;

  confirmar(): void {
    if (!this.motivo.trim()) {
      this.mostrarError = true;
      return;
    }

    this.confirmarRechazo.emit(this.motivo.trim());
  }

  cancelar(): void {
    this.cancelarRechazo.emit();
  }
}
