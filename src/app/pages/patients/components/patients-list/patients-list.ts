import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PatientCardComponent } from '../patients-card/patients-card';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PatientCardComponent],
  templateUrl: './patients-list.html',
  styleUrls: ['./patients-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientListComponent {
  @Input() loading = false;
  @Input() hasPatients = false;
  @Input() search = '';
  @Input() objectiveFilter = 'all';

  @Output() searchChange = new EventEmitter<string>();
  @Output() objectiveFilterChange = new EventEmitter<string>();
  @Output() createPatient = new EventEmitter<void>();
  @Output() viewPatient = new EventEmitter<number>();
  @Output() deletePatient = new EventEmitter<number>();

  metaObjectives = [
    { value: 'all', label: 'TODAS LAS METAS' },
    { value: 'Subir de peso', label: 'SUBIR DE PESO' },
    { value: 'Bajar de peso', label: 'BAJAR DE PESO' },
    { value: 'Salud', label: 'SALUD / MANTENIMIENTO' },
    { value: 'Fuerza', label: 'FUERZA' },
    { value: 'Entrenamiento hipertrofia', label: 'HIPERTROFIA' },
    { value: 'Definición', label: 'DEFINICIÓN' }
  ];

  stats = {
    totalActivos: 0,
    nuevosMes: 0,
    conObjetivo: 0,
    metaCumplida: 0
  };

  private _patients: any[] = [];
  @Input() set patients(value: any[]) {
    this._patients = value || [];
    this.calculateStats();
  }
  get patients(): any[] { return this._patients; }

  private calculateStats() {
    if (!this._patients || this._patients.length === 0) {
      this.stats = { totalActivos: 0, nuevosMes: 0, conObjetivo: 0, metaCumplida: 0 };
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let nuevos = 0;
    let conObj = 0;

    for (const p of this._patients) {
      if (p.created_at) {
        const d = new Date(p.created_at);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          nuevos++;
        }
      }
      if (p.objetivo && p.objetivo.trim() !== '') {
        conObj++;
      }
    }

    this.stats = {
      totalActivos: this._patients.length,
      nuevosMes: nuevos,
      conObjetivo: conObj,
      metaCumplida: Math.round((conObj / this._patients.length) * 100)
    };
  }
}