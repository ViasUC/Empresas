/**
 * FSM (Finite State Machine) para UC-EMP-004 - Buscar Portafolios Candidato
 * Estados y transiciones basados en el diagrama de secuencia
 */

export enum SearchPortfolioState {
  IDLE = 'idle',
  LOADING_FILTERS = 'loading_filters', 
  READY = 'ready',
  SEARCHING = 'searching',
  SUCCESS = 'success',
  ERROR_AUTH = 'error_auth',           // 401 - Token inválido
  ERROR_FORBIDDEN = 'error_forbidden', // 403 - Sin permisos
  ERROR_VALIDATION = 'error_validation', // 400 - Filtros inválidos
  ERROR_SERVER = 'error_server'        // 500 - Error interno
}

export enum SearchPortfolioEvent {
  INIT = 'init',
  FILTERS_LOADED = 'filters_loaded',
  FILTERS_FAILED = 'filters_failed',
  SEARCH_REQUESTED = 'search_requested',
  SEARCH_SUCCESS = 'search_success',
  AUTH_ERROR = 'auth_error',
  FORBIDDEN_ERROR = 'forbidden_error', 
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error',
  RETRY = 'retry',
  RESET = 'reset'
}

export interface SearchPortfolioContext {
  filters: SearchFilter[];
  searchCriteria: SearchCriteria | null;
  results: PortfolioResult[];
  totalResults: number;
  currentPage: number;
  error: string | null;
  isLoading: boolean;
  retryCount: number;
}

export interface SearchFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'range' | 'text';
  options?: FilterOption[];
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface SearchCriteria {
  carrera?: string[];
  skills?: string[];
  experiencia?: { min: number; max: number };
  ubicacion?: string;
  salario?: { min: number; max: number };
}

export interface PortfolioResult {
  id: string;
  candidatoId: string;
  nombre: string;
  carrera: string;
  skills: string[];
  experiencia: number;
  ubicacion: string;
  salarioEsperado: number;
  avatar: string;
  rating: number;
}

/**
 * Configuración de la máquina de estados
 */
export const searchPortfolioFSMConfig = {
  initial: SearchPortfolioState.IDLE,
  
  states: {
    [SearchPortfolioState.IDLE]: {
      on: {
        [SearchPortfolioEvent.INIT]: SearchPortfolioState.LOADING_FILTERS
      }
    },
    
    [SearchPortfolioState.LOADING_FILTERS]: {
      on: {
        [SearchPortfolioEvent.FILTERS_LOADED]: SearchPortfolioState.READY,
        [SearchPortfolioEvent.FILTERS_FAILED]: SearchPortfolioState.ERROR_SERVER
      }
    },
    
    [SearchPortfolioState.READY]: {
      on: {
        [SearchPortfolioEvent.SEARCH_REQUESTED]: SearchPortfolioState.SEARCHING
      }
    },
    
    [SearchPortfolioState.SEARCHING]: {
      on: {
        [SearchPortfolioEvent.SEARCH_SUCCESS]: SearchPortfolioState.SUCCESS,
        [SearchPortfolioEvent.AUTH_ERROR]: SearchPortfolioState.ERROR_AUTH,
        [SearchPortfolioEvent.FORBIDDEN_ERROR]: SearchPortfolioState.ERROR_FORBIDDEN,
        [SearchPortfolioEvent.VALIDATION_ERROR]: SearchPortfolioState.ERROR_VALIDATION,
        [SearchPortfolioEvent.SERVER_ERROR]: SearchPortfolioState.ERROR_SERVER
      }
    },
    
    [SearchPortfolioState.SUCCESS]: {
      on: {
        [SearchPortfolioEvent.SEARCH_REQUESTED]: SearchPortfolioState.SEARCHING,
        [SearchPortfolioEvent.RESET]: SearchPortfolioState.READY
      }
    },
    
    [SearchPortfolioState.ERROR_AUTH]: {
      on: {
        [SearchPortfolioEvent.RESET]: SearchPortfolioState.IDLE
      }
    },
    
    [SearchPortfolioState.ERROR_FORBIDDEN]: {
      on: {
        [SearchPortfolioEvent.RESET]: SearchPortfolioState.IDLE
      }
    },
    
    [SearchPortfolioState.ERROR_VALIDATION]: {
      on: {
        [SearchPortfolioEvent.RETRY]: SearchPortfolioState.READY,
        [SearchPortfolioEvent.RESET]: SearchPortfolioState.READY
      }
    },
    
    [SearchPortfolioState.ERROR_SERVER]: {
      on: {
        [SearchPortfolioEvent.RETRY]: SearchPortfolioState.LOADING_FILTERS,
        [SearchPortfolioEvent.RESET]: SearchPortfolioState.IDLE
      }
    }
  }
};