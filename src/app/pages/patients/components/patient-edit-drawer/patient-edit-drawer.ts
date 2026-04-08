import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-edit-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-edit-drawer.html',
  styleUrl: './patient-edit-drawer.scss'
})
export class PatientEditDrawerComponent {
  @Input() open = false;
  @Input() updating = false;
  @Input() form: any = {};

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  submitted = signal(false);

  readonly fullName = computed(() => {
    const nombres = (this.form?.nombres || '').trim();
    const paterno = (this.form?.apellido_paterno || '').trim();
    const materno = (this.form?.apellido_materno || '').trim();
    return [nombres, paterno, materno].filter(Boolean).join(' ');
  });

  get validationErrors(): string[] {
    const errors: string[] = [];

    const nombres = (this.form?.nombres || '').trim();
    const apellidoPaterno = (this.form?.apellido_paterno || '').trim();
    const email = (this.form?.email || '').trim();
    const telefono = (this.form?.telefono || '').trim();
    const edad = Number(this.form?.edad);
    const estatura = Number(this.form?.estatura_cm);

    if (!nombres) {
      errors.push('Faltan los nombre(s) del paciente.');
    }

    if (!apellidoPaterno) {
      errors.push('Falta el apellido paterno.');
    }

    if (this.fullName().length > 0 && this.fullName().length < 6) {
      errors.push('El nombre completo se ve incompleto o demasiado corto.');
    }

    if (this.form?.edad !== null && this.form?.edad !== undefined && this.form?.edad !== '') {
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
      this.form?.estatura_cm !== null &&
      this.form?.estatura_cm !== undefined &&
      this.form?.estatura_cm !== ''
    ) {
      if (Number.isNaN(estatura) || estatura < 50 || estatura > 260) {
        errors.push('La estatura debe estar entre 50 cm y 260 cm.');
      }
    }

    return errors;
  }

  get hasErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  fieldInvalid(field: 'nombres' | 'apellido_paterno' | 'email' | 'telefono' | 'edad' | 'estatura_cm'): boolean {
    if (!this.submitted()) return false;

    const value = this.form?.[field];

    switch (field) {
      case 'nombres':
        return !(value || '').trim();

      case 'apellido_paterno':
        return !(value || '').trim();

      case 'email':
        return !!(value || '').trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());

      case 'telefono': {
        const cleanPhone = String(value || '').replace(/\D/g, '');
        return !!String(value || '').trim() && cleanPhone.length < 10;
      }

      case 'edad': {
        if (value === '' || value === null || value === undefined) return false;
        const edad = Number(value);
        return Number.isNaN(edad) || edad < 1 || edad > 120;
      }

      case 'estatura_cm': {
        if (value === '' || value === null || value === undefined) return false;
        const estatura = Number(value);
        return Number.isNaN(estatura) || estatura < 50 || estatura > 260;
      }

      default:
        return false;
    }
  }

  onSave(): void {
    this.submitted.set(true);

    if (this.hasErrors || this.updating) {
      return;
    }

    this.save.emit();
  }

  onClose(): void {
    this.submitted.set(false);
    this.close.emit();
  }
}