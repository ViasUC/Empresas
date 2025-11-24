import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, throwError, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface UsuarioResumenDto {
  id: number;
  nombre: string;
  apellido: string;
  email?: string;
  tipo?: string;
}

export interface EndorsementDto {
  idEndorsement: number;
  fromUserId: number;
  toUserId: number;
  skill: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt?: string;
}

type GqlResponse<T> = { data?: T; errors?: any[] };

@Injectable({ providedIn: 'root' })
export class EmpresaEndorsementsApiService {

  // Preferir `environment.graphqlUrl` si está definido, si no usar apiUrl+"/graphql"
  private gqlUrl = (environment as any).graphqlUrl || `${environment.apiUrl.replace(/\/$/, '')}/graphql`;

  constructor(private http: HttpClient) {}

  // ===== helpers de sesión =====
  private getToken(): string | null {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('authToken')
    );
  }

  public getCurrentUserId(): number {
    const direct =
      localStorage.getItem('userId') ||
      localStorage.getItem('idUsuario') ||
      localStorage.getItem('usuarioId');

    if (direct && !Number.isNaN(+direct)) return +direct;

    const objKeys = ['user', 'usuario', 'currentUser', 'auth_user'];
    for (const k of objKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const o = JSON.parse(raw);
        const id = o.id ?? o.idUsuario ?? o.usuarioId ?? o.userId ?? o.sub;
        if (id && !Number.isNaN(+id)) return +id;
      } catch {}
    }

    throw new Error('No se encontró userId en localStorage.');
  }

  private postGql<T>(query: string, variables?: any) {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });

    return this.http
      .post<GqlResponse<T>>(this.gqlUrl, { query, variables }, { headers })
      .pipe(
        map(res => {
          if (res.errors?.length) {
            throw res.errors;
          }
          return res.data as T;
        }),
        catchError(err => throwError(() => err))
      );
  }

  // =========================
  //          QUERIES
  // =========================

  getRecibidos(status?: 'PENDING' | 'ACCEPTED' | 'REJECTED') {
    const query = `
      query($toUserId: Int!, $status: EndorsementStatus) {
        endorsementsReceived(toUserId: $toUserId, status: $status) {
          idEndorsement
          fromUserId
          toUserId
          skill
          message
          status
          createdAt
        }
      }
    `;

    const toUserId = this.getCurrentUserId();
    return this.postGql<{ endorsementsReceived: EndorsementDto[] }>(query, {
      toUserId,
      status: status ?? null
    }).pipe(map(d => d.endorsementsReceived));
  }

  getEnviados() {
    const query = `
      query($fromUserId: Int!) {
        endorsementsGiven(fromUserId: $fromUserId) {
          idEndorsement
          fromUserId
          toUserId
          skill
          message
          status
          createdAt
        }
      }
    `;

    const fromUserId = this.getCurrentUserId();
    return this.postGql<{ endorsementsGiven: EndorsementDto[] }>(query, {
      fromUserId
    }).pipe(map(d => d.endorsementsGiven));
  }

  buscarDestinatarios(term: string) {
    const query = `
      query($q: String!) {
        buscarDestinatarios(q: $q) {
          id
          nombre
          apellido
          email
          tipo
        }
      }
    `;

    return this.postGql<{ buscarDestinatarios: UsuarioResumenDto[] }>(query, {
      q: term
    }).pipe(map(d => d.buscarDestinatarios));
  }

  /** Obtener datos resumidos de un usuario por id */
  getUsuarioById(id: number) {
    const query = `
      query($id: ID!) {
        usuario(id: $id) {
          idUsuario
          nombre
          apellido
          email
          rolPrincipal
        }
      }
    `;

    return this.postGql<{ usuario: any }>(query, { id }).pipe(
      map(d => {
        const u = d.usuario;
        if (!u) return null;
        return {
          id: +u.idUsuario,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
          tipo: u.rolPrincipal ? String(u.rolPrincipal) : undefined
        } as UsuarioResumenDto;
      })
    );
  }

  // =========================
  //         MUTATIONS
  // =========================

  crearEndorsement(input: { toUserId: number; skill: string; message: string }) {
    // A) schema con input SIN fromUserId
    const mA = `
      mutation($input: CreateEndorsementInput!) {
        createEndorsement(input: $input) {
          idEndorsement
          status
        }
      }
    `;

    // B) schema con args directos
    const mB = `
      mutation($toUserId: Int!, $skill: String!, $message: String!) {
        createEndorsement(toUserId: $toUserId, skill: $skill, message: $message) {
          idEndorsement
          status
        }
      }
    `;

    // C) schema con input CON fromUserId
    const mC = `
      mutation($input: CreateEndorsementInput!) {
        createEndorsement(input: $input) {
          idEndorsement
          status
        }
      }
    `;

    const fromUserId = this.getCurrentUserId();

    return this.postGql<{ createEndorsement: EndorsementDto }>(mA, {
      input: {
        toUserId: input.toUserId,
        skill: input.skill,
        message: input.message
      }
    }).pipe(
      map(d => d.createEndorsement),
      catchError(() =>
        this.postGql<{ createEndorsement: EndorsementDto }>(mB, {
          toUserId: input.toUserId,
          skill: input.skill,
          message: input.message
        }).pipe(
          map(d => d.createEndorsement),
          catchError(() =>
            this.postGql<{ createEndorsement: EndorsementDto }>(mC, {
              input: {
                fromUserId,
                toUserId: input.toUserId,
                skill: input.skill,
                message: input.message
              }
            }).pipe(map(d => d.createEndorsement))
          )
        )
      )
    );
  }

  responderEndorsement(input: { id: number; accept: boolean }) {
    // A) schema con input SIN actorId
    const mA = `
      mutation($input: EndorsementDecisionInput!) {
        decideEndorsement(input: $input) {
          idEndorsement
          status
        }
      }
    `;

    // B) schema con args directos
    const mB = `
      mutation($id: Int!, $accept: Boolean!) {
        decideEndorsement(id: $id, accept: $accept) {
          idEndorsement
          status
        }
      }
    `;

    // C) schema con input CON actorId
    const mC = `
      mutation($input: EndorsementDecisionInput!) {
        decideEndorsement(input: $input) {
          idEndorsement
          status
        }
      }
    `;

    const actorId = this.getCurrentUserId();

    return this.postGql<{ decideEndorsement: any }>(mA, {
      input: { id: input.id, accept: input.accept }
    }).pipe(
      map(d => d.decideEndorsement),
      catchError(() =>
        this.postGql<{ decideEndorsement: any }>(mB, {
          id: input.id,
          accept: input.accept
        }).pipe(
          map(d => d.decideEndorsement),
          catchError(() =>
            this.postGql<{ decideEndorsement: any }>(mC, {
              input: { id: input.id, actorId, accept: input.accept }
            }).pipe(map(d => d.decideEndorsement))
          )
        )
      )
    );
  }
}
