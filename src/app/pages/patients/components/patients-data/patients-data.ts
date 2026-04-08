import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface PatientData {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  edad?: number | null;
  email?: string | null;
  telefono?: string | null;
  sexo?: string | null;
  estatura_cm?: number | null;
  objetivo?: string | null;
  padecimientos?: string | null;
  alergias?: string | null;
  medicamentos?: string | null;
  ocupacion?: string | null;
  actividad_fisica?: string | null;
  notas?: string | null;
  created_at?: string;
  antropometria?: {
    peso_actual_kg?: number;
    bf_porcentaje?: number;
    masa_magra_kg?: number;
  } | null;
}

@Component({
  selector: 'app-patients-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patients-data.html',
  styleUrls: ['./patients-data.scss']
})
export class PatientsDataComponent {
  @Input() patient: PatientData | null = null;
  @Input() measurementsCount = 0;
  @Input() dietsCount = 0;
  @Input() routinesCount = 0;

  @Output() edit = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  getInitials(): string {
    if (!this.patient) return 'P';
    const n = (this.patient.nombres || '').charAt(0);
    const a = (this.patient.apellido_paterno || '').charAt(0);
    return (n + a).toUpperCase() || 'P';
  }

  fullName(): string {
    if (!this.patient) return '';
    return `${this.patient.nombres} ${this.patient.apellido_paterno}`.trim();
  }
}