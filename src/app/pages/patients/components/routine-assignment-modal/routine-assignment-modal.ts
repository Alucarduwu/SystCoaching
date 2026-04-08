import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExerciseFormModalComponent } from '../../../exercise/exercise-form-modal/exercise-form-modal';

@Component({
  selector: 'app-routine-assignment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ExerciseFormModalComponent],
  templateUrl: './routine-assignment-modal.html',
  styleUrl: './routine-assignment-modal.scss'
})
export class RoutineAssignmentModalComponent implements OnChanges {
  @Input() open = false;
  @Input() patientId: number | null = null;
  @Input() routineToEdit?: any;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  public currentStep = signal(1);

  public routineForm = {
    nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    frecuencia: 5,
    semanas: 4,
    notas: '',
    weeks: [] as any[]
  };

  public seriesTypes = [
    'Normal', 'Bi-series', 'Tri-series', 'Serie Gigante', 
    'Drop Set', 'Rest-Pause', 'Myo-Reps', 'Cluster Set', 'Cluster Serie',
    'Serie Descendente', 'Back-off Set'
  ];

  public seriesStyles = [
    'Estándar', 'Biomecánica', 'Excéntrica', 'Isométrica', 'Concéntrica', 
    'Explosiva', 'Isocinética', 'Pausa-Activa', 'Enfoque Tensión', 'Fallo Muscular'
  ];

  public activeWeekIndex = signal(0);
  public activeDayIndex = signal(0);
  public exerciseSearch = signal('');
  public searchResults = signal<any[]>([]);
  public loadingSearch = signal(false);
  public saving = signal(false);
  public activeMuscleGroupTarget: { weekIndex: number, dayIndex: number, muscleIndex: number } | null = null;

  public isExporting = signal(false);
  public exportProgress = signal(0);
  public patientData = signal<any>(null);
  public showExerciseModal = signal(false);
  public exerciseInitialData = signal<any>(null);
  private fullExerciseLibrary = signal<any[]>([]);

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['routineToEdit'] && this.routineToEdit) {
      this.rebuildRoutineStructure(this.routineToEdit);
    }
    if (changes['open'] && this.open) {
      if (this.patientId) this.fetchPatientData();
      if (!this.routineToEdit) {
        this.routineForm.semanas = 4;
        this.initEmptyWeeks();
      }
      this.loadExerciseLibrary();
      this.currentStep.set(1);
      this.activeWeekIndex.set(0);
      this.activeDayIndex.set(0);
    }
  }

  async loadExerciseLibrary() {
    try {
      const res = await (window as any).electronAPI.exercises.getAll();
      if (res.ok) this.fullExerciseLibrary.set(res.data || []);
    } catch (err) { console.error(err); }
  }

  initEmptyWeeks() {
    const weekCount = this.routineForm.semanas || 1;
    const dayCount = this.routineForm.frecuencia || 1;
    const dayNames = ['Lunes', 'Dia 2', 'Dia 3', 'Dia 4', 'Dia 5', 'Dia 6', 'Dia 7'];
    this.routineForm.weeks = Array.from({ length: weekCount }, (_, w) => ({
      nombre: `Semana ${w + 1}`,
      days: Array.from({ length: dayCount }, (_, d) => ({
        nombre: dayNames[d] || `Día ${d + 1}`,
        muscleGroups: []
      }))
    }));
  }

  updateStructure() {
    const targetWeeks = Number(this.routineForm.semanas) || 1;
    const targetDays = Number(this.routineForm.frecuencia) || 5;
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Dom'];

    if (this.routineForm.weeks.length > targetWeeks) {
      this.routineForm.weeks = this.routineForm.weeks.slice(0, targetWeeks);
    } else {
      while (this.routineForm.weeks.length < targetWeeks) {
        this.routineForm.weeks.push({ nombre: `Semana ${this.routineForm.weeks.length + 1}`, days: [] });
      }
    }

    this.routineForm.weeks.forEach((week) => {
      if (week.days.length > targetDays) {
        week.days = week.days.slice(0, targetDays);
      } else {
        while (week.days.length < targetDays) {
          week.days.push({ nombre: dayNames[week.days.length] || `Día ${week.days.length + 1}`, muscleGroups: [] });
        }
      }
    });

    if (this.activeWeekIndex() >= targetWeeks) this.activeWeekIndex.set(0);
    if (this.activeDayIndex() >= targetDays) this.activeDayIndex.set(0);
  }

  addMuscleGroupToDay(weekIndex: number, dayIndex: number) {
    this.routineForm.weeks[weekIndex].days[dayIndex].muscleGroups.push({ nombre: 'Nuevo Grupo', expanded: true, exercises: [] });
  }

  removeMuscleGroup(weekIndex: number, dayIndex: number, muscleIndex: number) {
    this.routineForm.weeks[weekIndex].days[dayIndex].muscleGroups.splice(muscleIndex, 1);
  }

  private async fetchPatientData() {
    if (!this.patientId) return;
    try {
      const res = await (window as any).electronAPI.patients.getById(this.patientId);
      if (res.ok) this.patientData.set(res.data);
    } catch (e) { console.error(e); }
  }

  private rebuildRoutineStructure(routine: any) {
    this.routineForm.nombre = routine.nombre || '';
    this.routineForm.fecha = routine.fecha || (routine.created_at ? routine.created_at.split(/[T ]/)[0] : new Date().toISOString().split('T')[0]);
    this.routineForm.frecuencia = routine.frecuencia || 5;
    this.routineForm.semanas = routine.semanas || 1;
    this.routineForm.notas = routine.notas || '';
    this.routineForm.weeks = [];

    const targetWeeks = Number(this.routineForm.semanas) || 1;
    const targetDays = Number(this.routineForm.frecuencia) || 5;
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Dom'];

    // 1. Pre-initialize structure
    for (let w = 1; w <= targetWeeks; w++) {
      const week = { nombre: `Semana ${w}`, days: [] as any[] };
      for (let d = 1; d <= targetDays; d++) {
        week.days.push({ 
          nombre: dayNames[d-1] || `Día ${d}`, 
          muscleGroups: [] as any[] 
        });
      }
      this.routineForm.weeks.push(week);
    }

    // 2. Distribute exercises
    const exercises = routine.exercises || [];
    exercises.forEach((ex: any) => {
      // Find week index
      const weekNumMatch = (ex.semana || '').match(/\d+/);
      const wIdx = weekNumMatch ? (parseInt(weekNumMatch[0]) - 1) : 0;
      
      // Find day index
      const dNameStr = (ex.dia || '').toLowerCase();
      let dIdx = dayNames.findIndex(name => dNameStr.includes(name.toLowerCase()));
      if (dIdx === -1) {
        const dayNumMatch = dNameStr.match(/\d+/);
        dIdx = dayNumMatch ? (parseInt(dayNumMatch[0]) - 1) : 0;
      }

      if (this.routineForm.weeks[wIdx] && this.routineForm.weeks[wIdx].days[dIdx]) {
        const day = this.routineForm.weeks[wIdx].days[dIdx];
        const mgKey = ex.grupo_muscular_objetivo || 'General';
        let mg = day.muscleGroups.find((m: any) => m.nombre === mgKey);
        if (!mg) { mg = { nombre: mgKey, exercises: [], expanded: true }; day.muscleGroups.push(mg); }

        mg.exercises.push({
          id: ex.exercise_id, exercise_id: ex.exercise_id, nombre: ex.exercise_nombre, grupo_muscular: ex.grupo_muscular,
          series: ex.series || 0, repeticiones: ex.repeticiones || '', descanso: ex.descanso || '', peso_sugerido: ex.peso_sugerido || '',
          tipo_serie: ex.tipo_serie || 'Normal', estilo_serie: ex.estilo_serie || 'Estándar', notas: ex.notas || '', orden: ex.orden,
          expanded: false, sets_breakdown: ex.sets_breakdown || [], tempo: ex.tempo || '3-0-1-0', rpe: ex.rpe || '8'
        });
      }
    });
  }

  onClose() { this.currentStep.set(1); this.close.emit(); this.resetForm(); }
  private resetForm() { this.routineForm = { nombre: '', fecha: new Date().toISOString().split('T')[0], frecuencia: 5, semanas: 4, notas: '', weeks: [] }; this.patientData.set(null); }

  async searchExercises(query: string, weekIndex: number, dayIndex: number, muscleIndex: number) {
    this.exerciseSearch.set(query);
    this.activeMuscleGroupTarget = { weekIndex, dayIndex, muscleIndex };
    if (!query || query.trim().length < 1) { this.searchResults.set([]); return; }
    const terms = query.toLowerCase().trim().split(/\s+/);
    const filtered = this.fullExerciseLibrary()
      .filter((ex: any) => {
        const name = ex.nombre.toLowerCase();
        const mg = (ex.grupo_muscular || '').toLowerCase();
        return terms.every(t => name.includes(t) || mg.includes(t));
      })
      .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
    this.searchResults.set(filtered.slice(0, 20));
  }

  addManualExercise(name: string, weekIndex: number, dayIndex: number, muscleIndex: number) {
    if (!name) return;
    this.activeMuscleGroupTarget = { weekIndex, dayIndex, muscleIndex };
    this.exerciseInitialData.set({ nombre: name.toUpperCase(), expanded: true });
    this.showExerciseModal.set(true);
  }

  onExerciseCreated(exercise: any) {
    if (!this.activeMuscleGroupTarget) return;
    const { weekIndex, dayIndex, muscleIndex } = this.activeMuscleGroupTarget;
    this.addExerciseToTarget(exercise, weekIndex, dayIndex, muscleIndex);
    this.loadExerciseLibrary();
  }
 
  addExerciseToTarget(exercise: any, weekIndex: number, dayIndex: number, muscleIndex: number) {
    const day = this.routineForm.weeks[weekIndex].days[dayIndex];
    const mg = day.muscleGroups[muscleIndex];
    mg.exercises.push({
      id: exercise.id, exercise_id: exercise.id, nombre: exercise.nombre.toUpperCase(), grupo_muscular: exercise.grupo_muscular || 'GRAL',
      series: 4, repeticiones: '12', descanso: '90s', notas: '', notas_biblioteca: exercise.notas || '', expanded: true,
      sets_breakdown: Array(4).fill(0).map(() => ({ reps: '12', descanso: '90s', tipo_serie: 'Normal', estilo_serie: 'Estándar' }))
    });
    this.exerciseSearch.set(''); this.searchResults.set([]); this.activeMuscleGroupTarget = null;
    this.cdr.detectChanges();
  }
 
  toggleExpand(ex: any) { ex.expanded = !ex.expanded; this.cdr.detectChanges(); }
  toggleExpandMG(mg: any) { mg.expanded = !mg.expanded; this.cdr.detectChanges(); }

  propagateMetodology(ex: any) {
    if (!ex.sets_breakdown) return;
    ex.sets_breakdown.forEach((s: any) => {
      s.tipo_serie = ex.tipo_serie;
      s.estilo_serie = ex.estilo_serie;
    });
    this.cdr.detectChanges();
  }

  updateSetsBreakdown(ex: any) {
    const count = parseInt(ex.series) || 0;
    if (count > 0) {
      if (!ex.sets_breakdown) ex.sets_breakdown = [];
      if (ex.sets_breakdown.length < count) {
        for (let i = ex.sets_breakdown.length; i < count; i++) {
          ex.sets_breakdown.push({ 
            reps: ex.repeticiones || '12', 
            descanso: ex.descanso || '90s', 
            tipo_serie: ex.tipo_serie || 'Normal', 
            estilo_serie: ex.estilo_serie || 'Estándar' 
          });
        }
      } else if (ex.sets_breakdown.length > count) {
        ex.sets_breakdown = ex.sets_breakdown.slice(0, count);
      }
      ex.sets_breakdown = [...ex.sets_breakdown];
    }
  }

  removeExercise(weekIndex: number, dayIndex: number, muscleIndex: number, exIndex: number) {
    this.routineForm.weeks[weekIndex].days[dayIndex].muscleGroups[muscleIndex].exercises.splice(exIndex, 1);
  }

  hasWeekData(week: any): boolean {
    if (!week || !week.days) return false;
    return week.days.some((d: any) => this.hasDayData(d));
  }

  hasDayData(day: any): boolean {
    if (!day || !day.muscleGroups) return false;
    return day.muscleGroups.some((mg: any) => (mg.exercises || []).length > 0);
  }

  getDayFocus(day: any): string {
    if (!this.hasDayData(day)) return 'Descanso Programado';
    const muscles = day.muscleGroups
      .filter((mg: any) => (mg.exercises || []).length > 0)
      .map((mg: any) => mg.nombre.toUpperCase());
    return muscles.join(' / ') + ' // HIPERTROFIA';
  }

  async onSave() {
    if (!this.routineForm.nombre || !this.patientId) return;
    try {
      this.saving.set(true);
      const flatExercises: any[] = [];
      this.routineForm.weeks.forEach(week => {
        week.days.forEach((day: any) => {
          day.muscleGroups.forEach((mg: any) => {
            mg.exercises.forEach((ex: any) => {
              flatExercises.push({ ...ex, semana: week.nombre, dia: day.nombre, grupo_muscular_objetivo: mg.nombre, orden: flatExercises.length + 1 });
            });
          });
        });
      });
      const payload = { patient_id: this.patientId, nombre: this.routineForm.nombre, fecha: this.routineForm.fecha, frecuencia: Number(this.routineForm.frecuencia), semanas: Number(this.routineForm.semanas), notas: this.routineForm.notas, exercises: flatExercises };
      let res = this.routineToEdit?.id ? await (window as any).electronAPI.routines.updateFull({ id: this.routineToEdit.id, ...payload }) : await (window as any).electronAPI.routines.createFull(payload);
      if (!res.ok) throw new Error(res.error);
      this.saved.emit(); this.onClose();
    } catch (err) { console.error(err); } finally { this.saving.set(false); }
  }

  get flatExercises() {
    const flat: any[] = [];
    this.routineForm.weeks.forEach(week => {
      week.days.forEach((day: any) => {
        day.muscleGroups.forEach((mg: any) => {
          mg.exercises.forEach((ex: any) => {
            flat.push({ ...ex, semana: week.nombre, dia: day.nombre, grupo_muscular_objetivo: mg.nombre });
          });
        });
      });
    });
    return flat;
  }

  get getAllDaysForPdf() {
    const allDays: any[] = [];
    this.routineForm.weeks.forEach(week => {
      week.days.forEach((day: any) => {
        allDays.push({ ...day, weekName: week.nombre });
      });
    });
    return allDays;
  }

  public formatPdfDate(fecha?: string): string {
    const d = fecha ? new Date(fecha + 'T12:00:00') : new Date();
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  }

  public async exportPdf() {
    this.isExporting.set(true);
    this.exportProgress.set(5);
    this.cdr.detectChanges();

    if (!this.routineForm.nombre) { 
      alert("⚠️ ASIGNACIÓN INCOMPLETA: El nombre del plan es obligatorio para la trazabilidad.");
      this.isExporting.set(false);
      return;
    }

    const hasAnyExercise = this.routineForm.weeks.some(w => this.hasWeekData(w));
    if (!hasAnyExercise) {
      alert("🚫 REPORTE BLOQUEADO: El plan no contiene programación operativa (ejercicios). No se pueden generar documentos vacíos.");
      this.isExporting.set(false);
      return;
    }

    if (!this.patientData() && this.patientId) {
      const res = await (window as any).electronAPI.patients.getById(this.patientId);
      if (res.ok) this.patientData.set(res.data);
    }

    // Force a small delay to ensure DOM is ready for phantom
    await new Promise(r => setTimeout(r, 600));

    try {
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      let isFirstPage = true;

      // 1. CAPTURE MASTER PAGES (1, 2 & 3)
      const corePages = ['pdf-routine-master', 'pdf-routine-periodization', 'pdf-routine-weekly'];
      for (let i = 0; i < corePages.length; i++) {
        const pageId = corePages[i];
        const el = document.getElementById(pageId);
        if (!el) continue;

        this.exportProgress.set(10 + (i * 10));
        this.cdr.detectChanges();
        await new Promise(r => setTimeout(r, 400));

        const canvas = await html2canvas(el, { scale: 2.5, backgroundColor: '#000000', useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (!isFirstPage) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        isFirstPage = false;
      }

      // 2. CAPTURE MATRIX BY WEEK BLOCKS (DYNAMIC HEIGHTS)
      const totalWeeks = this.routineForm.weeks.length;
      for (let i = 0; i < totalWeeks; i++) {
        const weekEl = document.getElementById(`pdf-week-block-${i}`);
        if (!weekEl) continue;

        this.exportProgress.set(40 + Math.round((i / totalWeeks) * 50));
        this.cdr.detectChanges();
        await new Promise(r => setTimeout(r, 600));

        const canvas = await html2canvas(weekEl, { scale: 2.5, backgroundColor: '#000000', useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const imgWidth = 210; 
        const pageHeight = 297; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        while (heightLeft > 0) {
            if (!isFirstPage) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
            position -= pageHeight;
            isFirstPage = false;
        }
      }

      const fileName = `PLAN_ENTRENAMIENTO_${(this.patientData()?.nombres || 'CLIENTE').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      this.exportProgress.set(100);
      this.cdr.detectChanges();
    } catch (err: any) { 
      console.error(err); 
    } finally { 
      setTimeout(() => { 
        this.isExporting.set(false); 
        this.exportProgress.set(0); 
        this.cdr.detectChanges();
      }, 800); 
    }
  }
}
