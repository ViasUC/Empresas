import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
import { RegisterComponent } from '../register/register.component';
import { RegistroData } from '../../../core/models/auth.models';
import { UsuarioEmpresaService, RolEmpresa } from '../../../core/services/usuario-empresa.service';
import { Apollo, gql } from 'apollo-angular';
import * as THREE from 'three';

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
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('threeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  loginForm: FormGroup;
  hidePassword = true;
  selectedRol = 'empresas'; // Default a empresas según mockup
  isLoading = false;
  errorMessage = '';
  showUserNotFoundMessage = false;
  userNotFoundEmail = '';

  // Three.js properties
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private animationId: number = 0;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private apollo: Apollo,
    private usuarioEmpresaService: UsuarioEmpresaService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Initialize Three.js scene after view is ready with small delay
    setTimeout(() => {
      this.initThreeJS();
      this.animate();
    }, 100);
  }

  ngOnDestroy(): void {
    // Clean up Three.js resources
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS(): void {
    if (!this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 50;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      alpha: true,
      antialias: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Create particles
    this.createParticles();

    // Add lighting - ambiente científico mejorado
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Luz direccional principal
    const directionalLight = new THREE.DirectionalLight(0x3b82f6, 1);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);

    // Luz puntual cyan (científica) - más intensa
    const pointLight1 = new THREE.PointLight(0x00ffff, 1.5, 120);
    pointLight1.position.set(-30, 25, 15);
    this.scene.add(pointLight1);

    // Luz puntual magenta (científica) - más intensa
    const pointLight2 = new THREE.PointLight(0xff00ff, 1.5, 120);
    pointLight2.position.set(30, -25, 15);
    this.scene.add(pointLight2);

    // Luz puntual verde (tecnológica)
    const pointLight3 = new THREE.PointLight(0x00ff88, 1.2, 100);
    pointLight3.position.set(0, 0, 35);
    this.scene.add(pointLight3);

    // Luz puntual amarilla (energía)
    const pointLight4 = new THREE.PointLight(0xffaa00, 1, 90);
    pointLight4.position.set(-25, -20, 20);
    this.scene.add(pointLight4);

    // Luz puntual azul brillante (tecnología)
    const pointLight5 = new THREE.PointLight(0x0088ff, 1.3, 100);
    pointLight5.position.set(25, 20, 20);
    this.scene.add(pointLight5);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private createParticles(): void {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 3000; // Más partículas
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    const sizesArray = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Position - distribución más amplia
      posArray[i] = (Math.random() - 0.5) * 200;
      posArray[i + 1] = (Math.random() - 0.5) * 200;
      posArray[i + 2] = (Math.random() - 0.5) * 200;
      
      // Colors - gradiente científico variado (azul, cyan, púrpura, verde)
      const color = new THREE.Color();
      const hue = Math.random();
      if (hue < 0.3) {
        color.setHSL(0.55 + Math.random() * 0.1, 1, 0.6); // Cyan-Azul
      } else if (hue < 0.6) {
        color.setHSL(0.8 + Math.random() * 0.1, 1, 0.6); // Púrpura-Magenta
      } else {
        color.setHSL(0.3 + Math.random() * 0.1, 1, 0.6); // Verde-Amarillo
      }
      colorsArray[i] = color.r;
      colorsArray[i + 1] = color.g;
      colorsArray[i + 2] = color.b;
      
      // Tamaños variados
      sizesArray[i / 3] = Math.random() * 0.8 + 0.2;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizesArray, 1));

    // Create material with gradient colors
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);

    // Add scientific shapes
    this.addScientificShapes();
  }

  private addScientificShapes(): void {
    const shapes: THREE.Mesh[] = [];

    // 1. Átomo / Molécula - Órbitas electrónicas (más brillante)
    const atomCore = new THREE.SphereGeometry(2.5, 32, 32);
    const atomMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ccff,
      transparent: true,
      opacity: 0.9,
      shininess: 100
    });
    const atom = new THREE.Mesh(atomCore, atomMaterial);
    atom.position.set(-25, 15, -10);
    this.scene.add(atom);
    shapes.push(atom);

    // Órbitas del átomo
    for (let i = 0; i < 3; i++) {
      const orbitGeometry = new THREE.TorusGeometry(5 + i * 3, 0.2, 16, 100);
      const orbitMaterial = new THREE.MeshPhongMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.4,
        wireframe: true
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.position.copy(atom.position);
      orbit.rotation.x = Math.random() * Math.PI;
      orbit.rotation.y = Math.random() * Math.PI;
      this.scene.add(orbit);
      shapes.push(orbit);
    }

    // 2. DNA Helix - Doble hélice
    const helixPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 4;
      const x = Math.cos(angle) * 3;
      const y = i * 0.5 - 12;
      const z = Math.sin(angle) * 3;
      helixPoints.push(new THREE.Vector3(x, y, z));
    }
    const helixGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(helixPoints),
      50,
      0.3,
      8,
      false
    );
    const helixMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.6
    });
    const helix = new THREE.Mesh(helixGeometry, helixMaterial);
    helix.position.set(25, 0, -15);
    this.scene.add(helix);
    shapes.push(helix);

    // 3. Red Neuronal - Nodos conectados
    const nodeGroup = new THREE.Group();
    const nodePositions: THREE.Vector3[] = [];
    
    for (let i = 0; i < 8; i++) {
      const nodeSphere = new THREE.SphereGeometry(0.8, 16, 16);
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff88,
        emissive: 0x00aa44,
        transparent: true,
        opacity: 0.8
      });
      const node = new THREE.Mesh(nodeSphere, nodeMaterial);
      const angle = (i / 8) * Math.PI * 2;
      const radius = 8;
      node.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.5,
        (Math.random() - 0.5) * 5
      );
      nodePositions.push(node.position.clone());
      nodeGroup.add(node);
    }

    // Conexiones entre nodos
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (Math.random() > 0.6) {
          const points = [nodePositions[i], nodePositions[j]];
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          nodeGroup.add(line);
        }
      }
    }
    
    nodeGroup.position.set(0, 20, -20);
    this.scene.add(nodeGroup);
    shapes.push(nodeGroup as any);

    // 4. Dodecahedro - Geometría sagrada
    const dodecaGeometry = new THREE.DodecahedronGeometry(6, 0);
    const dodecaMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6b6b,
      transparent: true,
      opacity: 0.4,
      wireframe: true
    });
    const dodeca = new THREE.Mesh(dodecaGeometry, dodecaMaterial);
    dodeca.position.set(-15, -10, -5);
    this.scene.add(dodeca);
    shapes.push(dodeca);

    // 5. Esfera geodésica - Tecnología
    const geoSphere = new THREE.IcosahedronGeometry(7, 1);
    const geoMaterial = new THREE.MeshPhongMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    const geodesic = new THREE.Mesh(geoSphere, geoMaterial);
    geodesic.position.set(20, -8, -10);
    this.scene.add(geodesic);
    shapes.push(geodesic);

    // 6. Toroide - Física cuántica
    const torusKnotGeometry = new THREE.TorusKnotGeometry(5, 1.5, 100, 16);
    const torusKnotMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ddff,
      emissive: 0x0088cc,
      transparent: true,
      opacity: 0.6,
      wireframe: true
    });
    const torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
    torusKnot.position.set(-30, -15, -20);
    this.scene.add(torusKnot);
    shapes.push(torusKnot);

    // 7. Octaedro - Cristalografía
    const octaGeometry = new THREE.OctahedronGeometry(6, 0);
    const octaMaterial = new THREE.MeshPhongMaterial({
      color: 0xffcc00,
      emissive: 0xff8800,
      transparent: true,
      opacity: 0.7,
      wireframe: false,
      shininess: 100
    });
    const octahedron = new THREE.Mesh(octaGeometry, octaMaterial);
    octahedron.position.set(15, 20, -15);
    this.scene.add(octahedron);
    shapes.push(octahedron);

    // 8. Tetraedro - Geometría molecular
    const tetraGeometry = new THREE.TetrahedronGeometry(5, 0);
    const tetraMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0088,
      emissive: 0xcc0066,
      transparent: true,
      opacity: 0.6,
      wireframe: true
    });
    const tetrahedron = new THREE.Mesh(tetraGeometry, tetraMaterial);
    tetrahedron.position.set(-10, -18, -8);
    this.scene.add(tetrahedron);
    shapes.push(tetrahedron);

    // 9. Esfera con anillos - Planeta/Átomo
    const sphereRings = new THREE.Group();
    const centerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(3, 32, 32),
      new THREE.MeshPhongMaterial({
        color: 0x8800ff,
        emissive: 0x5500aa,
        transparent: true,
        opacity: 0.8,
        shininess: 100
      })
    );
    sphereRings.add(centerSphere);

    // Anillos alrededor
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(5 + i * 2, 0.3, 16, 100),
        new THREE.MeshPhongMaterial({
          color: 0x00ffaa,
          emissive: 0x00aa77,
          transparent: true,
          opacity: 0.5,
          wireframe: true
        })
      );
      ring.rotation.x = Math.PI / 2 + (i * Math.PI / 6);
      sphereRings.add(ring);
    }
    sphereRings.position.set(30, 5, -25);
    this.scene.add(sphereRings);
    shapes.push(sphereRings as any);

    // 10. Cilindro rotatorio - Nanotubos
    const cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 15, 32);
    const cylinderMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00aa00,
      transparent: true,
      opacity: 0.6,
      wireframe: true
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(-20, 5, -25);
    cylinder.rotation.z = Math.PI / 4;
    this.scene.add(cylinder);
    shapes.push(cylinder);

    // 11. Pirámide - Arquitectura
    const pyramidGeometry = new THREE.ConeGeometry(5, 10, 4);
    const pyramidMaterial = new THREE.MeshPhongMaterial({
      color: 0xffaa00,
      emissive: 0xdd8800,
      transparent: true,
      opacity: 0.7,
      wireframe: false,
      flatShading: true
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.position.set(10, -15, -12);
    this.scene.add(pyramid);
    shapes.push(pyramid);

    // 12. Torus doble - Física de partículas
    const doubleTorus = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(6, 1.5, 16, 100),
        new THREE.MeshPhongMaterial({
          color: i === 0 ? 0xff00ff : 0x00ffff,
          emissive: i === 0 ? 0xaa00aa : 0x00aaaa,
          transparent: true,
          opacity: 0.5,
          wireframe: true
        })
      );
      torus.rotation.x = i * Math.PI / 3;
      torus.rotation.y = i * Math.PI / 4;
      doubleTorus.add(torus);
    }
    doubleTorus.position.set(0, -5, -30);
    this.scene.add(doubleTorus);
    shapes.push(doubleTorus as any);

    // 13. Cubos interconectados - Red de datos
    const cubeGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL(i / 5, 1, 0.6),
          emissive: new THREE.Color().setHSL(i / 5, 1, 0.3),
          transparent: true,
          opacity: 0.6,
          wireframe: true
        })
      );
      const angle = (i / 5) * Math.PI * 2;
      cube.position.set(Math.cos(angle) * 10, Math.sin(angle) * 10, 0);
      cubeGroup.add(cube);
    }
    cubeGroup.position.set(-35, 0, -15);
    this.scene.add(cubeGroup);
    shapes.push(cubeGroup as any);

    // 14. Espiral - DNA/Fibonacci
    const spiralPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 6;
      const radius = 2 + i * 0.08;
      const x = Math.cos(angle) * radius;
      const y = i * 0.3 - 12;
      const z = Math.sin(angle) * radius;
      spiralPoints.push(new THREE.Vector3(x, y, z));
    }
    const spiralGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(spiralPoints),
      80,
      0.3,
      8,
      false
    );
    const spiralMaterial = new THREE.MeshPhongMaterial({
      color: 0xff3366,
      emissive: 0xcc1144,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });
    const spiral = new THREE.Mesh(spiralGeometry, spiralMaterial);
    spiral.position.set(35, 0, -10);
    this.scene.add(spiral);
    shapes.push(spiral);

    // Store for animation
    (this.scene as any).scientificShapes = shapes;
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    // Rotate particles con movimiento fluido
    if (this.particles) {
      this.particles.rotation.x += 0.0003;
      this.particles.rotation.y += 0.0007;
      
      // Movimiento ondulatorio en las partículas
      const positions = this.particles.geometry.attributes['position'].array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        positions[i + 1] += Math.sin(time + x * 0.05) * 0.02;
      }
      this.particles.geometry.attributes['position'].needsUpdate = true;
    }

    // Animar formas científicas
    const shapes = (this.scene as any).scientificShapes;
    
    if (shapes && Array.isArray(shapes)) {
      shapes.forEach((shape: THREE.Object3D, index: number) => {
        // Rotaciones diferentes para cada forma
        shape.rotation.x += 0.003 * (index % 2 === 0 ? 1 : -1);
        shape.rotation.y += 0.005 * (index % 3 === 0 ? 1 : -1);
        shape.rotation.z += 0.002 * (index % 2 === 0 ? -1 : 1);
        
        // Movimiento flotante sutil
        shape.position.y += Math.sin(time * 0.5 + index) * 0.01;
      });
    }

    // Rotar la cámara lentamente alrededor de la escena
    this.camera.position.x = Math.sin(time * 0.1) * 5;
    this.camera.position.y = Math.cos(time * 0.15) * 5;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    if (!this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const credentials: LoginCredentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        tipoUsuario: 'EMPLEADOR'
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
          
          // Extraer mensaje de error
          let errorMsg = this.getLoginErrorMessage(error);
          
          // PRIMERO: Detectar si es pendiente de aprobación (ANTES de user not found)
          const isPendienteAprobacion = errorMsg.includes('PENDIENTE_APROBACION') || 
                                        errorMsg.includes('pendiente de aprobación');
          
          if (isPendienteAprobacion) {
            // Usuario pendiente de aprobación - mensaje combinado que aparece arriba
            const mensaje = errorMsg.replace('PENDIENTE_APROBACION:', '').trim() || 
                           'Tu acceso está pendiente de aprobación por el administrador de la empresa.';
            
            this.errorMessage = mensaje;
            
            // Mensaje único con ambas líneas de información
            this.snackBar.open(
              'Tu acceso está pendiente de aprobación por el administrador de la empresa.\n\n' +
              'Recibirás un correo de confirmación cuando tu cuenta sea activada.', 
              'Entendido', 
              { 
                duration: 12000,
                panelClass: ['warning-snackbar'],
                horizontalPosition: 'center',
                verticalPosition: 'top'
              }
            );
          } else {
            // SEGUNDO: Detectar si el usuario no existe (solo si NO es pendiente)
            const isUserNotFound = this.isUserNotFoundError(error);
            
            if (isUserNotFound) {
              this.userNotFoundEmail = this.loginForm.value.email;
              this.showUserNotFoundMessage = true;
              this.errorMessage = 'Usuario no encontrado';
            } else {
              this.errorMessage = errorMsg;
              
              // Duración más larga para mensajes importantes como EMAIL_NOT_VERIFIED
              const duracion = error.graphQLErrors?.[0]?.extensions?.code === 'EMAIL_NOT_VERIFIED' ? 10000 : 7000;
              
              this.snackBar.open(this.errorMessage, 'Cerrar', { 
                duration: duracion,
                panelClass: ['error-snackbar']
              });
            }
          }
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onRolChange(event: any) {
    this.selectedRol = event.tab.textLabel.toLowerCase();
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
  private mapRolToTipo(rol: string): 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO' | 'DOCENTE' | 'ADMIN' {
    const roleMap: { [key: string]: 'EMPLEADOR' | 'ESTUDIANTE' | 'EGRESADO' | 'DOCENTE' | 'ADMIN' } = {
      'empresas': 'EMPLEADOR',
      'estudiante': 'ESTUDIANTE',
      'egresado': 'EGRESADO',
      'docente': 'DOCENTE',
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
        // Para empleadores, cargar empresa y rol antes de redirigir
        this.cargarEmpresaYRol();
        break;
      case 'ESTUDIANTE':
        this.router.navigate(['/dashboard/estudiante']);
        break;
      case 'EGRESADO':
        this.router.navigate(['/dashboard/egresado']);
        break;
      case 'DOCENTE':
        this.router.navigate(['/dashboard/docente']);
        break;
      case 'ADMIN':
        this.router.navigate(['/dashboard/admin']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Carga la empresa y el rol del usuario empleador
   */
  private cargarEmpresaYRol(): void {
    const usuario = this.authService.getCurrentUser();
    if (!usuario || !usuario.id) {
      console.error('No se pudo obtener usuario actual');
      this.snackBar.open('Sesión iniciada sin datos de empresa', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/dashboard/empleador']);
      return;
    }

    // Mostrar mensaje mientras carga
    this.snackBar.open('Cargando datos de empresa...', '', { duration: 2000 });

    const QUERY_MI_EMPRESA = gql`
      query MiEmpresa($idUsuario: ID!) {
        miEmpresa(idUsuario: $idUsuario) {
          idEmpresa
          nombreEmpresa
          ruc
          razonSocial
          contacto
          ubicacion
          email
          descripcion
        }
      }
    `;

    // Timeout de 5 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    const queryPromise = this.apollo.query<any>({
      query: QUERY_MI_EMPRESA,
      variables: { idUsuario: usuario.id.toString() },
      fetchPolicy: 'network-only'
    }).toPromise();

    Promise.race([queryPromise, timeoutPromise]).then((result: any) => {
      const empresa = result.data?.miEmpresa;
      if (empresa) {
        const idEmpresa = empresa.idEmpresa;
        
        // Obtener el rol del usuario en esta empresa
        this.usuarioEmpresaService.obtenerRolUsuario(idEmpresa, usuario.id.toString())
          .subscribe({
            next: (rol: any) => {
              // Guardar empresa con rol en localStorage
              const empresaConRol = {
                ...empresa,
                id: idEmpresa,
                rolEnEmpresa: rol
              };
              localStorage.setItem('empresa', JSON.stringify(empresaConRol));
              this.snackBar.open('Sesión iniciada correctamente', 'Cerrar', { duration: 2000 });
              
              // Ahora sí redirigir
              this.router.navigate(['/dashboard/empleador']);
            },
            error: (err: any) => {
              console.error('Error al obtener rol:', err);
              // Guardar empresa sin rol
              localStorage.setItem('empresa', JSON.stringify({ ...empresa, id: idEmpresa }));
              this.snackBar.open('Empresa cargada sin rol', 'Cerrar', { duration: 2000 });
              this.router.navigate(['/dashboard/empleador']);
            }
          });
      } else {
        console.warn('No se encontró empresa para el usuario');
        this.snackBar.open('No se encontró empresa asociada', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/dashboard/empleador']);
      }
    }).catch((err) => {
      console.error('Error al cargar empresa:', err);
      if (err.message === 'Timeout') {
        this.snackBar.open('Timeout al cargar empresa. Redirigiendo...', 'Cerrar', { duration: 3000 });
      } else {
        this.snackBar.open('Error al cargar datos. Continuando...', 'Cerrar', { duration: 3000 });
      }
      // SIEMPRE redirigir, incluso si falla
      this.router.navigate(['/dashboard/empleador']);
    });
  }

  /**
   * Obtiene mensaje de error amigable para el login
   * PRIORIDAD: Siempre usar el mensaje del backend si está disponible
   */
  private getLoginErrorMessage(error: any): string {
    // PRIMERO: Verificar si el error tiene mensaje directo (cuando viene de auth.service.ts)
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }
    
    // SEGUNDO: Intentar obtener el mensaje de GraphQL errors array
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphQLError = error.graphQLErrors[0];
      
      // Si el backend envió un mensaje, USARLO directamente
      if (graphQLError.message) {
        return graphQLError.message;
      }
      
      // Solo si NO hay mensaje, usar fallbacks por código
      const code = graphQLError.extensions?.code;
      switch (code) {
        case 'INVALID_CREDENTIALS':
          return 'Correo o contraseña incorrectos';
        case 'USER_NOT_FOUND':
          return 'Usuario no encontrado';
        case 'EMAIL_NOT_VERIFIED':
          return 'Debe verificar su correo electrónico antes de iniciar sesión';
        case 'INVALID_USER_TYPE':
          return 'Este usuario no tiene permisos para acceder como el tipo seleccionado';
        case 'ACCOUNT_DISABLED':
          return 'La cuenta está deshabilitada';
        default:
          return 'Error al iniciar sesión. Por favor intente nuevamente';
      }
    }
    
    // Error de red
    if (error.networkError) {
      return 'Error de conexión con el servidor. Por favor, verifique su conexión a internet';
    }
    
    // Error genérico
    return 'Error al iniciar sesión. Por favor intente nuevamente';
  }

  /**
   * Verifica si el error es de usuario no encontrado
   */
  private isUserNotFoundError(error: any): boolean {
    // Verificar por código de error GraphQL
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphQLError = error.graphQLErrors[0];
      
      // Verificar código
      if (graphQLError.extensions?.code === 'USER_NOT_FOUND') {
        return true;
      }
      
      // Verificar mensaje
      const message = graphQLError.message?.toLowerCase() || '';
      if (message.includes('usuario no encontrado') || 
          message.includes('user not found') ||
          message.includes('no encontrado') ||
          message.includes('not found')) {
        return true;
      }
    }
    
    // Verificar por código HTTP 404
    if (error.networkError && error.networkError.status === 404) {
      return true;
    }
    
    // Verificar mensaje de error general
    const errorMessage = error.message?.toLowerCase() || '';
    if (errorMessage.includes('usuario no encontrado') || 
        errorMessage.includes('user not found')) {
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
    
    // Verificar si es colaborador uniéndose a empresa existente
    const esColaborador = data.tipoUsuario === 'EMPLEADOR' && 
                         data.datosEmpresa?.unirseAExistente === true;
    
    console.log('HandleRegistro:', { 
      tipoUsuario: data.tipoUsuario, 
      esColaborador, 
      datosEmpresa: data.datosEmpresa 
    });
    
    this.authService.register(data).subscribe({
      next: (user) => {
        this.isLoading = false;
        
        if (esColaborador) {
          // COLABORADOR: No iniciar sesión automáticamente - mensaje combinado arriba
          this.snackBar.open(
            'Tu acceso está pendiente de aprobación por el administrador de la empresa.\n\n Recibirás un correo de confirmación cuando tu cuenta sea activada.', 
            'Entendido', 
            {
              duration: 12000,
              panelClass: ['warning-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          );
          
          // NO redirigir, mantener en login
          this.resetUserNotFoundState();
          
        } else {
          // EMPRESA NUEVA o OTRO TIPO DE USUARIO: Iniciar sesión automáticamente
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
        }
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