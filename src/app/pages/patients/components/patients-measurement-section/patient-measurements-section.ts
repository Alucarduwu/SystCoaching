import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MeasurementCardComponent } from '../measurement-card/measurement-card';

export interface MeasurementPhoto {
  id: number;
  measurement_id: number;
  fecha?: string | null;
  image_url: string;
  nota?: string | null;
  created_at?: string;
}

export interface PatientMeasurement {
  id: number;
  fecha?: string | null;
  created_at?: string;

  peso_kg?: number | null;
  grasa_corporal?: number | null;
  imc?: number | null;
  masa_magra?: number | null;
  masa_muscular?: number | null;

  fuerza?: number | null;

  cuello?: number | null;
  pierna_derecha?: number | null;
  pierna_izquierda?: number | null;
  cintura?: number | null;
  brazo_derecho?: number | null;
  brazo_izquierdo?: number | null;
  cadera?: number | null;
  pecho_espalda?: number | null;

  notas?: string | null;
  fotos?: MeasurementPhoto[];
}

@Component({
  selector: 'app-patient-measurements-section',
  standalone: true,
  imports: [CommonModule, FormsModule, MeasurementCardComponent],
  templateUrl: './patient-measurements-section.html',
  styleUrls: ['./patient-measurements-section.scss']
})
export class PatientMeasurementsSectionComponent implements OnInit {
  @Input() measurements: PatientMeasurement[] = [];
  @Input() search = '';
  @Input() expandedMeasurements: Record<number, boolean> = {};
  @Input() hideHeader = false;
  viewMode: 'cards' | 'list' = 'cards';

  @Output() searchChange = new EventEmitter<string>();
  @Output() newMeasurement = new EventEmitter<void>();
  @Output() toggleExpand = new EventEmitter<number>();
  @Output() triggerPhotoInput = new EventEmitter<number>();
  @Output() uploadPhotos = new EventEmitter<{ measurement: PatientMeasurement; event: Event }>();
  @Output() openPhotoPreview = new EventEmitter<MeasurementPhoto>();
  @Output() deletePhoto = new EventEmitter<number>();
@Output() deleteMeasurement = new EventEmitter<number>();
@Output() editMeasurement = new EventEmitter<any>();
  @Output() downloadPdf = new EventEmitter<any>();
  @Output() toggleSelect = new EventEmitter<number>();

  ngOnInit() {
    const savedMode = localStorage.getItem('measurementsViewMode');
    if (savedMode === 'cards' || savedMode === 'list') {
      this.viewMode = savedMode;
    }
  }

  setViewMode(mode: 'cards' | 'list') {
    this.viewMode = mode;
    localStorage.setItem('measurementsViewMode', mode);
  }

  private selectedIds = new Set<number>();

  onToggleSelect(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  isMeasurementSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  selectedMeasurements(): PatientMeasurement[] {
    return this.measurements.filter(m => this.selectedIds.has(m.id));
  }

  filteredMeasurements(): PatientMeasurement[] {
    const term = this.search.trim().toLowerCase();

    if (!term) return this.measurements;

    return this.measurements.filter((measurement) => {
      const date = String(measurement.fecha || measurement.created_at || '').toLowerCase();
      return date.includes(term);
    });
  }

  sortedMeasurements(): PatientMeasurement[] {
    // Orden descendente (más recientes primero) para la lista principal
    return [...this.measurements].sort((a, b) => {
      const dateA = new Date(a.fecha || a.created_at || 0).getTime();
      const dateB = new Date(b.fecha || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }

  isExpanded(measurementId: number): boolean {
    return !!this.expandedMeasurements[measurementId];
  }

  formatDateMinimal(date?: string | null): string {
    if (!date) return '—';
    try {
      const d = new Date(date.includes(' ') ? date.replace(' ', 'T') : date);
      if (isNaN(d.getTime())) {
          // Fallback manual if new Date fails on some SQLite formats
          const parts = date.split(' ')[0].split('-');
          return `${parts[2]} ${this.getMonthName(parseInt(parts[1]) - 1)}`;
      }
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase();
    } catch { return String(date); }
  }

  private getMonthName(m: number): string {
      const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      return months[m] || '';
  }

  formatMeasurementDate(date?: string | null): string {
    if (!date) return 'Sin fecha';

    // Parsear fecha intentando evitar desplazamientos UTC
    let year, month, day;
    
    if (date.includes('T') || date.includes(' ')) {
      // Formato ISO o SQLite Datetime (2026-03-24 19:35:44)
      const datePart = date.split(/[T ]/)[0];
      const parts = datePart.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      // Formato YYYY-MM-DD
      const parts = date.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }

    const parsed = new Date(year, month, day);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  

  onUploadPhotos(measurement: PatientMeasurement, payload: any) {
    this.uploadPhotos.emit({
      measurement,
      event: payload?.event ?? payload
    });
  }


onDeleteMeasurement(measurementId: number): void {
  this.deleteMeasurement.emit(measurementId);
}

  onEditMeasurement(measurement: any): void {
    this.editMeasurement.emit(measurement);
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }
}