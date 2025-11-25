import { gql } from 'apollo-angular';

export const HISTORIAL_POSTULACION = gql`
  query HistorialPostulacion($idPostulacion: ID!) {
    historialPostulacion(idPostulacion: $idPostulacion) {
      idHistorial
      estadoAnterior
      estadoNuevo
      fechaCambio
      motivo
      actor {
        idUsuario
        nombre
        apellido
      }
    }
  }
`;

export const ACTUALIZAR_ESTADO_POSTULACION = gql`
  mutation ActualizarEstadoPostulacion(
    $idPostulacion: ID!
    $estado: PostulacionEstado!
    $motivo: String
    $idActor: ID
  ) {
    actualizarEstadoPostulacion(
      idPostulacion: $idPostulacion
      estado: $estado
      motivo: $motivo
      idActor: $idActor
    ) {
      idPostulacion
      estado
    }
  }
`;
