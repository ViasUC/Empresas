import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  Postulacion,
  PostulacionesEmpresaResponse,
} from '../../../core/models/postulacion.model';
import { PostulacionesService } from '../../../core/services/postulaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { OpportunityService } from '../../oportunidades/services/opportunity.service';
import { Opportunity } from '../../../core/models/opportunity.model';
import { PerfilCandidatoModalComponent } from '../perfil-candidato-modal/perfil-candidato-modal.component';
import { RechazarPostulacionModalComponent } from '../rechazar-postulacion-modal/rechazar-postulacion-modal.component';
import { ProgramarEntrevistaModalComponent, DatosEntrevista } from '../programar-entrevista-modal/programar-entrevista-modal.component';

const PAGE_SIZE = 10;

interface Oportunidad {
  idOportunidad: number;
  titulo: string;
}

@Component({
  selector: 'app-postulaciones-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, PerfilCandidatoModalComponent, RechazarPostulacionModalComponent, ProgramarEntrevistaModalComponent],
  templateUrl: './postulaciones-empresa.component.html',
  styleUrls: ['./postulaciones-empresa.component.scss'],
})
export class PostulacionesEmpresaComponent implements OnInit {
  postulaciones: Postulacion[] = [];
  total = 0;
  page = 0;

  loading = false;
  errorMessage: string | null = null;

  // Filtros
  oportunidades: Oportunidad[] = [];
  oportunidadSeleccionada: number | null = null;
  estadoSeleccionado: string | null = null;
  loadingOportunidades = false;
  
  estadosPostulacion = [
    { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
    { valor: 'ACEPTADA', etiqueta: 'Aceptada' },
    { valor: 'RECHAZADA', etiqueta: 'Rechazada' },
    { valor: 'CANCELADA', etiqueta: 'Cancelada' }
  ];

  // Modales
  mostrarModalPerfil = false;
  mostrarModalRechazo = false;
  mostrarModalProgramarEntrevista = false;
  postulacionSeleccionada: Postulacion | null = null;

  constructor(
    private postulacionesService: PostulacionesService,
    private authService: AuthService,
    private opportunityService: OpportunityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarOportunidades();
    this.cargarPagina(0);
  }

  cargarOportunidades(): void {
    this.loadingOportunidades = true;
    this.opportunityService.listMine().subscribe({
      next: (opportunities: Opportunity[]) => {
        // Mostrar todas las oportunidades que tengan ID (sin filtrar por estado)
        this.oportunidades = opportunities
          .filter(o => o.idOportunidad)
          .map(o => ({
            idOportunidad: o.idOportunidad!,
            titulo: o.titulo
          }));
        
        this.loadingOportunidades = false;
      },
      error: (err) => {
        console.error('Error al cargar oportunidades:', err);
        this.loadingOportunidades = false;
      }
    });
  }

  onFiltroOportunidadChange(): void {
    this.page = 0;
    this.cargarPagina(0);
  }

  onFiltroEstadoChange(): void {
    this.page = 0;
    this.cargarPagina(0);
  }

  limpiarFiltros(): void {
    this.oportunidadSeleccionada = null;
    this.estadoSeleccionado = null;
    this.page = 0;
    this.cargarPagina(0);
  }

  cargarPagina(page: number): void {
    this.loading = true;
    this.errorMessage = null;

    const usuarioActual = this.authService.getCurrentUser();
    
    // Intentar obtener el ID del usuario
    let userId: number | null = null;
    
    if (usuarioActual?.id) {
      userId = usuarioActual.id;
    } else {
      // Fallback: intentar desde localStorage
      try {
        const userJson = localStorage.getItem('usuario');
        if (userJson) {
          const storedUser = JSON.parse(userJson);
          userId = storedUser.id || parseInt(storedUser.idUsuario);
        }
      } catch (e) {
        console.error('Error al obtener usuario de localStorage:', e);
      }
    }

    if (!userId) {
      this.loading = false;
      this.errorMessage = 'No se encontró el usuario autenticado. Por favor, cierra sesión e inicia sesión nuevamente.';
      return;
    }

    const idOfertante = userId.toString();

    // Construir filtro con ambos criterios si están seleccionados
    const filtro: any = {};
    if (this.oportunidadSeleccionada) {
      filtro.idOportunidad = this.oportunidadSeleccionada.toString();
    }
    if (this.estadoSeleccionado) {
      filtro.estados = [this.estadoSeleccionado]; // El backend espera un array de estados
    }
    
    const filtroFinal = Object.keys(filtro).length > 0 ? filtro : null;

    this.postulacionesService
      .getPostulacionesEmpresa({
        idOfertante,
        page,
        size: PAGE_SIZE,
        sort: 'fechaPostulacion,desc',
        filtro: filtroFinal,
      })
      .subscribe({
        next: (res: PostulacionesEmpresaResponse) => {
          const payload = res.postulacionesEmpresa;
          this.postulaciones = payload.items;
          this.total = payload.total;
          this.page = payload.page;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar postulaciones:', err);
          this.errorMessage = 'Error al cargar las postulaciones.';
          this.loading = false;
        },
      });
  }

  paginaAnterior(): void {
    if (this.page > 0) {
      this.cargarPagina(this.page - 1);
    }
  }

  paginaSiguiente(): void {
    const maxPage = Math.floor((this.total - 1) / PAGE_SIZE);
    if (this.page < maxPage) {
      this.cargarPagina(this.page + 1);
    }
  }

  get puedeIrAtras(): boolean {
    return this.page > 0;
  }

  get puedeIrAdelante(): boolean {
    return (this.page + 1) * PAGE_SIZE < this.total;
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  recargar(): void {
    this.cargarPagina(this.page);
  }

  getEstadoClass(estado: string): string {
    const estadoLower = estado?.toLowerCase() || '';
    if (estadoLower === 'pendiente') return 'estado-pendiente';
    if (estadoLower === 'aceptada') return 'estado-aceptada';
    if (estadoLower === 'rechazada') return 'estado-rechazada';
    if (estadoLower === 'cancelada') return 'estado-cancelada';
    return 'estado-default';
  }

  verPortafolio(postulante: any): void {
    if (!postulante || !postulante.idUsuario) {
      console.error('No se puede ver el portafolio: postulante inválido', postulante);
      return;
    }
    
    console.log('Ver portafolio del usuario:', postulante.idUsuario, postulante);
    // TODO: Navegar a la página del portafolio o abrir modal
    // Por ahora solo navegaremos a la ruta con el ID
    this.router.navigate(['/empleador/portafolio', postulante.idUsuario]);
  }

  verPerfil(postulacion: Postulacion): void {
    console.log('Ver perfil de postulación:', postulacion);
    
    if (!postulacion.postulante || !postulacion.postulante.idUsuario) {
      alert('No se puede ver el perfil: información del postulante no disponible');
      return;
    }
    
    this.postulacionSeleccionada = postulacion;
    this.mostrarModalPerfil = true;
  }

  cerrarModalPerfil(): void {
    this.mostrarModalPerfil = false;
    this.postulacionSeleccionada = null;
  }

  aceptarPostulacion(postulacion: Postulacion): void {
    // Validar que la postulación esté en estado PENDIENTE
    if (postulacion.estado !== 'PENDIENTE') {
      const estadoActual = postulacion.estado === 'ACEPTADA' ? 'ya fue aceptada' :
                          postulacion.estado === 'RECHAZADA' ? 'fue rechazada' :
                          postulacion.estado === 'CANCELADA' ? 'fue cancelada' :
                          'no está disponible';
      alert(`No se puede aceptar esta postulación porque ${estadoActual}.`);
      return;
    }

    const confirmar = window.confirm('¿Estás seguro de que quieres aceptar esta postulación?');
    if (!confirmar) return;

    const usuarioActual = this.authService.getCurrentUser();
    const idActor = usuarioActual?.id || 0;

    this.postulacionesService
      .actualizarEstadoPostulacion(
        postulacion.idPostulacion,
        'ACEPTADA',
        null,
        idActor
      )
      .subscribe({
        next: () => {
          alert('Postulación aceptada correctamente');
          this.postulacionSeleccionada = postulacion;
          this.mostrarModalProgramarEntrevista = true;
        },
        error: (err) => {
          console.error('Error al aceptar postulación:', err);
          alert('Error al aceptar la postulación. Por favor, intenta nuevamente.');
        },
      });
  }

  rechazarPostulacion(postulacion: Postulacion): void {
    // Validar que la postulación esté en estado PENDIENTE
    if (postulacion.estado !== 'PENDIENTE') {
      const estadoActual = postulacion.estado === 'ACEPTADA' ? 'ya fue aceptada' :
                          postulacion.estado === 'RECHAZADA' ? 'ya fue rechazada' :
                          postulacion.estado === 'CANCELADA' ? 'fue cancelada' :
                          'no está disponible';
      alert(`No se puede rechazar esta postulación porque ${estadoActual}.`);
      return;
    }

    this.postulacionSeleccionada = postulacion;
    this.mostrarModalRechazo = true;
  }

  confirmarRechazo(motivo: string): void {
    if (!this.postulacionSeleccionada) return;

    const usuarioActual = this.authService.getCurrentUser();
    const idActor = usuarioActual?.id || 0;

    this.postulacionesService
      .actualizarEstadoPostulacion(
        this.postulacionSeleccionada.idPostulacion,
        'RECHAZADA',
        motivo,
        idActor
      )
      .subscribe({
        next: () => {
          alert('Postulación rechazada correctamente');
          this.cerrarModalRechazo();
          this.cargarPagina(this.page);
        },
        error: (err) => {
          console.error('Error al rechazar postulación:', err);
          alert('Error al rechazar la postulación. Por favor, intenta nuevamente.');
        },
      });
  }

  cerrarModalRechazo(): void {
    this.mostrarModalRechazo = false;
    this.postulacionSeleccionada = null;
  }

  confirmarProgramarEntrevista(datosEntrevista: DatosEntrevista): void {
    if (!this.postulacionSeleccionada) return;

    const postulante = this.postulacionSeleccionada.postulante;
    const oportunidad = this.postulacionSeleccionada.oportunidad;

    if (!postulante || !oportunidad) {
      alert('Error: datos incompletos');
      return;
    }

    // Construir mensaje
    const mensajePersonalizado = datosEntrevista.mensaje && datosEntrevista.mensaje.trim() 
      ? `${datosEntrevista.mensaje}\n\n` 
      : '';
    
    const mensaje = `Hola ${postulante.nombre},

Felicidades! Tu postulacion para "${oportunidad.titulo}" ha sido aceptada.

Fecha: ${this.formatearFecha(datosEntrevista.fecha)}
Hora: ${datosEntrevista.hora}

${mensajePersonalizado}Esperamos verte pronto!

Saludos,
Equipo de Reclutamiento`;

    if (datosEntrevista.medio === 'email') {
      // Abrir cliente de correo
      const subject = `Invitación a Entrevista - ${oportunidad.titulo}`;
      const mailtoLink = `mailto:${postulante.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mensaje)}`;
      window.open(mailtoLink, '_blank');
    } else {
      // Abrir WhatsApp
      const telefono = postulante.telefono || '';
      if (!telefono) {
        alert('El candidato no tiene número de teléfono registrado');
        return;
      }
      const telefonoLimpio = telefono.replace(/\D/g, '');
      const whatsappLink = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappLink, '_blank');
    }

    // TODO: Guardar entrevista en la base de datos
    console.log('Entrevista programada:', {
      idPostulacion: this.postulacionSeleccionada.idPostulacion,
      ...datosEntrevista
    });

    this.cerrarModalProgramarEntrevista();
    this.cargarPagina(this.page);
  }

  cerrarModalProgramarEntrevista(): void {
    this.mostrarModalProgramarEntrevista = false;
    this.postulacionSeleccionada = null;
  }

  private formatearFecha(fecha: string): string {
    if (!fecha) return '';
    
    // Parsear fecha en formato YYYY-MM-DD
    const [year, month, day] = fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
