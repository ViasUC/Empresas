import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apollo } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { PostulacionesService } from '../../../core/services/postulaciones.service';
import { HistorialPostulacion } from '../../../core/models/historial-postulacion.model';

const USUARIO_QUERY = gql`
  query Usuario($idUsuario: ID!) {
    usuario(id: $idUsuario) {
      idUsuario
      nombre
      apellido
      email
      telefono
      ubicacion
    }
  }
`;

const PORTAFOLIO_QUERY = gql`
  query PortafolioPorUsuario($idUsuario: ID!) {
    portafolioPorUsuario(idUsuario: $idUsuario) {
      idPortafolio
      descripcion
      skills
      visibilidad
    }
  }
`;

@Component({
  selector: 'app-perfil-candidato-modal',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./perfil-candidato-modal.component.scss'],
  template: `
    <div class="modal-overlay" (click)="cerrar()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Perfil del Candidato</h2>
          <button class="btn-close" (click)="cerrar()">&times;</button>
        </div>

        <div class="modal-body" *ngIf="!loading && perfil">
          
          <!-- CABECERA CON AVATAR Y DATOS -->
          <div class="perfil-header">
            <div class="avatar">
              {{ getInitials(perfil.nombre, perfil.apellido) }}
            </div>
            <div class="perfil-header-info">
              <h2 class="nombre-completo">{{ perfil.nombre }} {{ perfil.apellido }}</h2>
              <div class="completitud">
                <span class="completitud-label">Completitud del perfil</span>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="getCompletitud()"></div>
                </div>
                <span class="completitud-percent">{{ getCompletitud() }}%</span>
              </div>
            </div>
          </div>

          <!-- INFORMACIÓN DE CONTACTO -->
          <section class="info-section">
            <h3 class="section-title">
              Información de Contacto
            </h3>
            <div class="contact-info">
              <div class="contact-item" *ngIf="perfil.email">
                <span class="contact-label">Email:</span>
                <a [href]="'mailto:' + perfil.email" class="contact-link">{{ perfil.email }}</a>
              </div>
              <div class="contact-item" *ngIf="perfil.telefono">
                <span class="contact-label">Teléfono:</span>
                <span class="contact-text">{{ perfil.telefono }}</span>
              </div>
              <div class="contact-item" *ngIf="perfil.ubicacion">
                <span class="contact-label">Ubicación:</span>
                <span class="contact-text">{{ perfil.ubicacion }}</span>
              </div>
            </div>
          </section>

          <!-- PORTAFOLIO -->
          <section class="info-section" *ngIf="portafolio">
            <h3 class="section-title">
              <span class="icon-title">�</span>
              Portafolio
            </h3>
            <div class="portafolio-content">
              <p class="descripcion-text" *ngIf="portafolio.descripcion">
                {{ portafolio.descripcion }}
              </p>
              <div class="skills-text" *ngIf="portafolio.skills">
                <strong>Habilidades:</strong> {{ portafolio.skills }}
              </div>
            </div>
          </section>

          <!-- HISTORIAL -->
          <section class="info-section" *ngIf="historial && historial.length > 0">
            <h3 class="section-title">
              Historial de Postulación
            </h3>
            <div class="historial-list">
              <div class="historial-item" *ngFor="let h of historial">
                <div class="historial-date">{{ h.fechaCambio | date: 'dd/MM/yyyy HH:mm' }}</div>
                <div class="historial-change">
                  <span class="estado-badge" [ngClass]="'estado-' + (h.estadoAnterior || 'nuevo')">
                    {{ h.estadoAnterior || 'Nuevo' }}
                  </span>
                  <span class="arrow">→</span>
                  <span class="estado-badge" [ngClass]="'estado-' + h.estadoNuevo">
                    {{ h.estadoNuevo }}
                  </span>
                </div>
                <div class="historial-motivo" *ngIf="h.motivo">
                  <strong>Motivo:</strong> {{ h.motivo }}
                </div>
                <div class="historial-actor">
                  Por: {{ h.actor ? (h.actor.nombre + ' ' + h.actor.apellido) : 'Sistema' }}
                </div>
              </div>
            </div>
          </section>

        </div>

        <div class="modal-body loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Cargando información del candidato...</p>
        </div>

        <div class="modal-footer">
          <button class="btn-close-footer" (click)="cerrar()">Cerrar</button>
          <button class="btn-email" *ngIf="perfil?.email">
            Enviar correo
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PerfilCandidatoModalComponent implements OnInit {
  @Input() idUsuario!: number;
  @Input() idPostulacion!: number;
  @Output() cerrarModal = new EventEmitter<void>();

  loading = true;
  perfil: any = null;
  portafolio: any = null;
  historial: HistorialPostulacion[] = [];

  constructor(
    private apollo: Apollo,
    private postulacionesService: PostulacionesService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    console.log('Cargando datos para usuario:', this.idUsuario);

    // Cargar usuario
    this.apollo
      .query({
        query: USUARIO_QUERY,
        variables: { idUsuario: this.idUsuario },
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (result: any) => {
          console.log('Usuario cargado:', result);
          this.perfil = result.data.usuario;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar usuario:', err);
          this.loading = false;
        },
      });

    // Cargar portafolio (puede no existir)
    this.apollo
      .query({
        query: PORTAFOLIO_QUERY,
        variables: { idUsuario: this.idUsuario },
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (result: any) => {
          console.log('Portafolio cargado:', result);
          this.portafolio = result.data.portafolioPorUsuario;
        },
        error: (err) => {
          console.log('Usuario sin portafolio (esto es normal)');
          this.portafolio = null;
        },
      });

    // Cargar historial
    this.postulacionesService.getHistorialPostulacion(this.idPostulacion).subscribe({
      next: (historial) => {
        console.log('Historial cargado:', historial);
        this.historial = historial;
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
      },
    });
  }

  getInitials(nombre: string, apellido: string): string {
    const n = nombre?.charAt(0)?.toUpperCase() || '';
    const a = apellido?.charAt(0)?.toUpperCase() || '';
    return n + a;
  }

  getCompletitud(): number {
    if (!this.perfil) return 0;
    
    let completitud = 20; // Base por tener perfil
    if (this.perfil.email) completitud += 20;
    if (this.perfil.telefono) completitud += 20;
    if (this.perfil.ubicacion) completitud += 20;
    if (this.portafolio?.descripcion) completitud += 20;
    
    return completitud;
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}
