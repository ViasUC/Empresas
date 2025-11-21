import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type Tab = 'recibidos' | 'enviados' | 'crear';

interface EndorsementUI {
  idEndorsement: number;
  fromUserId?: number;
  toUserId?: number;
  skill: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

@Component({
  selector: 'app-empresa-endorsements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empresa-endorsements.html',
  styleUrls: ['./empresa-endorsements.scss'],
})
export class EmpresaEndorsementsComponent {

  activeTab: Tab = 'recibidos';

  // Mock visual para ahora (después se reemplaza con backend)
  recibidos: EndorsementUI[] = [
    { idEndorsement: 19, fromUserId: 1024, skill: 'Mejor alumno INFO 3', message: 'Enhorabuena', status: 'PENDING' },
    { idEndorsement: 20, fromUserId: 1100, skill: 'Excelente liderazgo', message: 'Muy buen trabajo', status: 'ACCEPTED' },
  ];

  enviados: EndorsementUI[] = [
    { idEndorsement: 25, toUserId: 1000, skill: 'Gran compañero', message: 'Recomendado', status: 'PENDING' },
  ];

  // Formulario visual
  form = {
    toUserId: '',
    skill: '',
    message: '',
  };

  constructor(private router: Router) {}

  cambiarTab(tab: Tab) {
    this.activeTab = tab;
  }

  volverDashboard() {
    this.router.navigate(['/dashboard/empleador']);
  }

  // Por ahora no hace nada real
  enviarMock() {
    alert('Solo UI por ahora. Luego conectamos al backend.');
  }

  decidirMock(e: EndorsementUI, accept: boolean) {
    alert(`Solo UI. Decisión: ${accept ? 'Aceptar' : 'Rechazar'} endorsement ${e.idEndorsement}`);
  }
}
