import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OpportunityService } from '../services/opportunity.service';
import {
  Opportunity,
  OpportunityState,
  OPPORTUNITY_STATES,
} from '../../../core/models/opportunity.model';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './opportunity-list.component.html',
  styleUrls: ['./opportunity-list.component.scss'],
})
export class OpportunityListComponent implements OnInit {
  opportunities: Opportunity[] = [];
  filtered: Opportunity[] = [];

  filtroTexto = '';
  filtroEstado: OpportunityState | '' = '';
  estados = OPPORTUNITY_STATES;

  constructor(
    private service: OpportunityService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.service.listMine().subscribe({
      next: (list) => {
        this.opportunities = list;
        this.aplicarFiltros();
      },
      error: (err) => console.error('Error cargando oportunidades', err),
    });
  }

  aplicarFiltros(): void {
    const texto = this.filtroTexto.toLowerCase();
    this.filtered = this.opportunities.filter((o: Opportunity) => {
      const matchTexto =
        !texto ||
        o.titulo.toLowerCase().includes(texto) ||
        o.descripcion.toLowerCase().includes(texto);
      const matchEstado =
        !this.filtroEstado || o.estado === this.filtroEstado;
      return matchTexto && matchEstado;
    });
  }

  nueva(): void {
    this.router.navigate(['oportunidades', 'nueva']);
  }

  editar(opp: Opportunity): void {
    const id = opp.id || opp.idOportunidad;
    this.router.navigate(['oportunidades', id, 'editar']);
  }

  // ===== Métodos de cambio de estado =====

  publish(opp: Opportunity): void {
    if (opp.estado === 'ACTIVA') return;
    const id = opp.id || opp.idOportunidad;
    if (!id) {
      console.error('ID de oportunidad no disponible');
      return;
    }
    this.service.changeState(id, 'ACTIVA').subscribe({
      next: () => this.load(),
      error: (err: any) => console.error('Error al publicar', err),
    });
  }

  publicar(opp: Opportunity): void {
    this.publish(opp);
  }

  pause(opp: Opportunity): void {
    const id = opp.id || opp.idOportunidad;
    if (!id) {
      console.error('ID de oportunidad no disponible');
      return;
    }
    this.service.changeState(id, 'PAUSADA').subscribe({
      next: () => this.load(),
      error: (err: any) => console.error('Error al pausar', err),
    });
  }

  pausar(opp: Opportunity): void {
    this.pause(opp);
  }

  reanudar(opp: Opportunity): void {
    if (opp.estado === 'PAUSADA') {
      const id = opp.id || opp.idOportunidad;
      if (!id) {
        console.error('ID de oportunidad no disponible');
        return;
      }
      this.service.changeState(id, 'ACTIVA').subscribe({
        next: () => this.load(),
        error: (err: any) => console.error('Error al reanudar', err),
      });
    }
  }

  close(opp: Opportunity): void {
    const id = opp.id || opp.idOportunidad;
    if (!id) {
      console.error('ID de oportunidad no disponible');
      return;
    }
    this.service.changeState(id, 'CERRADA').subscribe({
      next: () => this.load(),
      error: (err: any) => console.error('Error al cerrar', err),
    });
  }

  cerrar(opp: Opportunity): void {
    if (['ACTIVA', 'PAUSADA'].includes(opp.estado)) {
      this.close(opp);
    }
  }

  delete(opp: Opportunity): void {
    if (!confirm('¿Eliminar definitivamente esta oportunidad?')) return;
    const id = opp.id || opp.idOportunidad;
    if (!id) {
      console.error('ID de oportunidad no disponible');
      return;
    }
    this.service.delete(id).subscribe({
      next: () => this.load(),
      error: (err: any) => console.error('Error al eliminar', err),
    });
  }

  borrar(opp: Opportunity): void {
    if (opp.estado === 'BORRADOR') {
      this.delete(opp);
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/empleador']);
  }
}