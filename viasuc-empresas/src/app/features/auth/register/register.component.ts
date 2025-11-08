import { Component, EventEmitter, Output, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';

export interface RegistroData {
  tipoUsuario: 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO';
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  ubicacion?: string;
  datosEmpresa?: {
    nombreEmpresa: string;
    ruc: string;
    razonSocial: string;
    contacto: string;
    ubicacion: string;
    email: string;
    rolEnEmpresa: string;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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

  constructor(
    private fb: FormBuilder,
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
  }

  private createDatosPersonalesForm(): FormGroup {
    return this.fb.group({
      tipoUsuario: ['EMPLEADOR', Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
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
      email: ['', [Validators.required, Validators.email]],
      rolEnEmpresa: ['Administrador', [Validators.required]]
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
    
    // Si es empleador, validar datos de empresa
    if (this.tipoUsuario === 'EMPLEADOR' && !this.datosEmpresaForm.valid) {
      this.markAllAsTouched();
      return;
    }
    
    this.isLoading = true;
    
    const registroData: RegistroData = {
      tipoUsuario: this.tipoUsuario,
      ...this.datosPersonalesForm.value,
      password: this.seguridadForm.value.password,
      ubicacion: 'Asunción' // Por defecto, se puede agregar al formulario si es necesario
    };
    
    // Agregar datos de empresa si es empleador
    if (this.tipoUsuario === 'EMPLEADOR') {
      registroData.datosEmpresa = this.datosEmpresaForm.value;
    }
    
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
