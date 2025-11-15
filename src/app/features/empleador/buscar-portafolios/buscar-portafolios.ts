import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Inicializar formulario de filtros simplificado
    this.filtrosForm = this.fb.group({
      // Filtros principales
      carrera: [''],
      habilidades: [''],
      ubicacion: ['']
    });

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
    this.searchText = '';
    this.aplicarFiltros();
  }

  // === Métodos de filtros ===

  toggleFiltersPanel(): void {
    this.filtersPanelCollapsed = !this.filtersPanelCollapsed;
  }

  aplicarFiltros(): void {
    // Recalcular filtros activos para mostrar chips
    this.calcularFiltrosActivos();
    
    // Resetear a página 1 al aplicar filtros
    this.buscar(1);
  }

  calcularFiltrosActivos(): void {
    this.filtrosActivos = [];
    const formValue = this.filtrosForm.value;

    // Texto de búsqueda
    if (this.searchText.trim()) {
      this.filtrosActivos.push({
        key: 'searchText',
        label: `Búsqueda: "${this.searchText}"`,
        value: this.searchText
      });
    }

    // Carrera
    if (formValue.carrera) {
      this.filtrosActivos.push({
        key: 'carrera',
        label: `Carrera: ${formValue.carrera}`,
        value: formValue.carrera
      });
    }

    // Ubicación
    if (formValue.ubicacion) {
      this.filtrosActivos.push({
        key: 'ubicacion',
        label: `Ubicación: ${formValue.ubicacion}`,
        value: formValue.ubicacion
      });
    }

    // Habilidades
    if (formValue.habilidades) {
      this.filtrosActivos.push({
        key: 'habilidades',
        label: `Habilidades: ${formValue.habilidades}`,
        value: formValue.habilidades
      });
    }

    // Promedio mínimo
    if (formValue.promedioMin > 0) {
      this.filtrosActivos.push({
        key: 'promedioMin',
        label: `Promedio ≥ ${formValue.promedioMin}`,
        value: formValue.promedioMin
      });
    }

    // Salario
    if (formValue.salarioMin || formValue.salarioMax) {
      let label = 'Salario: ';
      if (formValue.salarioMin && formValue.salarioMax) {
        label += `$${formValue.salarioMin} - $${formValue.salarioMax}`;
      } else if (formValue.salarioMin) {
        label += `≥ $${formValue.salarioMin}`;
      } else {
        label += `≤ $${formValue.salarioMax}`;
      }
      this.filtrosActivos.push({
        key: 'salario',
        label: label,
        value: { min: formValue.salarioMin, max: formValue.salarioMax }
      });
    }

    // Rating mínimo
    if (formValue.ratingMin > 0) {
      this.filtrosActivos.push({
        key: 'ratingMin',
        label: `Rating ≥ ${formValue.ratingMin}`,
        value: formValue.ratingMin
      });
    }

    // Modalidad
    if (formValue.modalidad) {
      const option = this.modalidadesOptions.find(o => o.value === formValue.modalidad);
      this.filtrosActivos.push({
        key: 'modalidad',
        label: `Modalidad: ${option?.label || formValue.modalidad}`,
        value: formValue.modalidad
      });
    }

    // Año de estudio
    if (formValue.anioEstudio) {
      const option = this.aniosEstudioOptions.find(o => o.value === formValue.anioEstudio);
      this.filtrosActivos.push({
        key: 'anioEstudio',
        label: `Año: ${option?.label || formValue.anioEstudio}`,
        value: formValue.anioEstudio
      });
    }

    // Idiomas
    if (formValue.idiomas && formValue.idiomas.length > 0) {
      formValue.idiomas.forEach((idioma: string) => {
        const option = this.idiomasOptions.find(o => o.value === idioma);
        this.filtrosActivos.push({
          key: 'idiomas',
          label: `Idioma: ${option?.label || idioma}`,
          value: idioma
        });
      });
    }

    // Experiencia
    if (formValue.experiencia) {
      const option = this.experienciasOptions.find(o => o.value === formValue.experiencia);
      this.filtrosActivos.push({
        key: 'experiencia',
        label: `Experiencia: ${option?.label || formValue.experiencia}`,
        value: formValue.experiencia
      });
    }
  }

  removerFiltro(filtro: FiltroActivo): void {
    if (filtro.key === 'searchText') {
      this.searchText = '';
    } else {
      // Para el resto, resetear el campo individual
      this.filtrosForm.patchValue({ [filtro.key]: '' });
    }

    // Reaplicar filtros
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      carrera: '',
      habilidades: '',
      ubicacion: ''
    });
    this.searchText = '';
    this.aplicarFiltros();
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
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.cargando = false;
      }
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
    // TODO: Mostrar menú de opciones de descarga (PDF, Word, etc.)
    console.log('Descargar perfil:', portafolio);
    alert(`Funcionalidad en desarrollo: Descargar perfil de ${portafolio.nombre} ${portafolio.apellido}`);
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
      'EGRESADO': 'Egresado'
    };
    return tipos[tipo] || tipo;
  }

  getTipoBadgeClass(tipo: string): string {
    const classes: { [key: string]: string } = {
      'PORTAFOLIO': 'badge-portafolio',
      'ESTUDIANTE': 'badge-estudiante',
      'EGRESADO': 'badge-egresado'
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
}
