import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PatientListComponent } from './components/patients-list/patients-list';
import { PatientsDataComponent } from './components/patients-data/patients-data';
import { PatientMeasurementsSectionComponent } from './components/patients-measurement-section/patient-measurements-section';
import { PatientCreateModalComponent } from './components/patient-create-modal/patient-create-modal';
import { PatientEditDrawerComponent } from './components/patient-edit-drawer/patient-edit-drawer';
import { DietCardComponent } from './components/diet-card/diet-card';
import { RoutineCardComponent } from './components/routine-card/routine-card';
import { MeasurementCreateModalComponent } from './components/measurement-card/measurement-create-models/measurement-create-modal';
import { PatientProgressComparisonComponent } from './components/app-patient-progress-comparison/app-patient-progress-comparison';
import { DietAssignmentModalComponent } from './components/diet-assignment-modal/diet-assignment-modal';
import { RoutineAssignmentModalComponent } from './components/routine-assignment-modal/routine-assignment-modal';
import { MegaPdfModalComponent } from './components/mega-pdf-modal/mega-pdf-modal';

export interface Patient {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  edad?: number | null;
  email?: string | null;
  telefono?: string | null;
  sexo?: string | null;
  estatura_cm?: number | null;
  peso_actual?: number | null;
  objetivo?: string | null;
  padecimientos?: string | null;
  alergias?: string | null;
  medicamentos?: string | null;
  ocupacion?: string | null;
  actividad_fisica?: string | null;
  notas?: string | null;
  has_diet?: boolean;
  has_routine?: boolean;
  created_at?: string;
}

export interface MeasurementPhoto {
  id: number;
  measurement_id: number;
  fecha?: string | null;
  image_url: string;
  nota?: string | null;
  created_at?: string;
}

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [
  CommonModule,
  FormsModule,
  PatientListComponent,
  PatientsDataComponent,
  PatientMeasurementsSectionComponent,
  PatientCreateModalComponent,
  PatientEditDrawerComponent,
  DietCardComponent,
  RoutineCardComponent,
  MeasurementCreateModalComponent,
  PatientProgressComparisonComponent,
    DietAssignmentModalComponent,
    RoutineAssignmentModalComponent,
    MegaPdfModalComponent
  ],
  templateUrl: './patients-component.html',
  styleUrls: ['./patients-component.scss']
})
export class PatientsComponent implements OnInit {
  @ViewChild(PatientProgressComparisonComponent) comparisonComponent!: PatientProgressComparisonComponent;

  loading = signal(false);
  saving = signal(false);
  savingMeasurement = signal(false);
  uploadingPhotos = signal(false);
  showCreateModal = signal(false);
  showMeasurementModal = signal(false);
  showDietModal = signal(false);
  showRoutineModal = signal(false);
  showMegaPdfModal = signal(false);
  editingPatient = signal(false);
  updatingPatient = signal(false);
  editingMeasurement = signal(false);
  errorMessage = signal('');
  activeTab = signal<string>('overview');
  measurementsSubTab = signal<'history' | 'comparisons'>('history');

  previewPhoto = signal<MeasurementPhoto | null>(null);
  expandedMeasurements = signal<Record<number, boolean>>({});

  patients = signal<Patient[]>([]);
  selectedProfile = signal<any | null>(null);

  dietToEdit = signal<any>(null);
  routineToEdit = signal<any>(null);

  patientSearch = signal('');
  objectiveFilter = signal('all');
  dietSearch = signal('');
  measurementSearch = signal('');
  routineSearch = signal('');
  reportFilter = signal<'all' | 'diet' | 'routine' | 'measurement' | 'pdf'>('all');

  allDocuments = computed(() => {
    const profile = this.selectedProfile();
    if (!profile) return [];

    const documents: any[] = [];

    // 1. Diets
    if (profile.diets && profile.diets.length > 0) {
      profile.diets.forEach((diet: any) => {
        documents.push({
          id: `diet-${diet.id}`,
          type: 'NutriciÃ³n',
          category: 'diet',
          date: diet.fecha || diet.created_at,
          title: diet.nombre || 'Plan de AlimentaciÃ³n',
          original: diet
        });
      });
    }

    // 2. Routines
    if (profile.routines && profile.routines.length > 0) {
      profile.routines.forEach((routine: any) => {
        documents.push({
          id: `routine-${routine.id}`,
          type: 'Entrenamiento',
          category: 'routine',
          date: routine.fecha || routine.created_at,
          title: routine.nombre || 'Rutina de Entrenamiento',
          original: routine
        });
      });
    }

    // 4. Generated Documents (Vault)
    if (profile.generated_documents && profile.generated_documents.length > 0) {
      profile.generated_documents.forEach((doc: any) => {
        documents.push({
          id: `doc-${doc.id}`,
          type: 'BÃ³veda PDF',
          category: 'pdf',
          date: doc.created_at,
          title: doc.nombre || 'Reporte Generado',
          path: doc.file_path,
          original: doc
        });
      });
    }

    return documents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  filteredDocuments = computed(() => {
    const docs = this.allDocuments();
    const filter = this.reportFilter();
    if (filter === 'all') return docs;
    return docs.filter(doc => doc.category === filter);
  });

  comparativeDocuments = computed(() => {
    const profile = this.selectedProfile();
    if (!profile?.generated_documents) return [];
    return profile.generated_documents
      .filter((doc: any) => ['pdf_progress', 'mega_report'].includes(doc.tipo) || doc.nombre?.includes('COMPARATIVA') || doc.nombre?.includes('REPORTE_'))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

  latestDiet = computed(() => {
    return this.selectedProfile()?.diets?.sort((a: any, b: any) => 
      new Date(b.created_at || b.fecha).getTime() - new Date(a.created_at || a.fecha).getTime()
    )[0] || null;
  });

  latestRoutine = computed(() => {
    return this.selectedProfile()?.routines?.sort((a: any, b: any) => 
      new Date(b.created_at || b.fecha).getTime() - new Date(a.created_at || a.fecha).getTime()
    )[0] || null;
  });

  newPatient: any = this.getEmptyPatient();
  newMeasurement: any = this.getEmptyMeasurement();
  newFollowupMeasurement: any = this.getEmptyMeasurement();
  editPatientForm: any = {};

  latestStats = computed(() => {
    const profile = this.selectedProfile();
    const measurements = profile?.measurements || [];
    if (measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => {
      const dateA = new Date(a.fecha || a.created_at).getTime();
      const dateB = new Date(b.fecha || b.created_at).getTime();
      return dateB - dateA;
    });

    const latest = sorted[0];
    const previous = sorted[1] || null;

    const calcBodyFatValue = (m: any) => {
      if (m.grasa_corporal) return Number(m.grasa_corporal);
      if (m.peso_kg && m.masa_magra && m.peso_kg > 0) {
        return ((m.peso_kg - m.masa_magra) / m.peso_kg) * 100;
      }
      return null;
    };

    const latestFat = (latest.grasa_corporal && Number(latest.grasa_corporal) > 0) ? Number(latest.grasa_corporal) : calcBodyFatValue(latest);
    const prevFat = previous ? ((previous.grasa_corporal && Number(previous.grasa_corporal) > 0) ? Number(previous.grasa_corporal) : calcBodyFatValue(previous)) : null;
    const diffFat = (latestFat !== null && prevFat !== null) ? latestFat - prevFat : null;

    const latestMuscle = latest.masa_muscular ? Number(latest.masa_muscular) : null;
    const prevMuscle = previous?.masa_muscular ? Number(previous.masa_muscular) : null;
    const diffMuscle = (latestMuscle !== null && prevMuscle !== null) ? latestMuscle - prevMuscle : null;

    const latestWeight = latest.peso_kg ? Number(latest.peso_kg) : null;
    const prevWeight = previous?.peso_kg ? Number(previous.peso_kg) : null;
    const diffWeight = (latestWeight !== null && prevWeight !== null) ? latestWeight - prevWeight : null;

    return {
      fat: {
        value: latestFat !== null ? latestFat.toFixed(1) + '%' : 'â€”',
        diff: diffFat !== null ? (diffFat > 0 ? '+' : '') + diffFat.toFixed(1) + '%' : 'â€”',
        label: this.getFatLabel(latestFat, diffFat)
      },
      muscle: {
        value: latestMuscle !== null ? latestMuscle.toFixed(1) + 'kg' : 'â€”',
        diff: diffMuscle !== null ? (diffMuscle > 0 ? '+' : '') + diffMuscle.toFixed(1) + 'kg' : 'â€”',
        label: this.getMuscleLabel(diffMuscle)
      },
      weight: {
        value: latestWeight !== null ? latestWeight.toFixed(1) + 'kg' : 'â€”',
        diff: diffWeight !== null ? (diffWeight > 0 ? '+' : '') + diffWeight.toFixed(1) + 'kg' : 'â€”',
        label: this.getWeightLabel(latestWeight)
      }
    };
  });

  private getFatLabel(fat: number | null, diff: number | null): string {
    if (fat === null) return 'Sin datos';
    let base = 'Atleta';
    if (fat < 10) base = 'Atleta';
    else if (fat < 15) base = 'DefiniciÃ³n';
    else if (fat < 20) base = 'Fitness';
    else base = 'En fase de mejora';
    
    if (diff !== null && diff < 0) return `${base} (${diff.toFixed(1)}% vs previo)`;
    return base;
  }

  private getMuscleLabel(diff: number | null): string {
    if (diff === null) return 'Estable';
    if (diff > 1) return 'Hipertrofia Funcional';
    if (diff > 0) return 'Mantenimiento';
    return 'ReposiciÃ³n';
  }

  private getWeightLabel(weight: number | null): string {
    if (weight === null) return 'Sin datos';
    return 'Rango Competitivo';
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  getEmptyPatient() {
    return {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      edad: '',
      email: '',
      telefono: '',
      sexo: '',
      estatura_cm: '',
      objetivo: '',
      padecimientos: '',
      alergias: '',
      medicamentos: '',
      ocupacion: '',
      actividad_fisica: '',
      notas: ''
    };
  }
  async saveFollowupMeasurement() {
    const profile = this.selectedProfile();
    if (!profile?.patient?.id) {
      this.errorMessage.set('No hay un paciente seleccionado.');
      return;
    }

    this.errorMessage.set('');
    
    // Validar que la fecha no sea futura
    if (this.newFollowupMeasurement.fecha) {
      const selectedDate = new Date(this.newFollowupMeasurement.fecha + 'T12:00:00'); // Use mid-day to avoid TZ shifts for comparison
      const todayDate = new Date();
      todayDate.setHours(23, 59, 59, 999);
      
      if (selectedDate > todayDate) {
        this.errorMessage.set('NO SE PUEDE REGISTRAR UNA EVALUACIÃ“N CON FECHA FUTURA.');
        this.savingMeasurement.set(false);
        return;
      }
    }

    this.savingMeasurement.set(true);

    try {
      let response;
      if (this.editingMeasurement()) {
        response = await window.electronAPI.measurements.update({
          ...this.newFollowupMeasurement,
          patient_id: profile.patient.id
        });
      } else {
        response = await window.electronAPI.measurements.create({
          ...this.newFollowupMeasurement,
          patient_id: profile.patient.id
        });
      }

      if (!response.ok) {
        throw new Error(response.error || 'No se pudo guardar la mediciÃ³n.');
      }

      // Recargar el expediente inmediatamente antes de cerrar para asegurar reactividad
      await this.viewPatient(profile.patient.id);
      this.closeMeasurementModal();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al guardar la mediciÃ³n.');
    } finally {
      this.savingMeasurement.set(false);
    }
  }

  get today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  startEditMeasurement(measurement: any) {
    this.newFollowupMeasurement = { ...measurement };
    if (this.newFollowupMeasurement.fecha) {
      const dStr = String(this.newFollowupMeasurement.fecha).split('T')[0];
      const p = dStr.split('-');
      if (p.length === 3) {
        this.newFollowupMeasurement.fecha = dStr;
      } else {
        const d = new Date(this.newFollowupMeasurement.fecha);
        this.newFollowupMeasurement.fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    this.editingMeasurement.set(true);
    this.showMeasurementModal.set(true);
    this.errorMessage.set('');
  }
async deleteMeasurement(measurementId: number) {
  const confirmed = confirm('Â¿ESTÃS SEGURO? Esta acciÃ³n purgarÃ¡ el registro biomÃ©trico de forma permanente.');
  if (!confirmed) return;

  this.errorMessage.set('');

  try {
    console.log('Intentando eliminar mediciÃ³n:', measurementId);

    const response = await window.electronAPI.measurements.delete(measurementId);

    console.log('Respuesta deleteMeasurement:', response);

    if (!response.ok) {
      throw new Error(response.error || 'No se pudo eliminar la mediciÃ³n.');
    }

    const profile = this.selectedProfile();
    if (profile?.patient?.id) {
      await this.viewPatient(profile.patient.id);
    }
  } catch (error: any) {
    console.error('Error deleteMeasurement:', error);
    this.errorMessage.set(error.message || 'Error al eliminar la mediciÃ³n.');
  }
}

  getEmptyMeasurement() {
    return {
      fecha: '',
      peso_kg: '',
      grasa_corporal: '',
      imc: '',
      masa_magra: '',
      masa_muscular: '',
      cuello: '',
      pierna_derecha: '',
      pierna_izquierda: '',
      pantorrilla_derecha: '',
      pantorrilla_izquierda: '',
      cintura: '',
      fuerza: '',
      fuerza_brazo_derecho: '',
      fuerza_brazo_izquierdo: '',
      brazo_derecho: '',
      brazo_izquierdo: '',
      cadera: '',
      pecho_espalda: '',
      notas: '',
      fotos: []
    };
  }

  // Real-time calculations for forms
  onMeasurementFieldChange(m: any) {
    const peso = Number(m.peso_kg);
    const grasa = Number(m.grasa_corporal);

    if (peso > 0 && grasa > 0) {
      const grasa_kg = peso * (grasa / 100);
      m.masa_magra = Number((peso - grasa_kg).toFixed(1));
      
      // Calculate IMC if height is available
      const estatura = this.selectedProfile()?.patient?.estatura_cm || this.newPatient?.estatura_cm;
      if (estatura > 0) {
        const estatura_m = estatura / 100;
        m.imc = Number((peso / (estatura_m * estatura_m)).toFixed(1));
      }
    }
  }

  fullName(patient: Patient): string {
    return [
      patient.nombres,
      patient.apellido_paterno,
      patient.apellido_materno || ''
    ]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  setPatientSearch(value: string) {
    this.patientSearch.set(value);
  }

  setDietSearch(value: string) {
    this.dietSearch.set(value);
  }

  setMeasurementSearch(value: string) {
    this.measurementSearch.set(value);
  }

  setRoutineSearch(value: string) {
    this.routineSearch.set(value);
  }

  filteredPatients = computed(() => {
    const term = this.patientSearch().trim().toLowerCase();
    const obj = this.objectiveFilter();
    const patients = this.patients();

    return patients.filter((patient) => {
      const fullName = this.fullName(patient).toLowerCase();
      const email = String(patient.email || '').toLowerCase();
      const phone = String(patient.telefono || '').toLowerCase();
      const objective = String(patient.objetivo || '').toLowerCase();
      const conditions = String(patient.padecimientos || '').toLowerCase();

      const matchesSearch = !term || (
        fullName.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        objective.includes(term) ||
        conditions.includes(term)
      );

      const matchesObjective = obj === 'all' || patient.objetivo === obj;

      return matchesSearch && matchesObjective;
    });
  });

  filteredDiets = computed(() => {
    const profile = this.selectedProfile();
    if (!profile?.diets) return [];

    const term = this.dietSearch().trim().toLowerCase();
    if (!term) return profile.diets;

    return profile.diets.filter((diet: any) => {
      const name = String(diet.nombre || '').toLowerCase();
      const date = String(diet.created_at || '').toLowerCase();
      return name.includes(term) || date.includes(term);
    });
  });

  filteredMeasurements = computed(() => {
    const profile = this.selectedProfile();
    if (!profile?.measurements) return [];

    const term = this.measurementSearch().trim().toLowerCase();
    if (!term) return profile.measurements;

    return profile.measurements.filter((measurement: any) => {
      const date = String(measurement.fecha || measurement.created_at || '').toLowerCase();
      return date.includes(term);
    });
  });

  filteredRoutines = computed(() => {
    const profile = this.selectedProfile();
    const routines = profile?.routines || [];

    const term = this.routineSearch().trim().toLowerCase();
    if (!term) return routines;

    return routines.filter((routine: any) => {
      const name = String(routine.nombre || '').toLowerCase();
      const date = String(routine.created_at || '').toLowerCase();
      return name.includes(term) || date.includes(term);
    });
  });

  toggleMeasurementExpand(measurementId: number) {
    this.expandedMeasurements.update((current) => ({
      ...current,
      [measurementId]: !current[measurementId]
    }));
  }

  openPhotoPreview(photo: MeasurementPhoto) {
    this.previewPhoto.set(photo);
  }

  closePhotoPreview() {
    this.previewPhoto.set(null);
  }

  formatMeasurementDate(date?: string | null): string {
    if (!date) return 'Sin fecha';

    // Parsear fecha YYYY-MM-DD sin desplazamientos de zona horaria (UTC -> Local)
    const parts = date.split('T')[0].split('-');
    if (parts.length !== 3) return date;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const parsed = new Date(year, month, day);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async loadPatients() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const response = await window.electronAPI.patients.getAll();

      if (!response.ok) {
        throw new Error(response.error || 'No se pudieron cargar los pacientes.');
      }

      this.patients.set(response.data || []);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'OcurriÃ³ un error cargando pacientes.');
    } finally {
      this.loading.set(false);
    }
  }

  openCreateModal() {
    this.newPatient = this.getEmptyPatient();
    this.newMeasurement = this.getEmptyMeasurement();
    this.showCreateModal.set(true);
    this.errorMessage.set('');
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  openMeasurementModal() {
    this.newFollowupMeasurement = this.getEmptyMeasurement();
    const d = new Date();
    this.newFollowupMeasurement.fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.editingMeasurement.set(false);
    this.showMeasurementModal.set(true);
    this.errorMessage.set('');
  }

  closeMeasurementModal() {
    this.showMeasurementModal.set(false);
  }

  startEditPatient() {
    const profile = this.selectedProfile();
    if (!profile?.patient) return;

    this.editPatientForm = {
      nombres: profile.patient.nombres || '',
      apellido_paterno: profile.patient.apellido_paterno || '',
      apellido_materno: profile.patient.apellido_materno || '',
      edad: profile.patient.edad ?? '',
      email: profile.patient.email || '',
      telefono: profile.patient.telefono || '',
      sexo: profile.patient.sexo || '',
      estatura_cm: profile.patient.estatura_cm ?? '',
      objetivo: profile.patient.objetivo || '',
      padecimientos: profile.patient.padecimientos || '',
      alergias: profile.patient.alergias || '',
      medicamentos: profile.patient.medicamentos || '',
      ocupacion: profile.patient.ocupacion || '',
      actividad_fisica: profile.patient.actividad_fisica || '',
      notas: profile.patient.notas || ''
    };

    this.editingPatient.set(true);
    this.errorMessage.set('');
  }

  cancelEditPatient() {
    this.editingPatient.set(false);
  }

  async savePatientEdits() {
    const profile = this.selectedProfile();
    if (!profile?.patient?.id) {
      this.errorMessage.set('No hay un paciente seleccionado.');
      return;
    }

    if (!this.editPatientForm.nombres?.trim()) {
      this.errorMessage.set('El nombre del paciente es obligatorio.');
      return;
    }

    if (!this.editPatientForm.apellido_paterno?.trim()) {
      this.errorMessage.set('El apellido paterno es obligatorio.');
      return;
    }

    this.errorMessage.set('');
    this.updatingPatient.set(true);

    try {
      const response = await window.electronAPI.patients.update({
        id: profile.patient.id,
        ...this.editPatientForm
      });

      if (!response.ok) {
        throw new Error(response.error || 'No se pudieron guardar los cambios.');
      }

      this.editingPatient.set(false);
      await this.viewPatient(profile.patient.id);
      await this.loadPatients();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al actualizar el paciente.');
    } finally {
      this.updatingPatient.set(false);
    }
  }

  backToList() {
    this.selectedProfile.set(null);
    this.patientSearch.set('');
    this.dietSearch.set('');
    this.measurementSearch.set('');
    this.routineSearch.set('');
    this.editingPatient.set(false);
    this.expandedMeasurements.set({});
    this.previewPhoto.set(null);
  }

  async createPatientWithMeasurement() {
    this.errorMessage.set('');

    if (!this.newPatient.nombres?.trim()) {
      this.errorMessage.set('El nombre del paciente es obligatorio.');
      return;
    }

    if (!this.newPatient.apellido_paterno?.trim()) {
      this.errorMessage.set('El apellido paterno es obligatorio.');
      return;
    }

    this.saving.set(true);

    try {
      const patientResponse = await window.electronAPI.patients.create({
        ...this.newPatient
      });

      if (!patientResponse.ok || !patientResponse.data) {
        throw new Error(patientResponse.error || 'No se pudo crear el paciente.');
      }

      const createdPatient = patientResponse.data;

      const hasMeasurementData = Object.values(this.newMeasurement).some(
        (value) => value !== '' && value !== null && value !== undefined && value !== '[]'
      );

      if (hasMeasurementData) {
        const measurementResponse = await window.electronAPI.measurements.create({
          ...this.newMeasurement,
          patient_id: createdPatient.id
        });

        if (!measurementResponse.ok) {
          throw new Error(measurementResponse.error || 'Paciente creado, pero fallÃ³ la mediciÃ³n.');
        }
      }

      this.closeCreateModal();
      await this.loadPatients();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'OcurriÃ³ un error guardando el paciente.');
    } finally {
      this.saving.set(false);
    }
  }

  async viewPatient(patientId: number) {
    this.errorMessage.set('');

    try {
      const response = await window.electronAPI.patients.getProfile(patientId);

      if (!response.ok || !response.data) {
        throw new Error(response.error || 'No se pudo cargar el expediente.');
      }

      const profile = response.data;

      if (Array.isArray(profile.measurements)) {
        profile.measurements = profile.measurements.map((measurement: any) => ({
          ...measurement,
          fotos: Array.isArray(measurement.fotos) ? measurement.fotos : []
        }));
      }

      this.selectedProfile.set(profile);
      this.dietSearch.set('');
      this.measurementSearch.set('');
      this.routineSearch.set('');
      this.editingPatient.set(false);
      
      const initialExpanded: Record<number, boolean> = {};
      if (profile.measurements && profile.measurements.length > 0) {
        initialExpanded[profile.measurements[0].id] = true;
      }
      this.expandedMeasurements.set(initialExpanded);
      this.previewPhoto.set(null);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al cargar el expediente.');
    }
  }

  triggerMeasurementPhotoInput(measurementId: number) {
    const input = document.getElementById(
      `measurement-photo-input-${measurementId}`
    ) as HTMLInputElement | null;

    input?.click();
  }

  async uploadPhotosForMeasurement(measurement: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!measurement?.id || !files?.length) return;

    this.errorMessage.set('');
    this.uploadingPhotos.set(true);

    try {
      const filesArray = Array.from(files);

      for (const file of filesArray) {
        const arrayBuffer = await file.arrayBuffer();

        const response = await window.electronAPI.measurementPhotos.create({
          measurement_id: measurement.id,
          fecha: measurement.fecha || new Date().toISOString().slice(0, 10),
          nota: null,
          file: {
            name: file.name,
            type: file.type,
            buffer: Array.from(new Uint8Array(arrayBuffer))
          }
        });

        if (!response.ok) {
          throw new Error(response.error || 'No se pudo guardar una de las fotos.');
        }
      }

      const profile = this.selectedProfile();
      if (profile?.patient?.id) {
        await this.viewPatient(profile.patient.id);
      }

      input.value = '';
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al subir las fotos.');
    } finally {
      this.uploadingPhotos.set(false);
    }
  }

  async deleteMeasurementPhoto(photoId: number) {
    const confirmed = confirm('Â¿ESTÃS SEGURO? El registro visual serÃ¡ eliminado del sistema.');
    if (!confirmed) return;

    this.errorMessage.set('');

    try {
      const response = await window.electronAPI.measurementPhotos.delete(photoId);

      if (!response.ok) {
        throw new Error(response.error || 'No se pudo eliminar la foto.');
      }

      const profile = this.selectedProfile();
      if (profile?.patient?.id) {
        await this.viewPatient(profile.patient.id);
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al eliminar la foto.');
    }
  }

  async openGeneratedDocument(doc: any) {
    const path = doc.path || doc.file_path;
    if (!path) return;
    try {
      await (window as any).electronAPI.generatedDocuments.open(path);
    } catch (e: any) {
      alert('Error al abrir PDF: ' + e.message);
    }
  }

  async deleteGeneratedDocument(docId: number) {
    const confirmed = confirm('Â¿Purga total? El PDF serÃ¡ eliminado de la bÃ³veda.');
    if (!confirmed) return;

    try {
      const res = await (window as any).electronAPI.generatedDocuments.delete(docId);
      if (res.ok) {
        const profile = this.selectedProfile();
        if (profile?.patient?.id) await this.viewPatient(profile.patient.id);
      }
    } catch (e: any) {
       alert('Error al eliminar PDF: ' + e.message);
    }
  }

  formatDate(fecha: any): string {
    if (!fecha) return 'â€”';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    } catch { return String(fecha); }
  }

  async deleteDiet(dietId: number) {
    const confirmed = confirm('Â¿Borrar este plan de alimentaciÃ³n?');
    if (!confirmed) return;
    try {
      const res = await (window as any).electronAPI.diets.delete(dietId);
      if (res.ok) {
        const profile = this.selectedProfile();
        if (profile?.patient?.id) await this.viewPatient(profile.patient.id);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) { alert('Error al borrar dieta: ' + e.message); }
  }

  async deleteRoutine(routineId: number) {
    const confirmed = confirm('Â¿Borrar esta rutina?');
    if (!confirmed) return;
    try {
      const res = await (window as any).electronAPI.routines.delete(routineId);
      if (res.ok) {
        const profile = this.selectedProfile();
        if (profile?.patient?.id) await this.viewPatient(profile.patient.id);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) { alert('Error al borrar rutina: ' + e.message); }
  }

  async deletePatient(patientId: number) {
    const confirmed = confirm('Â¿ESTÃS SEGURO? Se eliminarÃ¡ el expediente completo y todos los datos asociados.');
    if (!confirmed) return;

    this.errorMessage.set('');

    try {
      const response = await window.electronAPI.patients.delete(patientId);

      if (!response.ok) {
        throw new Error(response.error || 'No se pudo eliminar el paciente.');
      }

      await this.loadPatients();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al eliminar el paciente.');
    }
  }

  downloadMeasurementPdf(measurement: any) {
    if (this.comparisonComponent) {
      this.comparisonComponent.exportSingleMeasurementPdf(measurement);
    } else {
      console.error('PDF Engine instance not found.');
    }
  }

  openDocument(doc: any) {
    if (!doc) return;
    if (doc.category === 'measurement') {
      this.downloadMeasurementPdf(doc.original);
    } else if (doc.category === 'diet') {
      this.viewDiet(doc.original);
    } else if (doc.category === 'routine') {
      this.viewRoutine(doc.original);
    } else if (doc.category === 'pdf') {
      this.openGeneratedDocument(doc);
    }
  }

  editDocument(doc: any) {
    if (!doc || !doc.original) return;
    if (doc.category === 'measurement') {
      this.startEditMeasurement(doc.original);
    } else if (doc.category === 'diet') {
      this.openDietModal(doc.original);
    } else if (doc.category === 'routine') {
      this.openRoutineModal(doc.original);
    } else if (doc.category === 'pdf') {
      this.openGeneratedDocument(doc);
    }
  }

  async deleteDocument(doc: any) {
    if (!doc || !doc.original) return;
    const id = doc.original.id;
    if (!id) return;

    if (doc.category === 'measurement') {
      await this.deleteMeasurement(id);
    } else if (doc.category === 'pdf') {
      await this.deleteGeneratedDocument(id);
    } else if (doc.category === 'diet') {
      await this.deleteDiet(id);
    } else if (doc.category === 'routine') {
      await this.deleteRoutine(id);
    }
  }

  viewDiet(diet: any) {
    this.openDietModal(diet);
  }

  viewRoutine(routine: any) {
     this.openRoutineModal(routine);
  }

  // assignments methods
  async openDietModal(diet?: any) {
    if (diet?.id) {
       try {
          const res = await (window as any).electronAPI.diets.getFull(diet.id);
          if (res.ok) {
             this.dietToEdit.set(res.data);
          } else {
             this.dietToEdit.set(diet);
          }
       } catch (e) {
          this.dietToEdit.set(diet);
       }
    } else {
       this.dietToEdit.set(null);
    }
    this.showDietModal.set(true);
  }

  closeDietModal() {
    this.showDietModal.set(false);
    this.dietToEdit.set(null);
  }

  async onDietSaved() {
    const profile = this.selectedProfile();
    if (profile?.patient?.id) {
      await this.viewPatient(profile.patient.id);
    }
    this.closeDietModal();
  }

  openRoutineModal(routine?: any) {
    this.routineToEdit.set(routine || null);
    this.showRoutineModal.set(true);
  }

  closeRoutineModal() {
    this.showRoutineModal.set(false);
    this.routineToEdit.set(null);
  }

  async onPdfGenerated() {
    console.log("[Reporte] PDF generado detectado, refrescando perfil...");
    const profile = this.selectedProfile();
    if (profile?.patient?.id) {
      await this.viewPatient(profile.patient.id);
    }
  }

  async onRoutineSaved() {
    const profile = this.selectedProfile();
    if (profile?.patient?.id) {
      await this.viewPatient(profile.patient.id);
    }
    this.closeRoutineModal();
  }

  openMegaPdfModal() {
    this.showMegaPdfModal.set(true);
  }

  closeMegaPdfModal() {
    this.showMegaPdfModal.set(false);
  }

  formatDateMinimal(date?: string | null): string {
    if (!date) return '—';
    try {
      const d = new Date(date.includes(' ') ? date.replace(' ', 'T') : date);
      if (isNaN(d.getTime())) {
        const parts = date.split('T')[0].split('-');
        return parts.length === 3 ? `${parts[2]}` : String(date);
      }
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase();
    } catch {
      return String(date);
    }
  }

  private getMonthName(m: number): string {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return months[m] || '';
  }
}


