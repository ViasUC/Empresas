import { Component, EventEmitter, Output, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { RegistroData, DatosEmpresaRegistro } from '../../../core/models/auth.models';
import { map, debounceTime, switchMap, take, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatStepperModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  @Output() registroExitoso = new EventEmitter<RegistroData>();
  @Output() cancelar = new EventEmitter<void>();

  datosPersonalesForm: FormGroup;
  datosEmpresaForm: FormGroup;
  seguridadForm: FormGroup;
  
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  
  tipoUsuario: 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO' = 'EMPLEADOR';
  
  // Flujo dual: crear empresa o unirse a existente
  tipoRegistro: 'nueva' | 'existente' | null = null;
  empresasDisponibles: any[] = [];
  empresaSeleccionada: number | null = null;
  rolSeleccionado: string = 'GERENTE_RRHH';
  cargandoEmpresas = false;
  
  sectoresIndustria = [
    'Tecnología',
    'Finanzas',
    'Salud',
    'Educación',
    'Manufactura',
    'Retail',
    'Construcción',
    'Servicios',
    'Agricultura',
    'Transporte',
    'Energía',
    'Telecomunicaciones',
    'Otro'
  ];
  
  rolesDisponibles = [
    { valor: 'GERENTE_RRHH', nombre: 'Gerente de RRHH' },
    { valor: 'AUXILIAR_RRHH', nombre: 'Auxiliar de RRHH' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: { email?: string }
  ) {
    this.datosPersonalesForm = this.createDatosPersonalesForm();
    this.datosEmpresaForm = this.createDatosEmpresaForm();
    this.seguridadForm = this.createSeguridadForm();
  }

  ngOnInit(): void {
    // Pre-llenar el email si viene del login
    if (this.data && this.data.email) {
      this.datosPersonalesForm.patchValue({ email: this.data.email });
    }
    
    // Cargar lista de empresas disponibles
    this.cargarEmpresas();
  }
  
  cargarEmpresas(): void {
    this.cargandoEmpresas = true;
    this.authService.listarEmpresas().subscribe({
      next: (empresas) => {
        this.empresasDisponibles = empresas;
        this.cargandoEmpresas = false;
      },
      error: (err) => {
        console.error('Error al cargar empresas:', err);
        this.cargandoEmpresas = false;
      }
    });
  }
  
  seleccionarTipoRegistro(tipo: 'nueva' | 'existente'): void {
    this.tipoRegistro = tipo;
  }

  private createDatosPersonalesForm(): FormGroup {
    return this.fb.group({
      tipoUsuario: ['EMPLEADOR', Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', 
        [Validators.required, Validators.email],
        [this.emailDisponibleValidator()]  // Validador asíncrono
      ],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]]
    });
  }

  private createDatosEmpresaForm(): FormGroup {
    return this.fb.group({
      nombreEmpresa: ['', [Validators.required, Validators.minLength(3)]],
      ruc: ['', [Validators.required, this.rucValidator]],
      razonSocial: ['', [Validators.required, Validators.minLength(3)]],
      contacto: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      ubicacion: ['Asunción', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private createSeguridadForm(): FormGroup {
    return this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', Validators.required],
      aceptaTerminos: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Validador asíncrono para verificar si el email está disponible
   */
  private emailDisponibleValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return this.authService.verificarEmailDisponible(control.value).pipe(
        map(disponible => disponible ? null : { emailNoDisponible: true }),
        catchError(() => of(null)) // En caso de error, no bloquear el formulario
      );
    };
  }

  /**
   * Validador personalizado para RUC paraguayo
   */
  private rucValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const ruc = control.value.replace(/[^0-9]/g, '');
    
    // RUC paraguayo debe tener formato: 80000000-0 (8 dígitos + guión + dígito verificador)
    if (ruc.length < 8 || ruc.length > 9) {
      return { rucInvalido: true };
    }
    
    // Validación básica (puedes mejorarla con algoritmo completo)
    if (!/^[0-9]{8,9}$/.test(ruc)) {
      return { rucInvalido: true };
    }
    
    return null;
  }

  /**
   * Validador de fortaleza de contraseña
   */
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const password = control.value;
    const errors: any = {};
    
    // Debe tener al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
      errors.noMayuscula = true;
    }
    
    // Debe tener al menos una minúscula
    if (!/[a-z]/.test(password)) {
      errors.noMinuscula = true;
    }
    
    // Debe tener al menos un número
    if (!/[0-9]/.test(password)) {
      errors.noNumero = true;
    }
    
    // Debe tener al menos un carácter especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.noEspecial = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Validador para verificar que las contraseñas coincidan
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Cambia el tipo de usuario
   */
  onTipoUsuarioChange(tipo: 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO'): void {
    this.tipoUsuario = tipo;
    this.datosPersonalesForm.patchValue({ tipoUsuario: tipo });
    
    // Ajustar validaciones según el tipo
    if (tipo === 'EMPLEADOR') {
      this.datosEmpresaForm.enable();
    } else {
      this.datosEmpresaForm.disable();
    }
  }

  /**
   * Valida el paso actual
   */
  isStepValid(step: number): boolean {
    switch (step) {
      case 0:
        return this.datosPersonalesForm.valid;
      case 1:
        return this.tipoUsuario !== 'EMPLEADOR' || this.datosEmpresaForm.valid;
      case 2:
        return this.seguridadForm.valid;
      default:
        return false;
    }
  }

  /**
   * Envía el formulario de registro
   */
  onSubmit(): void {
    if (this.isLoading) return;
    
    // Validar todos los formularios
    if (!this.datosPersonalesForm.valid || !this.seguridadForm.valid) {
      this.markAllAsTouched();
      return;
    }
    
    // Si es empleador, validar según el tipo de registro
    if (this.tipoUsuario === 'EMPLEADOR') {
      if (this.tipoRegistro === 'nueva') {
        // Crear empresa nueva: validar formulario de empresa
        if (!this.datosEmpresaForm.valid) {
          this.markAllAsTouched();
          return;
        }
      } else if (this.tipoRegistro === 'existente') {
        // Unirse a empresa: validar que haya seleccionado empresa y rol
        if (!this.empresaSeleccionada || !this.rolSeleccionado) {
          alert('Por favor seleccione una empresa y un rol');
          return;
        }
      } else {
        // No ha seleccionado tipo de registro
        alert('Por favor seleccione si desea crear una empresa nueva o unirse a una existente');
        return;
      }
    }
    
    this.isLoading = true;
    
    const registroData: RegistroData = {
      tipoUsuario: this.tipoUsuario,
      ...this.datosPersonalesForm.value,
      password: this.seguridadForm.value.password,
      ubicacion: 'Asunción' // Por defecto, se puede agregar al formulario si es necesario
    };
    
    // Agregar datos de empresa según el tipo de registro
    if (this.tipoUsuario === 'EMPLEADOR') {
      if (this.tipoRegistro === 'nueva') {
        // Crear empresa nueva con rol Administrador
        registroData.datosEmpresa = {
          ...this.datosEmpresaForm.value,
          rolEnEmpresa: 'ADMINISTRADOR'
        };
      } else if (this.tipoRegistro === 'existente') {
        // Unirse a empresa existente con rol seleccionado
        const empresaSeleccionadaObj = this.empresasDisponibles.find(
          e => e.idEmpresa === this.empresaSeleccionada
        );
        
        registroData.datosEmpresa = {
          idEmpresa: this.empresaSeleccionada || undefined,
          nombreEmpresa: empresaSeleccionadaObj?.nombreEmpresa || '',
          ruc: empresaSeleccionadaObj?.ruc || '',
          razonSocial: empresaSeleccionadaObj?.razonSocial || '',
          rolEnEmpresa: this.rolSeleccionado,
          unirseAExistente: true // Flag para indicar que se une a existente
        };
      }
    }
    
    console.log('Datos de registro:', registroData);
    
    // Emitir evento de registro
    this.registroExitoso.emit(registroData);
  }

  /**
   * Cancela el registro
   */
  onCancelar(): void {
    this.cancelar.emit();
  }

  /**
   * Marca todos los formularios como tocados para mostrar errores
   */
  private markAllAsTouched(): void {
    this.datosPersonalesForm.markAllAsTouched();
    this.datosEmpresaForm.markAllAsTouched();
    this.seguridadForm.markAllAsTouched();
  }

  /**
   * Obtiene mensaje de error para un campo
   */
  getErrorMessage(formGroup: FormGroup, field: string): string {
    const control = formGroup.get(field);
    if (!control || !control.errors || !control.touched) return '';
    
    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control.hasError('email')) {
      return 'Email inválido';
    }
    if (control.hasError('emailNoDisponible')) {
      return 'Este correo electrónico ya está registrado';
    }
    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    if (control.hasError('pattern')) {
      return 'Formato inválido';
    }
    if (control.hasError('rucInvalido')) {
      return 'RUC inválido';
    }
    
    return '';
  }

  /**
   * Obtiene mensajes de error de contraseña
   */
  getPasswordErrors(): string[] {
    const control = this.seguridadForm.get('password');
    if (!control || !control.errors || !control.touched) return [];
    
    const errors: string[] = [];
    
    if (control.hasError('required')) {
      errors.push('La contraseña es requerida');
    }
    if (control.hasError('minlength')) {
      errors.push('Mínimo 8 caracteres');
    }
    if (control.hasError('noMayuscula')) {
      errors.push('Debe tener al menos una mayúscula');
    }
    if (control.hasError('noMinuscula')) {
      errors.push('Debe tener al menos una minúscula');
    }
    if (control.hasError('noNumero')) {
      errors.push('Debe tener al menos un número');
    }
    if (control.hasError('noEspecial')) {
      errors.push('Debe tener al menos un carácter especial');
    }
    
    return errors;
  }

  /**
   * Verifica si las contraseñas coinciden
   */
  passwordsMatch(): boolean {
    return !this.seguridadForm.hasError('passwordMismatch');
  }
}
