import { gql } from 'apollo-angular';

export const POSTULACIONES_EMPRESA = gql`
  query PostulacionesEmpresa(
    $idOfertante: ID!
    $page: Int!
    $size: Int!
    $sort: String
    $filtro: PostulacionFiltro
  ) {
    postulacionesEmpresa(
      idOfertante: $idOfertante
      page: $page
      size: $size
      sort: $sort
      filtro: $filtro
    ) {
      total
      page
      size
      items {
        idPostulacion
        fechaPostulacion
        estado
        oportunidad {
          idOportunidad
          titulo
        }
        postulante {
          idUsuario
          nombre
          apellido
          email
        }
      }
    }
  }
`;
