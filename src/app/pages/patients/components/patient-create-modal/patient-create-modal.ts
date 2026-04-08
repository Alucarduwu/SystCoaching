import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-create-modal.html',
  styleUrl: './patient-create-modal.scss'
})
export class PatientCreateModalComponent {
  @Input() open = false;
  @Input() saving = false;
  @Input() patientForm: any = {};
  @Input() measurementForm: any = {};

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() fieldChange = new EventEmitter<void>();

  submitted = signal(false);

  readonly fullName = computed(() => {
    const nombres = (this.patientForm?.nombres || '').trim();
    const paterno = (this.patientForm?.apellido_paterno || '').trim();
    const materno = (this.patientForm?.apellido_materno || '').trim();
    return [nombres, paterno, materno].filter(Boolean).join(' ');
  });

  get validationErrors(): string[] {
    const errors: string[] = [];

    const nombres = (this.patientForm?.nombres || '').trim();
    const apellidoPaterno = (this.patientForm?.apellido_paterno || '').trim();
    const email = (this.patientForm?.email || '').trim();
    const telefono = (this.patientForm?.telefono || '').trim();
    const edad = Number(this.patientForm?.edad);
    const estatura = Number(this.patientForm?.estatura_cm);
    const fecha = (this.measurementForm?.fecha || '').trim();
    const peso = Number(this.measurementForm?.peso_kg);
    

    if (!nombres) {
      errors.push('Faltan los nombre(s) del paciente.');
    }

    if (!apellidoPaterno) {
      errors.push('Falta el apellido paterno.');
    }

    if (this.fullName().length > 0 && this.fullName().length < 6) {
      errors.push('El nombre completo se ve incompleto o demasiado corto.');
    }

    if (this.patientForm?.edad !== '' && this.patientForm?.edad !== null && this.patientForm?.edad !== undefined) {
      if (Number.isNaN(edad) || edad < 1 || edad > 120) {
        errors.push('La edad debe estar entre 1 y 120 años.');
      }
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('El correo no tiene un formato válido.');
    }

    if (telefono) {
      const cleanPhone = telefono.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.push('El teléfono debe tener al menos 10 dígitos.');
      }
    }

    if (
      this.patientForm?.estatura_cm !== '' &&
      this.patientForm?.estatura_cm !== null &&
      this.patientForm?.estatura_cm !== undefined
    ) {
      if (Number.isNaN(estatura) || estatura < 50 || estatura > 260) {
        errors.push('La estatura debe estar entre 50 cm y 260 cm.');
      }
    }

    const measurementHasData =
      !!fecha ||
      !!this.measurementForm?.peso_kg ||
      !!this.measurementForm?.imc ||
      !!this.measurementForm?.masa_magra ||
      !!this.measurementForm?.masa_muscular ||
      !!this.measurementForm?.cuello ||
      !!this.measurementForm?.pierna_derecha ||
      !!this.measurementForm?.pierna_izquierda ||
      !!this.measurementForm?.pantorrilla_derecha ||
      !!this.measurementForm?.pantorrilla_izquierda ||
      !!this.measurementForm?.cintura ||
      !!this.measurementForm?.brazo_derecho ||
      !!this.measurementForm?.brazo_izquierdo ||
      !!this.measurementForm?.cadera ||
      !!this.measurementForm?.pecho_espalda ||
      !!this.measurementForm?.fuerza ||
      !!this.measurementForm?.fuerza_brazo_derecho ||
      !!this.measurementForm?.fuerza_brazo_izquierdo ||
      !!(this.measurementForm?.notas || '').trim();
      

    if (measurementHasData && !fecha) {
      errors.push('Si capturas una medición inicial, debes indicar la fecha.');
    }

    if (
      this.measurementForm?.peso_kg !== '' &&
      this.measurementForm?.peso_kg !== null &&
      this.measurementForm?.peso_kg !== undefined
    ) {
      if (Number.isNaN(peso) || peso <= 0 || peso > 500) {
        errors.push('El peso inicial no es válido.');
      }
    }

    return errors;
  }

  get hasErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  fieldInvalid(field: string, source: 'patient' | 'measurement' = 'patient'): boolean {
    if (!this.submitted()) return false;

    const formSource = source === 'patient' ? this.patientForm : this.measurementForm;
    const value = formSource?.[field];

    switch (`${source}.${field}`) {
      case 'patient.nombres':
        return !(value || '').trim();

      case 'patient.apellido_paterno':
        return !(value || '').trim();

      case 'patient.email':
        return !!(value || '').trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());

      case 'patient.telefono': {
        const cleanPhone = String(value || '').replace(/\D/g, '');
        return !!String(value || '').trim() && cleanPhone.length < 10;
      }

      case 'patient.edad': {
        if (value === '' || value === null || value === undefined) return false;
        const edad = Number(value);
        return Number.isNaN(edad) || edad < 1 || edad > 120;
      }

      case 'patient.estatura_cm': {
        if (value === '' || value === null || value === undefined) return false;
        const estatura = Number(value);
        return Number.isNaN(estatura) || estatura < 50 || estatura > 260;
      }

      case 'measurement.fecha': {
        const measurementHasData =
          !!this.measurementForm?.peso_kg ||
          !!this.measurementForm?.imc ||
          !!this.measurementForm?.masa_magra ||
          !!this.measurementForm?.masa_muscular ||
          !!this.measurementForm?.cuello ||
          !!this.measurementForm?.pierna_derecha ||
          !!this.measurementForm?.pierna_izquierda ||
          !!this.measurementForm?.pantorrilla_derecha ||
          !!this.measurementForm?.pantorrilla_izquierda ||
          !!this.measurementForm?.cintura ||
          !!this.measurementForm?.brazo_derecho ||
          !!this.measurementForm?.brazo_izquierdo ||
          !!this.measurementForm?.cadera ||
          !!this.measurementForm?.pecho_espalda ||
          !!this.measurementForm?.fuerza ||
          !!this.measurementForm?.fuerza_brazo_derecho ||
          !!this.measurementForm?.fuerza_brazo_izquierdo ||
          !!(this.measurementForm?.notas || '').trim();
        return measurementHasData && !(value || '').trim();
      }

      case 'measurement.peso_kg': {
        if (value === '' || value === null || value === undefined) return false;
        const peso = Number(value);
        return Number.isNaN(peso) || peso <= 0 || peso > 500;
      }

      default:
        return false;
    }
  }

  onSave(): void {
    this.submitted.set(true);

    if (this.hasErrors || this.saving) {
      return;
    }

    this.save.emit();
  }

  onClose(): void {
    this.submitted.set(false);
    this.close.emit();
  }
}