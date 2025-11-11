import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService, LoginCredentials } from '../../../core/services/auth.service';
import { RegisterComponent, RegistroData } from '../register/register.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  selectedRol = 'empresas'; // Default a empresas según mockup
  isLoading = false;
  errorMessage = '';
  showUserNotFoundMessage = false;
  userNotFoundEmail = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const credentials: LoginCredentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        tipoUsuario: this.mapRolToTipo(this.selectedRol)
      };

      this.authService.login(credentials).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.snackBar.open(
            `Bienvenido ${user.nombre} ${user.apellido}`, 
            'Cerrar', 
            { duration: 3000 }
          );
          
          // Redirigir según el tipo de usuario
          this.redirectAfterLogin(user.tipo);
        },
        error: (error) => {
          this.isLoading = false;
          
          // Detectar si el usuario no existe (404 o USER_NOT_FOUND)
          const isUserNotFound = this.isUserNotFoundError(error);
          
          if (isUserNotFound) {
            this.userNotFoundEmail = this.loginForm.value.email;
            this.showUserNotFoundMessage = true;
            this.errorMessage = 'Usuario no encontrado';
          } else {
            this.errorMessage = this.getLoginErrorMessage(error);
            this.snackBar.open(this.errorMessage, 'Cerrar', { 
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
          
          console.error('Error en login:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onRolChange(event: any) {
    this.selectedRol = event.tab.textLabel.toLowerCase();
    console.log('Rol seleccionado:', this.selectedRol);
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Mapea el rol seleccionado a tipo de usuario
   */
  private mapRolToTipo(rol: string): 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO' | 'ADMIN' {
    const roleMap: { [key: string]: 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO' | 'ADMIN' } = {
      'empresas': 'EMPLEADOR',
      'estudiantes': 'ESTUDIANTE',
      'egresados': 'EGRESADO',
      'admin': 'ADMIN'
    };
    return roleMap[rol] || 'EMPLEADOR';
  }

  /**
   * Redirige al usuario según su tipo después del login
   */
  private redirectAfterLogin(tipoUsuario: string): void {
    switch (tipoUsuario) {
      case 'EMPLEADOR':
        this.router.navigate(['/dashboard/empleador']);
        break;
      case 'ESTUDIANTE':
        this.router.navigate(['/dashboard/estudiante']);
        break;
      case 'EGRESADO':
        this.router.navigate(['/dashboard/egresado']);
        break;
      case 'ADMIN':
        this.router.navigate(['/dashboard/admin']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Obtiene mensaje de error amigable para el login
   */
  private getLoginErrorMessage(error: any): string {
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphQLError = error.graphQLErrors[0];
      switch (graphQLError.extensions?.code) {
        case 'INVALID_CREDENTIALS':
          return 'Correo o contraseña incorrectos';
        case 'USER_NOT_FOUND':
          return 'Usuario no encontrado';
        case 'ACCOUNT_DISABLED':
          return 'La cuenta está deshabilitada';
        case 'ACCOUNT_NOT_VERIFIED':
          return 'Debe verificar su cuenta antes de iniciar sesión';
        default:
          return graphQLError.message || 'Error al iniciar sesión';
      }
    }
    if (error.networkError) {
      return 'Error de conexión. Verifique su conexión a internet';
    }
    return 'Error al iniciar sesión. Por favor intente nuevamente';
  }

  /**
   * Verifica si el error es de usuario no encontrado
   */
  private isUserNotFoundError(error: any): boolean {
    // Verificar por código de error GraphQL
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphQLError = error.graphQLErrors[0];
      return graphQLError.extensions?.code === 'USER_NOT_FOUND';
    }
    
    // Verificar por código HTTP 404
    if (error.networkError && error.networkError.status === 404) {
      return true;
    }
    
    return false;
  }

  /**
   * Abre el diálogo de registro con el email pre-llenado
   */
  openRegisterDialog(): void {
    const dialogRef = this.dialog.open(RegisterComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { email: this.userNotFoundEmail }
    });

    // Escuchar cuando se cierra el diálogo
    dialogRef.componentInstance.registroExitoso.subscribe((data: RegistroData) => {
      // Registrar al usuario
      this.handleRegistro(data);
      dialogRef.close();
    });

    dialogRef.componentInstance.cancelar.subscribe(() => {
      dialogRef.close();
      this.resetUserNotFoundState();
    });

    dialogRef.afterClosed().subscribe(() => {
      this.resetUserNotFoundState();
    });
  }

  /**
   * Maneja el registro de un nuevo usuario
   */
  private handleRegistro(data: RegistroData): void {
    this.isLoading = true;
    
    this.authService.register(data).subscribe({
      next: (user) => {
        this.isLoading = false;
        
        this.snackBar.open(
          '¡Cuenta creada exitosamente! Bienvenido ' + user.nombre, 
          'Cerrar', 
          { 
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
        
        // Redirigir al dashboard según el tipo de usuario
        this.redirectAfterLogin(user.tipo);
        
        this.resetUserNotFoundState();
      },
      error: (error) => {
        this.isLoading = false;
        
        let errorMessage = 'No se pudo crear la cuenta. Por favor, contacte con el administrador del sistema.';
        let duracion = 7000;
        
        // Detectar errores específicos
        if (error.graphQLErrors && error.graphQLErrors.length > 0) {
          const gqlError = error.graphQLErrors[0];
          
          if (gqlError.extensions?.code === 'EMAIL_ALREADY_EXISTS') {
            errorMessage = gqlError.message || 'Este correo electrónico ya está registrado. Por favor, utilice otro correo o inicie sesión si ya tiene una cuenta.';
            duracion = 8000; // Más tiempo para leer el mensaje
          } else if (gqlError.extensions?.code === 'DATABASE_ERROR') {
            errorMessage = 'No se pudo crear la cuenta debido a un error en el sistema. Por favor, contacte con el administrador.';
          } else if (gqlError.message) {
            // Usar el mensaje del backend tal cual viene
            errorMessage = gqlError.message;
          }
        } else if (error.networkError) {
          errorMessage = 'Error de conexión con el servidor. Por favor, verifique su conexión a internet e intente nuevamente.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.snackBar.open(errorMessage, 'Cerrar', { 
          duration: duracion,
          panelClass: ['error-snackbar']
        });
        
        console.error('Error en registro:', error);
        
        // Log detallado para debugging
        if (error.graphQLErrors) {
          console.error('GraphQL Errors:', error.graphQLErrors);
        }
        if (error.networkError) {
          console.error('Network Error:', error.networkError);
        }
      }
    });
  }

  /**
   * Resetea el estado de usuario no encontrado
   */
  private resetUserNotFoundState(): void {
    this.showUserNotFoundMessage = false;
    this.userNotFoundEmail = '';
  }

  /**
   * Vuelve al formulario de login desde el mensaje de error
   */
  backToLogin(): void {
    this.resetUserNotFoundState();
    this.errorMessage = '';
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.hasError('required')) {
      return `${field === 'email' ? 'Correo electrónico' : 'Contraseña'} es requerido`;
    }
    if (control?.hasError('email')) {
      return 'Ingrese un correo electrónico válido';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }
}