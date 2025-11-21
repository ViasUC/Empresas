import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MODALIDADES, TIPOS, Opportunity, OpportunityInput, OpportunityState } from '../../../core/models/opportunity.model';
import { OpportunityService } from '../services/opportunity.service';

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './opportunity-form.component.html',
  styleUrls: ['./opportunity-form.component.scss'],
})
export class OpportunityFormComponent implements OnInit {
  form!: FormGroup;
  modalidades = MODALIDADES;
  tipos = TIPOS;

  isEdit = false;
  opportunityId?: number;
  editing = false;
  currentOpportunity?: Opportunity;
  isEditable = true; // Solo es editable si está en BORRADOR

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private opportunityService: OpportunityService,
  ) {}

  ngOnInit(): void {
    this.buildForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.editing = true;
      this.opportunityId = +idParam;

      this.opportunityService
        .getById(this.opportunityId)
        .subscribe((opp: Opportunity | undefined) => {
          if (opp) {
            this.currentOpportunity = opp;
            
            // Editable según estado:
            // - 'cerrado': NO editable (solo lectura)
            // - Otros estados: SÍ editable
            this.isEditable = opp.estado !== 'cerrado';
            
            // Si está cerrado, deshabilitar formulario completamente
            if (!this.isEditable) {
              this.form.disable();
            }
            
            this.form.patchValue({
              titulo: opp.titulo,
              descripcion: opp.descripcion,
              requisitos: opp.requisitos,
              ubicacion: opp.ubicacion,
              modalidad: opp.modalidad,
              tipo: opp.tipo,
              fechaCierre: opp.fechaCierre ? opp.fechaCierre.substring(0, 10) : null,
              etiquetas: opp.etiquetas?.join(', '),
            });
          }
        });
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', Validators.required],
      requisitos: [''],
      ubicacion: ['', Validators.required],
      modalidad: ['', Validators.required],
      tipo: ['', Validators.required],
      fechaCierre: ['', Validators.required],
      etiquetas: [''],
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const etiquetasArray = this.form.value.etiquetas
      ? this.form.value.etiquetas.split(',').map((e: string) => e.trim()).filter((e: string) => e)
      : [];

    const payload: OpportunityInput = {
      titulo: this.form.value.titulo,
      descripcion: this.form.value.descripcion,
      requisitos: this.form.value.requisitos || '',
      ubicacion: this.form.value.ubicacion,
      modalidad: this.form.value.modalidad,
      tipo: this.form.value.tipo,
      fechaCierre: this.form.value.fechaCierre || null,
      etiquetas: etiquetasArray
    };

    const request$ = this.isEdit && this.opportunityId
      ? this.opportunityService.update(this.opportunityId, payload)
      : this.opportunityService.create(payload);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/oportunidades']);
      },
      error: (err) => {
        console.error('Error guardando oportunidad:', err);
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/oportunidades']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/empleador']);
  }

  /**
   * Obtiene la etiqueta legible del estado para mostrar en UI
   */
  getEstadoLabel(estado: OpportunityState): string {
    const labels: Record<OpportunityState, string> = {
      'borrador': 'Borrador',
      'activo': 'Activa',
      'pausada': 'Pausada',
      'cerrado': 'Cerrada'
    };
    return labels[estado] || estado;
  }
}
