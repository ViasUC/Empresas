import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { EmpresaEndorsementsApiService } from '../empresa-endorsements/services/empresa-endorsements-api.service';
import { BusquedaService, Portafolio, FiltrosDisponibles, ResultadoBusqueda } from '../services/busqueda.service';
import { AuthService } from '../../../core/services/auth.service';

// Interfaz para filtros activos (chips)
interface FiltroActivo {
  key: string;
  label: string;
  value: any;
}

// Interfaz extendida de Portafolio con estados locales
interface PortafolioExtendido extends Portafolio {
  mostrarContacto?: boolean;
  estadoGuardado?: 'idle' | 'saving' | 'saved';
  guardado?: boolean;
  guardando?: boolean;
}

@Component({
  selector: 'app-buscar-portafolios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './buscar-portafolios.html',
  styleUrl: './buscar-portafolios.scss'
})
export class BuscarPortafoliosComponent implements OnInit, OnDestroy {
  // === Propiedades de UI ===
  filtersPanelCollapsed: boolean = false;
  cargando: boolean = false;
  busquedaRealizada: boolean = false;

  // === Búsqueda con debounce ===
  searchText: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // === Formulario de filtros extendido ===
  filtrosForm!: FormGroup;
  filtrosDisponibles: FiltrosDisponibles | null = null;
  filtrosActivos: FiltroActivo[] = [];

  // === Ordenamiento ===
  ordenActual: string = 'relevancia';
  opcionesOrden = [
    { value: 'relevancia', label: 'Más relevantes' },
    { value: 'recientes', label: 'Más recientes' },
    { value: 'rating', label: 'Mejor rating' }
  ];

  // === Resultados ===
  resultados: PortafolioExtendido[] = [];
  total: number = 0;
  paginaActual: number = 1;
  totalPaginas: number = 0;

  // === Opciones de filtros ===
  modalidadesOptions = [
    { value: 'presencial', label: 'Presencial' },
    { value: 'remoto', label: 'Remoto' },
    { value: 'hibrido', label: 'Híbrido' }
  ];

  aniosEstudioOptions = [
    { value: '1', label: '1er año' },
    { value: '2', label: '2do año' },
    { value: '3', label: '3er año' },
    { value: '4', label: '4to año' },
    { value: '5', label: '5to año' }
  ];

  idiomasOptions = [
    { value: 'espanol', label: 'Español' },
    { value: 'ingles', label: 'Inglés' },
    { value: 'portugues', label: 'Portugués' },
    { value: 'frances', label: 'Francés' },
    { value: 'aleman', label: 'Alemán' }
  ];

  experienciasOptions = [
    { value: 'sin_experiencia', label: 'Sin experiencia' },
    { value: '0-1', label: 'Menos de 1 año' },
    { value: '1-3', label: '1-3 años' },
    { value: '3-5', label: '3-5 años' },
    { value: '5+', label: 'Más de 5 años' }
  ];

  constructor(
    private fb: FormBuilder,
    private busquedaService: BusquedaService,
    private authService: AuthService,
    private empresaApi: EmpresaEndorsementsApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Inicializar formulario de filtros con valores EXPLÍCITAMENTE vacíos
    this.filtrosForm = this.fb.group({
      carrera: [''],
      habilidades: [''],
      ubicacion: ['']
    });

    // Limpiar cualquier dato previo
    this.searchText = '';
    this.filtrosActivos = [];
    this.resultados = [];
    this.total = 0;
    this.busquedaRealizada = false;
    this.ordenActual = 'relevancia';

    // Configurar debounce para búsqueda
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe((searchText: string) => {
      console.log('Búsqueda con debounce:', searchText);
      this.aplicarFiltros();
    });

    // Cargar filtros disponibles desde backend
    this.cargarFiltrosDisponibles();

    // Leer parámetros de URL si existen
    this.leerParametrosURL();

    // NO realizar búsqueda inicial automática
    // Usuario debe aplicar filtros o buscar manualmente
  }

  ngOnDestroy(): void {
    // Limpiar suscripción de debounce
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // === Métodos de búsqueda ===

  cargarFiltrosDisponibles(): void {
    this.busquedaService.obtenerFiltros().subscribe({
      next: (filtros) => {
        this.filtrosDisponibles = filtros;
        console.log('Filtros disponibles cargados:', filtros);
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  onSearchTextChange(value: string): void {
    this.searchText = value;
    this.searchSubject.next(value);
  }

  buscarInmediato(): void {
    // Para cuando presiona Enter
    console.log('Búsqueda inmediata:', this.searchText);
    this.aplicarFiltros();
  }

  clearSearch(): void {
    console.log('Limpiando campo de búsqueda');
    this.searchText = '';
    this.searchSubject.next(''); // Forzar emisión de valor vacío
    this.calcularFiltrosActivos(); // Recalcular chips sin el texto de búsqueda
    
    // Si no hay otros filtros activos, limpiar resultados
    if (this.filtrosActivos.length === 0 && !this.tieneFiltrosFormulario()) {
      this.resultados = [];
      this.total = 0;
      this.busquedaRealizada = false;
    } else {
      // Si hay otros filtros, reaplicar sin el texto de búsqueda
      this.aplicarFiltros();
    }
  }

  // Método helper para verificar si hay filtros en el formulario
  private tieneFiltrosFormulario(): boolean {
    const formValue = this.filtrosForm.value;
    return !!(formValue.carrera || formValue.ubicacion || formValue.habilidades?.trim());
  }

  // === Métodos de filtros ===

  toggleFiltersPanel(): void {
    this.filtersPanelCollapsed = !this.filtersPanelCollapsed;
  }

  aplicarFiltros(): void {
    console.log('===== APLICANDO FILTROS =====');
    
    // Primero recalcular filtros activos para mostrar chips correctos
    this.calcularFiltrosActivos();
    
    console.log('Filtros a aplicar:', {
      searchText: this.searchText,
      formulario: this.filtrosForm.value,
      totalChips: this.filtrosActivos.length
    });
    
    // Resetear a página 1 al aplicar filtros
    this.buscar(1);
  }

  calcularFiltrosActivos(): void {
    this.filtrosActivos = [];
    const formValue = this.filtrosForm.value;

    console.log('Calculando filtros activos. Valores del formulario:', formValue);

    // Texto de búsqueda
    if (this.searchText && this.searchText.trim()) {
      this.filtrosActivos.push({
        key: 'searchText',
        label: `Búsqueda: "${this.searchText}"`,
        value: this.searchText
      });
    }

    // Carrera
    if (formValue.carrera && formValue.carrera !== '') {
      this.filtrosActivos.push({
        key: 'carrera',
        label: `Carrera: ${formValue.carrera}`,
        value: formValue.carrera
      });
    }

    // Ubicación
    if (formValue.ubicacion && formValue.ubicacion !== '') {
      this.filtrosActivos.push({
        key: 'ubicacion',
        label: `Ubicación: ${formValue.ubicacion}`,
        value: formValue.ubicacion
      });
    }

    // Habilidades
    if (formValue.habilidades && formValue.habilidades.trim()) {
      this.filtrosActivos.push({
        key: 'habilidades',
        label: `Habilidades: ${formValue.habilidades}`,
        value: formValue.habilidades
      });
    }

    console.log('Filtros activos calculados:', this.filtrosActivos);
  }

  removerFiltro(filtro: FiltroActivo): void {
    console.log('Removiendo filtro:', filtro);
    
    if (filtro.key === 'searchText') {
      this.searchText = '';
    } else if (['carrera', 'ubicacion', 'habilidades'].includes(filtro.key)) {
      // Resetear solo los campos que existen en el formulario
      this.filtrosForm.patchValue({ [filtro.key]: '' });
    }

    // Reaplicar filtros (esto recalcula los chips activos)
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    console.log('===== LIMPIANDO TODOS LOS FILTROS =====');
    console.log('Antes de limpiar:', {
      formulario: this.filtrosForm.value,
      searchText: this.searchText,
      filtrosActivos: this.filtrosActivos.length
    });
    
    // 1. Resetear el formulario usando setValue para forzar valores vacíos
    this.filtrosForm.setValue({
      carrera: '',
      habilidades: '',
      ubicacion: ''
    });
    
    // 2. Marcar el formulario como pristine y untouched
    this.filtrosForm.markAsPristine();
    this.filtrosForm.markAsUntouched();
    
    // 3. Limpiar texto de búsqueda
    this.searchText = '';
    
    // 4. Limpiar array de filtros activos (chips)
    this.filtrosActivos = [];
    
    // 5. Limpiar resultados
    this.resultados = [];
    this.total = 0;
    this.totalPaginas = 0;
    this.paginaActual = 1;
    this.busquedaRealizada = false;
    
    // 6. Resetear ordenamiento
    this.ordenActual = 'relevancia';
    
    // 7. Limpiar URL de query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
    
    console.log('Después de limpiar:', {
      formulario: this.filtrosForm.value,
      searchText: this.searchText,
      filtrosActivos: this.filtrosActivos.length,
      pristine: this.filtrosForm.pristine,
      untouched: this.filtrosForm.untouched
    });
    console.log('===== FILTROS LIMPIADOS COMPLETAMENTE =====');
  }

  // === Ordenamiento ===

  cambiarOrden(): void {
    console.log('Ordenar por:', this.ordenActual);
    
    // Reordenar resultados localmente o hacer nueva búsqueda
    // Por ahora ordenamos localmente
    this.ordenarResultados();
  }

  ordenarResultados(): void {
    if (this.ordenActual === 'recientes') {
      this.resultados.sort((a, b) => {
        const dateA = a.fechaActualizacion ? new Date(a.fechaActualizacion).getTime() : 0;
        const dateB = b.fechaActualizacion ? new Date(b.fechaActualizacion).getTime() : 0;
        return dateB - dateA;
      });
    } else if (this.ordenActual === 'rating') {
      // Por ahora, ordenar por nombre si no hay rating
      // TODO: Agregar campo rating a la interfaz Portafolio cuando esté disponible
      this.resultados.sort((a, b) => {
        const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    // 'relevancia' mantiene el orden del backend
  }

  // === Búsqueda principal ===

  buscar(pagina: number = 1): void {
    this.cargando = true;
    this.paginaActual = pagina;
    this.busquedaRealizada = true;

    const formValue = this.filtrosForm.value;
    
    // Construir objeto de filtros para el backend
    const filtros: any = {
      pagina,
      limite: 20
    };

    // Texto de búsqueda global (busca en nombre, apellido o habilidades)
    if (this.searchText.trim()) {
      filtros.textoBusqueda = this.searchText.trim();
    }

    // Carrera
    if (formValue.carrera && formValue.carrera !== '') {
      filtros.carrera = formValue.carrera;
    }

    // Ubicación
    if (formValue.ubicacion && formValue.ubicacion !== '') {
      filtros.ubicacion = formValue.ubicacion;
    }

    // Habilidades
    if (formValue.habilidades && formValue.habilidades.trim()) {
      const habilidadesArray = formValue.habilidades
        .split(',')
        .map((h: string) => h.trim())
        .filter((h: string) => h.length > 0);
      
      if (habilidadesArray.length > 0) {
        filtros.habilidades = habilidadesArray;
      }
    }

    // Promedio
    if (formValue.promedioMin > 0) {
      filtros.promedioMin = formValue.promedioMin;
    }

    // Salario
    if (formValue.salarioMin) {
      filtros.salarioMin = parseFloat(formValue.salarioMin);
    }
    if (formValue.salarioMax) {
      filtros.salarioMax = parseFloat(formValue.salarioMax);
    }

    // Rating
    if (formValue.ratingMin > 0) {
      filtros.ratingMin = formValue.ratingMin;
    }

    // Modalidad
    if (formValue.modalidad) {
      filtros.modalidad = formValue.modalidad;
    }

    // Año de estudio
    if (formValue.anioEstudio) {
      filtros.anioEstudio = parseInt(formValue.anioEstudio);
    }

    // Idiomas
    if (formValue.idiomas && formValue.idiomas.length > 0) {
      filtros.idiomas = formValue.idiomas;
    }

    // Experiencia
    if (formValue.experiencia) {
      filtros.experiencia = formValue.experiencia;
    }

    // Ordenamiento
    if (this.ordenActual !== 'relevancia') {
      filtros.orden = this.ordenActual;
    }

    console.log('Buscando con filtros:', filtros);

    // Actualizar URL con parámetros
    this.actualizarURL(filtros);

    this.busquedaService.buscarPortafolios(filtros).subscribe({
      next: (resultado: ResultadoBusqueda) => {
        this.resultados = resultado.portafolios.map(p => ({
          ...p,
          mostrarContacto: false,
          estadoGuardado: 'idle',
          guardado: false,
          guardando: false
        }));
        this.total = resultado.total;
        this.totalPaginas = resultado.totalPaginas;
        this.cargando = false;
        
        // Aplicar ordenamiento local si es necesario
        if (this.ordenActual !== 'relevancia') {
          this.ordenarResultados();
        }
        
        console.log(`Búsqueda completada: ${this.resultados.length} resultados de ${this.total} total`);
        // Cargar roles/tipeo de usuario para cada resultado para decidir UI de Aval
        this.loadRolesForResultados();
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.cargando = false;
      }
    });
  }

  /** Cargar roles de usuario para resultados y mapearlos a cada portafolio */
  private loadRolesForResultados() {
    const ids = Array.from(new Set(this.resultados.map(r => r.usuarioId).filter(Boolean)));
    if (ids.length === 0) return;

    const calls = ids.map(id => this.empresaApi.getUsuarioById(+id).pipe(catchError(() => of(null))));
    forkJoin(calls).subscribe((users: any[]) => {
      const map: { [id: string]: any } = {};
      (users || []).forEach(u => {
        if (!u) return;
        map[String(u.id)] = u;
      });

      // asignar info a cada portafolio
      this.resultados = this.resultados.map(p => {
        const u = map[String(p.usuarioId)];
        if (u) {
          // guardar rol original
          (p as any).rol = u.tipo || u.role || u.rol || u.rolPrincipal || null;
          // normalizar tipo para badge
          const t = ((u.tipo || u.role || u.rol || u.rolPrincipal) as string || '').toLowerCase();
          if (t.includes('alum') || t.includes('estud')) p.tipo = 'ESTUDIANTE';
          else if (t.includes('egres')) p.tipo = 'EGRESADO';
          else if (t.includes('prof') || t.includes('invest') || t.includes('docent')) p.tipo = 'DOCENTE';
          else if (t.includes('admin')) p.tipo = 'ADMINISTRADOR';
          else if (t.includes('emp') || t.includes('empr') || t.includes('emplead') || t.includes('empleador')) p.tipo = 'EMPLEADOR';
          // también dejar una marca directa
          (p as any)._usuarioTipo = u.tipo || u.role || u.rol || u.rolPrincipal;
        }
        return p;
      });
    });
  }

  // === Sincronización con URL ===

  leerParametrosURL(): void {
    this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length === 0) return;

      // Leer parámetros y actualizar formulario
      const formUpdates: any = {};

      if (params['q']) {
        this.searchText = params['q'];
      }

      if (params['carrera']) {
        formUpdates.carrera = params['carrera'];
      }

      if (params['ubicacion']) {
        formUpdates.ubicacion = params['ubicacion'];
      }

      if (params['habilidades']) {
        formUpdates.habilidades = params['habilidades'];
      }

      if (params['tipoPerfil']) {
        const tipos = params['tipoPerfil'].split(',');
        formUpdates.tipoPerfil = tipos;
      }

      if (params['promedioMin']) {
        formUpdates.promedioMin = parseFloat(params['promedioMin']);
      }

      if (params['salarioMin']) {
        formUpdates.salarioMin = params['salarioMin'];
      }

      if (params['salarioMax']) {
        formUpdates.salarioMax = params['salarioMax'];
      }

      if (params['ratingMin']) {
        formUpdates.ratingMin = parseFloat(params['ratingMin']);
      }

      if (params['modalidad']) {
        formUpdates.modalidad = params['modalidad'];
      }

      if (params['anioEstudio']) {
        formUpdates.anioEstudio = params['anioEstudio'];
      }

      if (params['idiomas']) {
        const idiomas = params['idiomas'].split(',');
        formUpdates.idiomas = idiomas;
      }

      if (params['experiencia']) {
        formUpdates.experiencia = params['experiencia'];
      }

      if (params['sort']) {
        this.ordenActual = params['sort'];
      }

      if (params['page']) {
        this.paginaActual = parseInt(params['page']);
      }

      // Actualizar formulario si hay cambios
      if (Object.keys(formUpdates).length > 0) {
        this.filtrosForm.patchValue(formUpdates);
      }
    });
  }

  actualizarURL(filtros: any): void {
    const queryParams: any = {};

    if (this.searchText.trim()) {
      queryParams.q = this.searchText.trim();
    }

    if (filtros.carrera) {
      queryParams.carrera = filtros.carrera;
    }

    if (filtros.ubicacion) {
      queryParams.ubicacion = filtros.ubicacion;
    }

    if (filtros.habilidades) {
      queryParams.habilidades = filtros.habilidades.join(',');
    }

    if (filtros.tipoPerfil && filtros.tipoPerfil.length > 0) {
      queryParams.tipoPerfil = filtros.tipoPerfil.join(',');
    }

    if (filtros.promedioMin) {
      queryParams.promedioMin = filtros.promedioMin;
    }

    if (filtros.salarioMin) {
      queryParams.salarioMin = filtros.salarioMin;
    }

    if (filtros.salarioMax) {
      queryParams.salarioMax = filtros.salarioMax;
    }

    if (filtros.ratingMin) {
      queryParams.ratingMin = filtros.ratingMin;
    }

    if (filtros.modalidad) {
      queryParams.modalidad = filtros.modalidad;
    }

    if (filtros.anioEstudio) {
      queryParams.anioEstudio = filtros.anioEstudio;
    }

    if (filtros.idiomas && filtros.idiomas.length > 0) {
      queryParams.idiomas = filtros.idiomas.join(',');
    }

    if (filtros.experiencia) {
      queryParams.experiencia = filtros.experiencia;
    }

    if (this.ordenActual !== 'relevancia') {
      queryParams.sort = this.ordenActual;
    }

    if (filtros.pagina > 1) {
      queryParams.page = filtros.pagina;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
  }

  // === Paginación ===

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.irAPagina(this.paginaActual - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.irAPagina(this.paginaActual + 1);
    }
  }

  irAPagina(pagina: number): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.buscar(pagina);
  }

  // === Interacciones con tarjetas ===

  toggleContacto(portafolio: PortafolioExtendido): void {
    portafolio.mostrarContacto = !portafolio.mostrarContacto;
  }

  verPortafolio(portafolio: Portafolio): void {
    // Preservar estado actual en URL antes de navegar
    console.log('Ver portafolio:', portafolio);
    // TODO: Navegar a vista detallada
    alert(`Funcionalidad en desarrollo: Ver portafolio de ${portafolio.nombre} ${portafolio.apellido}`);
  }

  guardarPortafolio(portafolio: PortafolioExtendido): void {
    if (portafolio.estadoGuardado === 'saving') return;

    portafolio.estadoGuardado = 'saving';
    
    // Simular guardado (reemplazar con servicio real)
    setTimeout(() => {
      portafolio.estadoGuardado = portafolio.estadoGuardado === 'saved' ? 'idle' : 'saved';
      console.log('Portafolio guardado:', portafolio);
    }, 800);
  }

  invitarPostular(portafolio: Portafolio): void {
    // TODO: Abrir modal de invitación
    console.log('Invitar a postular:', portafolio);
    alert(`Funcionalidad en desarrollo: Invitar a ${portafolio.nombre} ${portafolio.apellido} a postular`);
  }

  descargarPerfil(portafolio: Portafolio, event: Event): void {
    event.stopPropagation();
    this.generarPDF(portafolio);
  }

  private async generarPDF(portafolio: Portafolio): Promise<void> {
    try {
      // Importación dinámica de jsPDF y autoTable
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // === HEADER - Datos Personales ===
      doc.setFillColor(25, 118, 210); // Azul #1976d2
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(`${portafolio.nombre} ${portafolio.apellido}`, pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(portafolio.carrera || 'Carrera no especificada', pageWidth / 2, 25, { align: 'center' });
      
      if (portafolio.ubicacion) {
        doc.setFontSize(10);
        doc.text(portafolio.ubicacion, pageWidth / 2, 32, { align: 'center' });
      }

      yPosition = 50;
      doc.setTextColor(0, 0, 0);

      // === INFORMACIÓN DE CONTACTO ===
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 118, 210);
      doc.text('Información de Contacto', 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (portafolio.email) {
        doc.text(`Email: ${portafolio.email}`, 14, yPosition);
        yPosition += 6;
      }
      
      if (portafolio.telefono) {
        doc.text(`Teléfono: ${portafolio.telefono}`, 14, yPosition);
        yPosition += 6;
      }

      yPosition += 5;

      // === DESCRIPCIÓN / PERFIL PROFESIONAL ===
      if (portafolio.descripcion) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 118, 210);
        doc.text('Perfil Profesional', 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const descripcionLines = doc.splitTextToSize(portafolio.descripcion, pageWidth - 28);
        doc.text(descripcionLines, 14, yPosition);
        yPosition += (descripcionLines.length * 5) + 5;
      }

      // === FORMACIÓN ACADÉMICA ===
      if (portafolio.carrera || portafolio.anioEstudio) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 118, 210);
        doc.text('Formación Académica', 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        if (portafolio.carrera) {
          doc.text(`Carrera: ${portafolio.carrera}`, 14, yPosition);
          yPosition += 6;
        }
        
        if (portafolio.anioEstudio) {
          doc.text(`Año de estudio: ${portafolio.anioEstudio}°`, 14, yPosition);
          yPosition += 6;
        }
        
        if (portafolio.promedio) {
          doc.text(`Promedio: ${portafolio.promedio.toFixed(2)}`, 14, yPosition);
          yPosition += 6;
        }

        yPosition += 5;
      }

      // === HABILIDADES TÉCNICAS ===
      if (portafolio.habilidades && portafolio.habilidades.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 118, 210);
        doc.text('Habilidades Técnicas', 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const habilidadesText = portafolio.habilidades.join(' • ');
        const habilidadesLines = doc.splitTextToSize(habilidadesText, pageWidth - 28);
        doc.text(habilidadesLines, 14, yPosition);
        yPosition += (habilidadesLines.length * 5) + 5;
      }

      // === IDIOMAS ===
      if (portafolio.idiomas && portafolio.idiomas.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 118, 210);
        doc.text('Idiomas', 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(portafolio.idiomas.join(' • '), 14, yPosition);
        yPosition += 10;
      }

      // === EXPERIENCIA LABORAL ===
      if (portafolio.experiencia) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 118, 210);
        doc.text('Experiencia', 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(portafolio.experiencia, 14, yPosition);
        yPosition += 10;
      }

      // === MODALIDAD DE TRABAJO ===
      if (portafolio.modalidad) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 118, 210);
        doc.text('Modalidad Preferida', 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const modalidadTexto = portafolio.modalidad.charAt(0).toUpperCase() + portafolio.modalidad.slice(1);
        doc.text(modalidadTexto, 14, yPosition);
        yPosition += 10;
      }

      // === FOOTER ===
      const fechaGeneracion = new Date().toLocaleDateString('es-PY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Documento generado el ${fechaGeneracion} desde VIASUC`, pageWidth / 2, 285, { align: 'center' });

      // === DESCARGAR PDF ===
      const nombreArchivo = `Portafolio_${portafolio.nombre}_${portafolio.apellido}.pdf`.replace(/\s+/g, '_');
      doc.save(nombreArchivo);
    } catch (error) {
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    }
  }

  enviarMensaje(portafolio: Portafolio): void {
    // TODO: Navegar a mensajería o abrir drawer
    console.log('Enviar mensaje:', portafolio);
    alert(`Funcionalidad en desarrollo: Enviar mensaje a ${portafolio.nombre} ${portafolio.apellido}`);
  }

  // === Helpers ===
  getTipoBadge(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'PORTAFOLIO': 'Portafolio',
      'ESTUDIANTE': 'Estudiante',
      'EGRESADO': 'Egresado',
      'PROFESOR': 'Docente',
      'INVESTIGADOR': 'Docente',
      'DOCENTE': 'Docente',
      'ADMINISTRADOR': 'Administrador',
      'ADMIN': 'Administrador',
      'EMPLEADOR': 'Empleador',
      'EMPRESA': 'Empleador'
    };
    return tipos[tipo] || (tipo ? tipo : 'Portafolio');
  }

  getTipoBadgeClass(tipo: string): string {
    const classes: { [key: string]: string } = {
      'PORTAFOLIO': 'badge-portafolio',
      'ESTUDIANTE': 'badge-estudiante',
      'EGRESADO': 'badge-egresado',
      'PROFESOR': 'badge-docente',
      'INVESTIGADOR': 'badge-docente',
      'DOCENTE': 'badge-docente',
      'ADMINISTRADOR': 'badge-admin',
      'ADMIN': 'badge-admin',
      'EMPLEADOR': 'badge-empleador',
      'EMPRESA': 'badge-empleador'
    };
    return classes[tipo] || 'badge-default';
  }

  // === WhatsApp ===

  getWhatsAppLink(telefono: string): string {
    if (!telefono) return '#';
    
    // Limpiar el teléfono de caracteres no numéricos
    const telefonoLimpio = telefono.replace(/\D/g, '');
    
    // Si el número no tiene código de país, asumir Paraguay (+595)
    let numeroCompleto = telefonoLimpio;
    if (!telefonoLimpio.startsWith('595') && !telefonoLimpio.startsWith('+')) {
      numeroCompleto = '595' + telefonoLimpio;
    }
    
    // Mensaje predeterminado
    const mensaje = encodeURIComponent('Hola! Te contacto desde VIASUC, estoy interesado en tu perfil.');
    
    // Retornar link de WhatsApp Web
    return `https://wa.me/${numeroCompleto}?text=${mensaje}`;
  }

  // === Navegación ===

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        this.router.navigate(['/login']);
      }
    });
  }

// ===============================
//   AVAL / ENDORSEMENT (UI toggle)
// ===============================
openAvalIds = new Set<number>();

/** Saca un id numérico válido del portafolio */
getPortafolioId(p: any): number {
  const id =
    p?.idUsuario ??
    p?.usuarioId ??
    p?.idUser ??
    p?.id ??
    p?.idPortafolio ??
    0;

  return Number(id) || 0;
}

getPortafolioNombreCompleto(p: any): string {
  return `${p?.nombre ?? ''} ${p?.apellido ?? ''}`.trim();
}

getPortafolioEmail(p: any): string | null {
  return p?.email ?? p?.correo ?? p?.mail ?? null;
}


toggleAval(p: any, ev?: Event) {
  // Seguridad UI: solo permitir toggle si el perfil es elegible
  if (!this.isAvalAllowed(p)) return;
  ev?.stopPropagation();
  const id = this.getPortafolioId(p);
  if (!id) return;

  if (this.openAvalIds.has(id)) this.openAvalIds.delete(id);
  else this.openAvalIds.add(id);
}

isAvalOpen(p: any): boolean {
  const id = this.getPortafolioId(p);
  return !!id && this.openAvalIds.has(id);
}

/** Determina si el portafolio/usuario es elegible para recibir un endorsement (UI) */
isAvalAllowed(p: any): boolean {
  if (!p) return false;

  // 1) Intentar a través del badge legible (método existente)
  try {
    const badge = this.getTipoBadge((p?.tipo || '').toString() || '').toString();
    if (['Estudiante', 'Egresado'].includes(badge)) return true;
  } catch {}

  // 2) Chequear varios campos posibles que el backend pueda devolver
  const candidates = [p?.tipo, p?.rol, p?.rolPrincipal, p?.tipoPerfil, p?.tipoPerfilPrincipal, p?.role]
    .filter(Boolean)
    .map((x: any) => String(x).toLowerCase());

  const allowedTokens = ['estudiante', 'alumno', 'egresado', 'profesor', 'investigador', 'docente'];
  for (const c of candidates) {
    if (allowedTokens.includes(c)) return true;
    // también permitir si contiene alguno de los tokens (por si vienen como 'ESTUDIANTE_PORTFOLIO')
    for (const t of allowedTokens) {
      if (c.includes(t)) return true;
    }
  }

  // 3) Si el objeto trae un arreglo roles
  if (Array.isArray(p?.roles)) {
    for (const r of p.roles) {
      const rr = String(r).toLowerCase();
      if (allowedTokens.includes(rr)) return true;
      for (const t of allowedTokens) if (rr.includes(t)) return true;
    }
  }

  return false;
}

hacerAval(portafolio: any, ev?: Event) {
  // Seguridad UI: prevenir acción si no está permitido
  if (!this.isAvalAllowed(portafolio)) return;
  ev?.stopPropagation();

  const toUserId = this.getPortafolioId(portafolio);
  const nombre = this.getPortafolioNombreCompleto(portafolio);
  const email = this.getPortafolioEmail(portafolio);

  if (!toUserId) {
    console.warn('No pude obtener toUserId del portafolio:', portafolio);
    return;
  }

  // backup por si algún guard / ruta no pasa params
  localStorage.setItem(
    'prefill_endorsement_to',
    JSON.stringify({ toUserId, nombre, email })
  );

  // navegación normal
  this.router.navigate(
    ['/dashboard/empleador/endorsements'],
    { queryParams: { toUserId, nombre, email } }
  );
}



}
