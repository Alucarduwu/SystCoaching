import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-patient-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patients-card.html',
  styleUrls: ['./patients-card.scss']
})
export class PatientCardComponent {
  @Input() patient!: any;
  @Output() view = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

  getInitials(patient: any): string {
    const n = (patient.nombres || '').charAt(0);
    const a = (patient.apellido_paterno || '').charAt(0);
    return (n + a).toUpperCase() || 'P';
  }

  getBrandColor(): string {
    const colors = ['#FF3131', '#00E5FF', '#7000FF', '#FF00C7', '#00FF94'];
    const idx = (this.patient.id || 0) % colors.length;
    return colors[idx];
  }

  stopPropagation(e: Event) {
    e.stopPropagation();
  }

  onDelete(e: Event) {
    e.stopPropagation();
    if (confirm('¿ELIMINAR ESTE EXPEDIENTE?')) {
      this.delete.emit(this.patient.id);
    }
  }
}