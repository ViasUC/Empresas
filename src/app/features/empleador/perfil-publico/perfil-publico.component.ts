import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConvenioService } from '../../../core/services/convenio.service';
import { Apollo, gql } from 'apollo-angular';

@Component({
  selector: 'app-perfil-publico-empresa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-publico.component.html',
  styleUrls: ['./perfil-publico.component.scss']
})
export class PerfilPublicoEmpresaComponent implements OnInit {
  
  empresa: any = null;
  oportunidadesActivas: any[] = [];
  conveniosActivos: any[] = [];
  endorsements: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private convenioService: ConvenioService,
    private apollo: Apollo
  ) {}

  ngOnInit(): void {
    this.cargarDatosEmpresa();
    this.cargarOportunidades();
    this.cargarConvenios();
    this.cargarEndorsements();
  }

  cargarDatosEmpresa(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const empresaStorage = JSON.parse(localStorage.getItem('empresa') || '{}');
    
    console.log('Datos de empresa del localStorage:', empresaStorage);
    
    // Usar datos reales del localStorage
    this.empresa = {
      id: usuario.idEmpresa || empresaStorage.idEmpresa || empresaStorage.id,
      nombre: empresaStorage.nombreEmpresa || empresaStorage.razonSocial || 'Empresa',
      descripcion: empresaStorage.descripcion || 'Sin descripción',
      ruc: empresaStorage.ruc || empresaStorage.rucEmpresa || 'Sin RUC',
      ubicacion: empresaStorage.ubicacion || empresaStorage.direccion || 'Sin ubicación',
      sector: empresaStorage.sector || empresaStorage.industria || 'Sin especificar',
      tamano: empresaStorage.tamano || empresaStorage.cantidadEmpleados || 'Sin especificar',
      sitioWeb: empresaStorage.sitioWeb || empresaStorage.website || null,
      logoUrl: empresaStorage.logoUrl || empresaStorage.logo || null
    };
  }

  cargarOportunidades(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const idEmpresa = usuario.idEmpresa;
    
    if (!idEmpresa) {
      this.errorMessage = 'Usuario no pertenece a ninguna empresa';
      return;
    }

    // Query GraphQL para obtener oportunidades activas
    const OBTENER_OPORTUNIDADES = gql`
      query ObtenerOportunidadesActivas($idEmpresa: ID!) {
        obtenerOportunidadesActivas(idEmpresa: $idEmpresa) {
          idOportunidad
          titulo
          descripcion
          fechaPublicacion
          estado
        }
      }
    `;

    this.apollo.query({
      query: OBTENER_OPORTUNIDADES,
      variables: { idEmpresa: idEmpresa.toString() },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result: any) => {
        this.oportunidadesActivas = result.data.obtenerOportunidadesActivas || [];
      },
      error: (error: any) => {
        console.error('Error al cargar oportunidades:', error);
      }
    });
  }

  cargarConvenios(): void {
    this.convenioService.listarConveniosVigentes().subscribe({
      next: (response: any) => {
        this.conveniosActivos = response.convenios || [];
      },
      error: (error: any) => {
        console.error('Error al cargar convenios:', error);
      }
    });
  }

  cargarEndorsements(): void {
    if (!this.empresa?.id) {
      console.warn('No hay ID de empresa para cargar endorsements');
      return;
    }

    console.log('Cargando endorsements para empresa ID:', this.empresa.id);

    const OBTENER_ENDORSEMENTS = gql`
      query ObtenerEndorsements($toUserId: Int!, $status: EndorsementStatus) {
        endorsementsReceived(toUserId: $toUserId, status: $status) {
          idEndorsement
          fromUserId
          skill
          message
          createdAt
        }
      }
    `;

    const GET_USUARIO = gql`
      query ObtenerUsuario($id: ID!) {
        usuario(id: $id) {
          idUsuario
          nombre
          apellido
        }
      }
    `;

    this.apollo.query({
      query: OBTENER_ENDORSEMENTS,
      variables: {
        toUserId: this.empresa.id,
        status: 'ACCEPTED'
      }
    }).subscribe({
      next: (result: any) => {
        console.log('Resultado de endorsements:', result);
        const endorsementsData = result.data.endorsementsReceived || [];
        console.log('Endorsements recibidos:', endorsementsData);
        
        if (endorsementsData.length === 0) {
          console.warn('No se encontraron endorsements para la empresa');
          this.endorsements = [];
          return;
        }
        
        // Para cada endorsement, obtener el nombre del usuario
        const endorsementPromises = endorsementsData.map((endorsement: any) => {
          console.log('Obteniendo usuario para endorsement:', endorsement.fromUserId);
          return this.apollo.query({
            query: GET_USUARIO,
            variables: { id: endorsement.fromUserId }
          }).toPromise().then((userResult: any) => {
            const usuario = userResult.data.usuario;
            console.log('Usuario obtenido:', usuario);
            return {
              id: endorsement.idEndorsement,
              usuario: usuario ? `${usuario.nombre} ${usuario.apellido || ''}`.trim() : 'Usuario',
              cargo: endorsement.skill || 'Sin especificar',
              fecha: endorsement.createdAt || '',
              comentario: endorsement.message || 'Sin comentario',
              avatar: null
            };
          });
        });

        Promise.all(endorsementPromises).then(endorsements => {
          console.log('Endorsements procesados:', endorsements);
          this.endorsements = endorsements;
        });
      },
      error: (error: any) => {
        console.error('Error al cargar endorsements:', error);
        this.endorsements = [];
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }

  verDetalleOportunidad(oportunidad: any): void {
    // TODO: Navegar al detalle de la oportunidad
    console.log('Ver detalle:', oportunidad);
  }
}
