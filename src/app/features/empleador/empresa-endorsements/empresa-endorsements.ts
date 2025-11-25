import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { Subject, of, forkJoin } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap,
  takeUntil
} from 'rxjs/operators';

import {
  EmpresaEndorsementsApiService,
  UsuarioResumenDto
} from './services/empresa-endorsements-api.service';

type Tab = 'recibidos' | 'enviados' | 'crear';
type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface EndorsementUI {
  idEndorsement: number;
  fromUserId?: number;
  toUserId?: number;
  skill: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

interface UsuarioMap { [id: number]: { nombre: string; apellido?: string; email?: string; tipo?: string } }

@Component({
  selector: 'app-empresa-endorsements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empresa-endorsements.html',
  styleUrls: ['./empresa-endorsements.scss'],
})
export class EmpresaEndorsementsComponent implements OnInit, OnDestroy {

  activeTab: Tab = 'recibidos';

  filtroRecibidos: StatusFilter = 'ALL';
  filtroEnviados: StatusFilter = 'ALL';
  filtroRolRecibidos: string = 'ALL';
  filtroRolEnviados: string = 'ALL';

  // Etiquetas de rol legibles para el filtro (excluimos Empleador y Administrador)
  roleOptions: string[] = ['ALL', 'Estudiante', 'Egresado', 'Docente'];

  recibidos: EndorsementUI[] = [];
  enviados: EndorsementUI[] = [];

  loading = false;
  errorMsg = '';

  // ===== Typeahead destinatarios =====
  searchText = '';
  posiblesDestinatarios: UsuarioResumenDto[] = [];
  selectedDestinatario: UsuarioResumenDto | null = null;
  buscandoDestinatarios = false;
  usuariosCache: UsuarioMap = {};

  private searchTerm$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  // =================================

  form = {
    toUserId: null as number | null,
    skill: '',
    message: '',
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: EmpresaEndorsementsApiService
  ) {}

  ngOnInit(): void {
    // 1) prefill primero (para que abra directo)
    this.initPrefill();

    // 2) cargar listas
    this.cargarDatos();

    // 3) stream de búsqueda destinatarios
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.buscandoDestinatarios = true),
        switchMap(term => {
          const t = term.trim();
          if (t.length < 2) return of([]);
          return this.api.buscarDestinatarios(t).pipe(
            catchError(() => of([]))
          );
        }),
        tap(() => this.buscandoDestinatarios = false),
        takeUntil(this.destroy$)
      )
      .subscribe(list => {
        // Filtrar: no mostrar EMPRESARIO ni a sí mismo
        const myId = this.api.getCurrentUserId();
        this.posiblesDestinatarios = list.filter(u =>
          u.id !== myId &&
          u.tipo?.toUpperCase() !== 'EMPRESARIO'
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------- Prefill desde Buscar Candidatos --------
  private initPrefill() {
    const snap = this.route.snapshot.queryParamMap;
    const toParam = snap.get('toUserId');
    const nombre = snap.get('nombre') ?? '';
    const email = snap.get('email') ?? '';

    if (toParam) {
      this.applyPrefill(Number(toParam), nombre, email || undefined);
      return;
    }

    // fallback localStorage si params no llegaron
    const raw = localStorage.getItem('prefill_endorsement_to');
    if (!raw) return;

    try {
      const p = JSON.parse(raw);
      if (p?.toUserId) {
        this.applyPrefill(Number(p.toUserId), p.nombre ?? '', p.email ?? undefined);
      }
    } catch {}
    finally {
      localStorage.removeItem('prefill_endorsement_to');
    }
  }

  private applyPrefill(toUserId: number, nombre: string, email?: string) {
    this.activeTab = 'crear';
    this.form.toUserId = toUserId;
    this.searchText = nombre;

    this.selectedDestinatario = {
      id: toUserId,
      nombre: nombre || 'Destinatario',
      apellido: '',
      email
    };

    this.posiblesDestinatarios = [];
  }
  // -----------------------------------------------

  cargarDatos() {
    this.loading = true;
    this.errorMsg = '';
    
    this.api.getRecibidos().subscribe({
      next: (data: any[]) => {
        this.recibidos = (data || []).map((e: any) => ({
          idEndorsement: e.idEndorsement ?? e.id,
          fromUserId: e.fromUserId,
          toUserId: e.toUserId,
          skill: e.skill,
          message: e.message,
          status: e.status
        }));
        
        const fromIds = Array.from(new Set(this.recibidos.map(r => r.fromUserId).filter((v): v is number => v != null)));
        
        if (fromIds.length === 0) {
          this.loading = false;
          return;
        }
        
        this.cargarUsuariosEnCache(fromIds).subscribe(() => {
          // Filtrar endorsements de Empleador/Administrador
          this.recibidos = this.recibidos.filter(r => {
            const u = r.fromUserId ? this.usuariosCache[r.fromUserId] : undefined;
            if (!u || !u.tipo) return true;
            const label = this.getRoleLabel(u.tipo);
            return label !== 'Empleador' && label !== 'Administrador';
          });
          this.loading = false;
        });
      },
      error: (err) => {
        console.error('Error al cargar endorsements recibidos:', err);
        this.errorMsg = err?.[0]?.message || 'No pude cargar endorsements recibidos.';
        this.loading = false;
      }
    });

    this.api.getEnviados().subscribe({
      next: (data: any[]) => {
        this.enviados = (data || []).map((e: any) => ({
          idEndorsement: e.idEndorsement ?? e.id,
          fromUserId: e.fromUserId,
          toUserId: e.toUserId,
          skill: e.skill,
          message: e.message,
          status: e.status
        }));
        // cargar nombres de destinatarios y luego excluir destinatarios Empleador/Admin
        const toIds = Array.from(new Set(this.enviados.map(r => r.toUserId).filter((v): v is number => v != null)));
        this.cargarUsuariosEnCache(toIds).subscribe(() => {
          this.enviados = this.enviados.filter(r => {
            const u = r.toUserId ? this.usuariosCache[r.toUserId] : undefined;
            if (!u || !u.tipo) return true;
            const label = this.getRoleLabel(u.tipo);
            return label !== 'Empleador' && label !== 'Administrador';
          });
        });
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = err?.[0]?.message || 'No pude cargar endorsements enviados.';
      }
    });
  }

  get recibidosFiltrados(): EndorsementUI[] {
    let list = (this.filtroRecibidos === 'ALL') ? this.recibidos : this.recibidos.filter(e => e.status === this.filtroRecibidos);
    
    if (this.filtroRolRecibidos === 'ALL') return list;
    
    return list.filter(e => {
      const u = e.fromUserId ? this.usuariosCache[e.fromUserId] : undefined;
      if (!u || !u.tipo) return false;
      return this.getRoleLabel(u.tipo) === this.filtroRolRecibidos;
    });
  }

  get enviadosFiltrados(): EndorsementUI[] {
    let list = (this.filtroEnviados === 'ALL') ? this.enviados : this.enviados.filter(e => e.status === this.filtroEnviados);
    if (this.filtroRolEnviados === 'ALL') return list;
    return list.filter(e => {
      const u = e.toUserId ? this.usuariosCache[e.toUserId] : undefined;
      if (!u || !u.tipo) return false;
      return this.getRoleLabel(u.tipo) === this.filtroRolEnviados;
    });
  }

  cambiarTab(tab: Tab) {
    this.activeTab = tab;
    this.errorMsg = '';
  }

  /** Cargar usuarios por ids y guardarlos en cache (paralelo) */
  private cargarUsuariosEnCache(ids: number[]) {
    const missing = ids.filter(id => id && !this.usuariosCache[id]);
    if (missing.length === 0) return of([] as (UsuarioResumenDto | null)[]);

    const calls = missing.map(id => this.api.getUsuarioById(id).pipe(catchError(() => of(null))));
    // ejecutar en paralelo y poblar cache
    return forkJoin(calls).pipe(tap(results => {
      (results || []).forEach((u: UsuarioResumenDto | null) => {
        if (!u) return;
        this.usuariosCache[u.id] = { nombre: u.nombre || '', apellido: u.apellido || '', email: u.email, tipo: u.tipo };
      });
    }));
  }

  /** Mapear rol backend a etiqueta legible */
  getRoleLabel(rol?: string): string {
    if (!rol) return '';
    const r = (rol || '').toLowerCase();
    if (r === 'alumno' || r === 'estudiante') return 'Estudiante';
    if (r === 'egresado') return 'Egresado';
    if (r === 'profesor' || r === 'investigador' || r === 'docente') return 'Docente';
    if (r === 'empresa' || r === 'empleador' || r === 'empresario') return 'Empleador';
    if (r === 'administrador' || r === 'admin') return 'Administrador';
    return rol.charAt(0).toUpperCase() + rol.slice(1);
  }

  /** Clase CSS para badge de rol (visual) */
  getRoleBadgeClass(rol?: string): string {
    if (!rol) return 'badge-default';
    const r = (rol || '').toLowerCase();
    if (r.includes('alum') || r.includes('estud')) return 'badge-estudiante';
    if (r.includes('egres')) return 'badge-egresado';
    if (r.includes('prof') || r.includes('invest') || r.includes('docent')) return 'badge-docente';
    if (r.includes('emp') || r.includes('empresa') || r.includes('empleador') || r.includes('empres')) return 'badge-empleador';
    if (r.includes('admin')) return 'badge-admin';
    return 'badge-default';
  }

  volverDashboard() {
    this.router.navigate(['/dashboard/empleador']);
  }

  // ====== BUSCADOR DESTINATARIO ======
  onSearchChange(value: string) {
    this.searchTerm$.next(value);
  }

  seleccionarDestinatario(u: UsuarioResumenDto) {
    this.selectedDestinatario = u;
    this.form.toUserId = u.id;
    this.searchText = `${u.nombre} ${u.apellido}`.trim();
    this.posiblesDestinatarios = [];
  }

  limpiarDestinatario() {
    this.selectedDestinatario = null;
    this.form.toUserId = null;
    this.searchText = '';
    this.posiblesDestinatarios = [];
  }
  // ==================================

  enviarEndorsement() {
    if (!this.form.toUserId) {
      this.errorMsg = 'Elegí un destinatario antes de enviar.';
      return;
    }
    if (!this.form.skill.trim() || !this.form.message.trim()) {
      this.errorMsg = 'Skill y mensaje no pueden estar vacíos.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.api.crearEndorsement({
      toUserId: this.form.toUserId,
      skill: this.form.skill.trim(),
      message: this.form.message.trim()
    }).subscribe({
      next: () => {
        this.loading = false;
        this.form = { toUserId: null, skill: '', message: '' };
        this.limpiarDestinatario();
        this.activeTab = 'enviados';
        this.cargarDatos();
      },
      error: (err) => {
        console.error('ERROR CREAR ENDORSEMENT:', err);
        if (Array.isArray(err) && err.length > 0) {
          console.error('Error array:', err[0]);
          this.errorMsg = err[0].message || JSON.stringify(err[0]);
        } else {
          this.errorMsg = err?.message || 'No se pudo enviar el endorsement.';
        }
        this.loading = false;
      }
    });
  }

  decidirEndorsement(e: EndorsementUI, accept: boolean) {
    this.loading = true;
    this.errorMsg = '';

    this.api.responderEndorsement({
      id: e.idEndorsement,
      accept
    }).subscribe({
      next: () => {
        this.loading = false;
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al decidir endorsement:', err);
        this.loading = false;
        this.errorMsg = err?.[0]?.message || err?.message || 'No se pudo registrar la decisión.';
      }
    });
  }
}
