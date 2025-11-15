import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpleadorService } from '../services/empleador.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-administrar-perfil-empleador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './administrar-perfil-empleador.html',
  styleUrl: './administrar-perfil-empleador.scss'
})
export class AdministrarPerfilEmpleador implements OnInit {
  perfilForm!: FormGroup;
  guardando = false;
  cargando = true;
  idEmpresa: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private empleadorService: EmpleadorService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.perfilForm = this.fb.group({
      // Identidad de la empresa
      nombreEmpresa: ['', [Validators.required]],
      ruc: ['', [Validators.required]],
      razonSocial: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(2000)]],
      
      // Contacto y ubicacion
      email: ['', [Validators.required, Validators.email]],
      contacto: ['', [Validators.required]],
      ubicacion: ['', [Validators.required]]
    });

    // Cargar datos existentes
    this.cargarDatosEmpresa();
  }

  cargarDatosEmpresa(): void {
    this.cargando = true;
    this.empleadorService.obtenerMiEmpresa().subscribe({
      next: (empresa) => {
        if (empresa) {
          this.idEmpresa = empresa.id;
          console.log('Datos de empresa cargados:', empresa);
          
          // Llenar formulario con datos de la empresa
          this.perfilForm.patchValue({
            nombreEmpresa: empresa.nombreEmpresa || '',
            ruc: empresa.ruc || '',
            razonSocial: empresa.razonSocial || '',
            descripcion: empresa.descripcion || '',
            email: empresa.email || '',
            contacto: empresa.contacto || '',
            ubicacion: empresa.ubicacion || ''
          });
        } else {
          console.warn('No se encontro empresa asociada al usuario');
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar empresa:', error);
        alert('Error al cargar los datos de la empresa');
        this.cargando = false;
      }
    });
  }

  guardarPerfil(): void {
    if (this.perfilForm.valid) {
      this.guardando = true;
      
      const formValue = this.perfilForm.value;
      const input = {
        nombreEmpresa: formValue.nombreEmpresa,
        ruc: formValue.ruc,
        razonSocial: formValue.razonSocial,
        contacto: formValue.contacto,
        ubicacion: formValue.ubicacion,
        email: formValue.email,
        descripcion: formValue.descripcion
      };

      console.log('Guardando perfil:', input);

      this.empleadorService.actualizarEmpresa(input).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          this.guardando = false;
          
          if (response.actualizarEmpresa.success) {
            alert(response.actualizarEmpresa.message);
            // Recargar datos
            this.cargarDatosEmpresa();
          } else {
            alert('Error: ' + response.actualizarEmpresa.message);
          }
        },
        error: (error) => {
          console.error('Error al guardar:', error);
          this.guardando = false;
          alert('Error al guardar los datos. Verifique la consola para más detalles.');
        }
      });
    } else {
      this.marcarCamposComoTocados();
      alert('Por favor complete todos los campos requeridos');
    }
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.perfilForm.controls).forEach(key => {
      this.perfilForm.get(key)?.markAsTouched();
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard/empleador']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesion:', error);
        // Aunque haya error, redirigir al login
        this.router.navigate(['/login']);
      }
    });
  }
}
