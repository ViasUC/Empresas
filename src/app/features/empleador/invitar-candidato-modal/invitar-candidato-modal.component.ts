import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';

// Query para obtener oportunidades activas de una empresa
const GET_OPORTUNIDADES_ACTIVAS = gql`
  query ObtenerOportunidadesActivas($idEmpresa: ID!) {
    obtenerOportunidadesActivas(idEmpresa: $idEmpresa) {
      idOportunidad
      titulo
      descripcion
      ubicacion
      modalidad
      tipo
      fechaCierre
    }
  }
`;

// Mutation para registrar una invitacion
const REGISTRAR_INVITACION = gql`
  mutation RegistrarInvitacion($input: RegistrarInvitacionInput!) {
    registrarInvitacion(input: $input) {
      success
      message
      idAuditoria
    }
  }
`;

// Query para verificar invitacion existente
const VERIFICAR_INVITACION_EXISTENTE = gql`
  query VerificarInvitacionExistente($idUsuario: Int!, $idOportunidad: Int, $idConvenio: Int) {
    verificarInvitacionExistente(
      idUsuario: $idUsuario
      idOportunidad: $idOportunidad
      idConvenio: $idConvenio
    ) {
      existe
      fechaEnvio
      mensaje
    }
  }
`;

interface Oportunidad {
  idOportunidad: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  modalidad: string;
  tipo: string;
  fechaCierre: string;
}

@Component({
  selector: 'app-invitar-candidato-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invitar-candidato-modal.component.html',
  styleUrl: './invitar-candidato-modal.component.scss'
})
export class InvitarCandidatoModalComponent implements OnInit {
  @Input() idUsuario!: number;
  @Input() nombreCandidato: string = '';
  @Input() emailCandidato: string = '';
  @Input() telefonoCandidato: string = '';
  
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() invitacionEnviada = new EventEmitter<boolean>();

  // Estados
  cargando = false;
  errorCarga = '';
  
  // Tabs
  tabActiva: 'oportunidades' | 'convenios' = 'oportunidades';
  
  // Listas
  oportunidades: Oportunidad[] = [];
  convenios: any[] = []; // Por ahora vacio hasta que se implemente convenios
  
  // Seleccion
  itemSeleccionado: any = null;
  
  // Canal de envio
  canalSeleccionado: 'EMAIL' | 'WHATSAPP' = 'EMAIL';
  
  // Mensaje
  mensajeGenerado = '';
  mensajeEditable = '';
  
  // Vista
  mostrarPreview = false;

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {
    this.cargarOportunidades();
    
    // Validar que el candidato tenga los datos necesarios
    if (!this.emailCandidato && !this.telefonoCandidato) {
      this.errorCarga = 'El candidato no tiene email ni telefono registrado';
    }
  }

  cargarOportunidades(): void {
    this.cargando = true;
    this.errorCarga = '';

    const usuarioStr = localStorage.getItem('usuario');
    console.log('localStorage usuario:', usuarioStr);
    
    const usuario = JSON.parse(usuarioStr || '{}');
    console.log('usuario parseado:', usuario);
    console.log('idEmpresa:', usuario.idEmpresa);
    
    const idEmpresa = usuario.idEmpresa;

    if (!idEmpresa) {
      this.errorCarga = 'No se pudo obtener la empresa del usuario. Usuario: ' + JSON.stringify(usuario);
      this.cargando = false;
      return;
    }

    this.apollo
      .query<any>({
        query: GET_OPORTUNIDADES_ACTIVAS,
        variables: { idEmpresa: idEmpresa.toString() },
        fetchPolicy: 'network-only'
      })
      .subscribe({
        next: (result) => {
          this.oportunidades = result.data?.obtenerOportunidadesActivas || [];
          this.cargando = false;
          
          if (this.oportunidades.length === 0) {
            this.errorCarga = 'No hay oportunidades activas disponibles';
          }
        },
        error: (error) => {
          console.error('Error al cargar oportunidades:', error);
          this.errorCarga = 'Error al cargar oportunidades';
          this.cargando = false;
        }
      });
  }

  cambiarTab(tab: 'oportunidades' | 'convenios'): void {
    this.tabActiva = tab;
    this.itemSeleccionado = null;
    this.mostrarPreview = false;
  }

  seleccionarItem(item: any): void {
    this.itemSeleccionado = item;
    this.generarMensaje();
  }

  cambiarCanal(canal: 'EMAIL' | 'WHATSAPP'): void {
    this.canalSeleccionado = canal;
    
    // Validar que el candidato tenga el dato necesario
    if (canal === 'EMAIL' && !this.emailCandidato) {
      alert('El candidato no tiene email registrado');
      this.canalSeleccionado = 'WHATSAPP';
      return;
    }
    
    if (canal === 'WHATSAPP' && !this.telefonoCandidato) {
      alert('El candidato no tiene telefono registrado');
      this.canalSeleccionado = 'EMAIL';
      return;
    }
    
    this.generarMensaje();
  }

  generarMensaje(): void {
    if (!this.itemSeleccionado) return;

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const nombreEmpresa = usuario.nombreEmpresa || 'nuestra empresa';

    if (this.tabActiva === 'oportunidades') {
      const oportunidad = this.itemSeleccionado as Oportunidad;
      
      if (this.canalSeleccionado === 'EMAIL') {
        this.mensajeGenerado = `Hola ${this.nombreCandidato},

Te contactamos desde ${nombreEmpresa} para invitarte a postular a la siguiente oportunidad:

OPORTUNIDAD: ${oportunidad.titulo}
TIPO: ${oportunidad.tipo}
MODALIDAD: ${oportunidad.modalidad}
UBICACION: ${oportunidad.ubicacion}

DESCRIPCION:
${oportunidad.descripcion}

Si estas interesado, por favor responde a este correo o contactanos directamente.

Saludos cordiales,
${nombreEmpresa}`;
      } else {
        this.mensajeGenerado = `Hola ${this.nombreCandidato}, te contactamos desde ${nombreEmpresa}. Tenemos una oportunidad que podria interesarte: "${oportunidad.titulo}" (${oportunidad.tipo} - ${oportunidad.modalidad}). Si quieres mas informacion, respondeme a este mensaje.`;
      }
    }

    this.mensajeEditable = this.mensajeGenerado;
  }

  mostrarPreviewMensaje(): void {
    if (!this.itemSeleccionado) {
      alert('Selecciona una oportunidad o convenio primero');
      return;
    }
    
    this.mostrarPreview = true;
  }

  volverASeleccion(): void {
    this.mostrarPreview = false;
  }

  async enviarInvitacion(): Promise<void> {
    if (!this.itemSeleccionado) {
      alert('Selecciona una oportunidad o convenio');
      return;
    }

    if (!this.mensajeEditable.trim()) {
      alert('El mensaje no puede estar vacio');
      return;
    }

    this.cargando = true;

    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      
      // Primero verificar si ya existe una invitacion
      const verificacion = await this.apollo
        .query<any>({
          query: VERIFICAR_INVITACION_EXISTENTE,
          variables: {
            idUsuario: this.idUsuario,
            idOportunidad: this.tabActiva === 'oportunidades' 
              ? parseInt(this.itemSeleccionado.idOportunidad) 
              : null,
            idConvenio: this.tabActiva === 'convenios' 
              ? parseInt(this.itemSeleccionado.idConvenio) 
              : null
          },
          fetchPolicy: 'network-only'
        })
        .toPromise();

      if (verificacion?.data?.verificarInvitacionExistente?.existe) {
        const fechaEnvio = verificacion.data.verificarInvitacionExistente.fechaEnvio;
        alert(`Ya se envio una invitacion a este candidato el ${fechaEnvio}`);
        this.cargando = false;
        return;
      }

      // Registrar la invitacion
      const input = {
        idUsuario: this.idUsuario,
        idEmpresa: usuario.idEmpresa,
        idOportunidad: this.tabActiva === 'oportunidades' 
          ? parseInt(this.itemSeleccionado.idOportunidad) 
          : null,
        idConvenio: this.tabActiva === 'convenios' 
          ? parseInt(this.itemSeleccionado.idConvenio) 
          : null,
        tipoInvitacion: this.tabActiva.toUpperCase(),
        canal: this.canalSeleccionado,
        mensaje: this.mensajeEditable,
        actorId: usuario.idUsuario || usuario.id
      };

      const result = await this.apollo
        .mutate<any>({
          mutation: REGISTRAR_INVITACION,
          variables: { input }
        })
        .toPromise();

      const response = result?.data?.registrarInvitacion;

      if (response?.success) {
        // Abrir el canal seleccionado
        if (this.canalSeleccionado === 'EMAIL') {
          const mailto = `mailto:${this.emailCandidato}?subject=Invitacion a oportunidad&body=${encodeURIComponent(this.mensajeEditable)}`;
          window.open(mailto, '_blank');
        } else {
          const whatsappUrl = `https://wa.me/${this.telefonoCandidato.replace(/\D/g, '')}?text=${encodeURIComponent(this.mensajeEditable)}`;
          window.open(whatsappUrl, '_blank');
        }

        alert('Invitacion registrada exitosamente');
        this.invitacionEnviada.emit(true);
        this.cerrar();
      } else {
        alert(response?.message || 'Error al registrar invitacion');
      }

    } catch (error) {
      console.error('Error al enviar invitacion:', error);
      alert('Error al enviar invitacion');
    } finally {
      this.cargando = false;
    }
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}
