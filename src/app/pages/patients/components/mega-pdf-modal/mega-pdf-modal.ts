import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal, ChangeDetectorRef, OnChanges, SimpleChanges, ViewChild, TemplateRef, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-mega-pdf-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './mega-pdf-modal.html',
  styleUrl: './mega-pdf-modal.scss'
})
export class MegaPdfModalComponent implements OnChanges {
  @Input() open = false;
  @Input() patientId: number | null = null;
  @Input() 
  set measurements(value: any[]) {
    this._measurements = value || [];
    if (this._measurements.length > 0) {
      console.log('MEGA_DEBUG: INPUT_MEASUREMENTS_SYNC_RECEIVED', this._measurements.length);
      const sorted = [...this._measurements].sort((a:any, b:any) => new Date(b.fecha||b.created_at||0).getTime() - new Date(a.fecha||a.created_at||0).getTime());
      this.availableMeasurements.set(sorted);
      this.syncMeasurements();
      this.cdr.detectChanges();
    }
  }
  get measurements(): any[] { return this._measurements; }
  private _measurements: any[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // CORE STATE SIGNALS
  public sections = { diet: true, training: true, measurements: true };
  public isGenerating = signal(false);
  public exportProgress = signal(0);
  public status = signal('');
  public currentTimestamp = new Date();

  public patientData = signal<any>(null);
  public selectedDietsData = signal<any[]>([]);
  public selectedRoutinesData = signal<any[]>([]);
  public measurementData = signal<any[]>([]);

  // DERIVED DATA FOR PDF (Now lists to support multiple selections)
  public syncDiets = signal<any[]>([]); // Array of processed diet objects
  public syncRoutines = signal<any[]>([]); // Array of processed routine objects

  public syncHasNutritionData = signal<boolean>(false);
  public patientAge = signal<number|string>('--');
  
  public syncRoutineCount = computed(() => {
    return this.selectedRoutinesData().reduce((acc, r) => acc + (r?.exercises?.length || 0), 0);
  });

  // DROPDOWN SELECTIONS
  public availableDiets = signal<any[]>([]);
  public availableRoutines = signal<any[]>([]);
  public availableMeasurements = signal<any[]>([]);
  public selectedDietIds = signal<number[]>([]);
  public selectedRoutineIds = signal<number[]>([]);
  public selectedMeasurementIds = signal<number[]>([]);
  public syncToggle = signal<boolean>(false);

  @ViewChild('coverTpl') coverTpl!: TemplateRef<any>;
  @ViewChild('profileTpl') profileTpl!: TemplateRef<any>;
  @ViewChild('nutritionTpl') nutritionTpl!: TemplateRef<any>;
  @ViewChild('nutritionGuidelinesTpl') nutritionGuidelinesTpl!: TemplateRef<any>;
  @ViewChild('nutritionGuideTpl') nutritionGuideTpl!: TemplateRef<any>;
  @ViewChild('trainingTpl') trainingTpl!: TemplateRef<any>;
  @ViewChild('measurementsTpl') measurementsTpl!: TemplateRef<any>;

  public pages = signal<any[]>([]);

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true) {
      console.log('MEGA_DEBUG: MODAL_OPEN_DETECTED', this.patientId);
      this.reset();
      
      // IMMEDIATE SYNC FROM INPUTS BEFORE ASYNC FETCH
      if (this._measurements && this._measurements.length > 0) {
        console.log('MEGA_DEBUG: IMMEDIATE_INPUT_SYNC', this._measurements.length);
        const sorted = [...this._measurements].sort((a:any, b:any) => new Date(b.fecha||b.created_at||0).getTime() - new Date(a.fecha||a.created_at||0).getTime());
        this.availableMeasurements.set(sorted);
        this.cdr.detectChanges();
      }

      await this.fetchAvailableData();
    }
  }

  reset() {
    this.status.set('SISTEMA_DCP_STANDBY');
    this.isGenerating.set(false);
    this.exportProgress.set(0);
    this.selectedDietsData.set([]);
    this.selectedRoutinesData.set([]);
    this.pages.set([]);
    this.syncDiets.set([]);
    this.syncRoutines.set([]);
    this.syncHasNutritionData.set(false);
    this.availableDiets.set([]);
    this.availableRoutines.set([]);
    this.availableMeasurements.set([]);
    this.selectedDietIds.set([]);
    this.selectedRoutineIds.set([]);
    this.selectedMeasurementIds.set([]);
    this.measurementData.set([]);
  }

  toggleSection(section: 'diet' | 'training' | 'measurements') {
    this.sections[section] = !this.sections[section];
    this.rebuildPageList();
  }

  rebuildPageList() {
    const list: any[] = [ { id: 'cover', tpl: 'coverTpl' }, { id: 'profile', tpl: 'profileTpl' } ];
    
    if (this.sections.diet) {
      this.syncDiets().forEach((d, idx) => {
        list.push({ id: `diet-plan-${idx}`, name: `PLAN NUTRI: ${d.nombre}`, tpl: 'nutritionTpl', target: `pdf-nutrition-plan-${idx}` });
        list.push({ id: `diet-guidelines-${idx}`, name: `NORMAS: ${d.nombre}`, tpl: 'nutritionGuidelinesTpl', target: `pdf-nutrition-guidelines-${idx}` });
        list.push({ id: `diet-guide-${idx}`, name: `GUÍA: ${d.nombre}`, tpl: 'nutritionGuideTpl', target: `pdf-nutrition-guide-${idx}` });
      });
    }
    
    if (this.sections.training) {
      this.syncRoutines().forEach((r, idx) => {
        list.push({ id: `routine-master-${idx}`, name: `PROTOCOLO: ${r.nombre}`, tpl: 'trainingTpl', mode: 'master', target: `pdf-training-plan-master-${idx}` });
        list.push({ id: `routine-matrix-${idx}`, name: `MATRIZ: ${r.nombre}`, tpl: 'trainingTpl', mode: 'matrix', target: `pdf-training-plan-matrix-${idx}` });
      });
    }
    
    if (this.sections.measurements && this.measurementData().length > 0) {
      list.push({ id: 'measurements-report', name: 'EVOLUCIÓN ANTROPOMÉTRICA', tpl: 'measurementsTpl', target: 'mega-measurements-report' });
    }
    
    this.pages.set(list);
    this.cdr.detectChanges();
  }

  async fetchAvailableData() {
    this.status.set('SINCRO: DATOS BASE...');
    const res = await (window as any).electronAPI.patients.getById(this.patientId);
    if (res.ok) {
      this.patientData.set(res.data);
    }
    
    // NUTRITION
    const d = await (window as any).electronAPI.diets.getByPatient(this.patientId);
    if (d.ok && d.data?.length > 0) {
      this.availableDiets.set(d.data);
      // AUTO-SELECT LATEST
      this.toggleDietSelection(d.data[0].id);
    }

    // TRAINING
    const r = await (window as any).electronAPI.routines.getByPatient(this.patientId);
    if (r.ok && r.data?.length > 0) {
      this.availableRoutines.set(r.data);
      // AUTO-SELECT LATEST
      this.toggleRoutineSelection(r.data[0].id);
    }
    
    // Safety delay to allow Signal propagation before first rebuild
    await new Promise(res => setTimeout(res, 500));
    
    this.syncDataInternals(); 
    this.rebuildPageList();
    this.cdr.detectChanges();
    
    // Final safety delay to ensure DOM reflects page list for capture
    setTimeout(() => {
      this.cdr.detectChanges();
      this.rebuildPageList();
    }, 100);
    this.cdr.detectChanges();

    // MEASUREMENTS: PRIORITIZE INPUT DATA BUT FETCH FROM API TO ENSURE SYNC
    if (this._measurements.length > 0 && this.availableMeasurements().length === 0) {
      console.log('MEGA_DEBUG: SYNC_DATA_FROM_INPUTS');
      const sorted = [...this._measurements].sort((a:any, b:any) => new Date(b.fecha||b.created_at||0).getTime() - new Date(a.fecha||a.created_at||0).getTime());
      this.availableMeasurements.set(sorted);
      this.cdr.detectChanges();
    }

    // MEASUREMENTS: PRIORITIZE API BUT FALLBACK TO INPUTS
    console.log('MEGA_DEBUG: FETCHING_MEASUREMENTS_FOR', this.patientId);
    let mList: any[] = [];
    try {
      const resp = await (window as any).electronAPI.measurements.getByPatient(this.patientId);
      console.log('MEGA_DEBUG: API_RESP_MEASUREMENTS', resp);
      if (resp.ok && resp.data?.length > 0) mList = resp.data;
      else if (this.measurements?.length > 0) {
        console.log('MEGA_DEBUG: FALLBACK_TO_INPUT_MEASUREMENTS', this.measurements.length);
        mList = this.measurements;
      }
    } catch (e) {
      console.error('MEGA_DEBUG: ERROR_FETCHING_MEASUREMENTS', e);
      if (this.measurements?.length > 0) mList = this.measurements;
    }

    const sorted = [...mList].sort((a:any, b:any) => new Date(b.fecha||b.created_at||0).getTime() - new Date(a.fecha||a.created_at||0).getTime());
    this.availableMeasurements.set(sorted);
    
    // Initial data normalization without auto-selection
    this.syncDataInternals();
    this.rebuildPageList();
    
    // FINAL SAFETY FORCE
    if (this.availableMeasurements().length === 0 && this._measurements.length > 0) {
       const sortedM = [...this._measurements].sort((a:any, b:any) => new Date(b.fecha||b.created_at||0).getTime() - new Date(a.fecha||a.created_at||0).getTime());
       this.availableMeasurements.set(sortedM);
    }

    this.cdr.detectChanges(); 
  }

  async manualReload() {
    console.log('MEGA_DEBUG: MANUAL_RELOAD_TRIGGERED');
    await this.fetchAvailableData();
  }

  syncMeasurements() { 
    const all = this.availableMeasurements();
    const selectedIds = this.selectedMeasurementIds();
    const selectedData = all.filter(m => selectedIds.includes(m.id))
                           .sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    this.measurementData.set(selectedData); 
    this.rebuildPageList(); 
  }

  async toggleDietSelection(id: number) {
    const current = [...this.selectedDietIds()];
    const idx = current.indexOf(id);
    if (idx !== -1) current.splice(idx, 1);
    else current.push(id);
    this.selectedDietIds.set(current);
    
    // FETCH FULL DATA FOR ALL SELECTED DIETS
    const fullDiets = [];
    for (const dId of current) {
      const res = await (window as any).electronAPI.diets.getFull(dId);
      if (res.ok) fullDiets.push(res.data);
    }
    this.selectedDietsData.set(fullDiets);
    this.syncDataInternals();
    this.rebuildPageList();
  }

  isDietSelected(id: number): boolean { return this.selectedDietIds().includes(id); }

  async toggleRoutineSelection(id: number) {
    const current = [...this.selectedRoutineIds()];
    const idx = current.indexOf(id);
    if (idx !== -1) current.splice(idx, 1);
    else current.push(id);
    this.selectedRoutineIds.set(current);
    
    // FETCH FULL DATA FOR ALL SELECTED ROUTINES
    const fullRoutines = [];
    for (const rId of current) {
      const res = await (window as any).electronAPI.routines.getFull(rId);
      if (res.ok) {
        const finalData = res.data?.routine || res.data;
        fullRoutines.push(finalData);
      }
    }
    this.selectedRoutinesData.set(fullRoutines);
    this.syncDataInternals();
    this.rebuildPageList();
  }

  isRoutineSelected(id: number): boolean { return this.selectedRoutineIds().includes(id); }

  toggleMeasurementSelection(id: number) {
    const current = [...this.selectedMeasurementIds()];
    const idx = current.indexOf(id);
    if (idx !== -1) current.splice(idx, 1);
    else current.push(id);
    this.selectedMeasurementIds.set(current);
    this.syncMeasurements();
  }

  isMeasurementSelected(id: number): boolean { return this.selectedMeasurementIds().includes(id); }

  syncDataInternals() {
    // 1. PROCESS DIETS
    const diets = this.selectedDietsData().map(raw => {
      const d = raw?.diet || raw?.fullDiet || raw;
      const meals = d?.meals || [];
      
      const m = meals.map((meal: any) => {
        const items = meal.items || [];
        const variantGroups: { [key: string]: any[] } = {};
        items.forEach((item: any) => {
          const rawV = (item.variante || 'Opción 1').trim();
          const vKey = rawV.charAt(0).toUpperCase() + rawV.slice(1).toLowerCase();
          if (!variantGroups[vKey]) variantGroups[vKey] = [];
          variantGroups[vKey].push(item);
        });
        const options = Object.keys(variantGroups).sort((a,b) => a.localeCompare(b, undefined, {numeric:true, sensitivity:'base'})).map(name => {
          const vItems = variantGroups[name];
          let p=0, g=0, c=0, kcal=0, fiber=0, sodium=0, sugar=0;
          vItems.forEach((it: any) => {
             p += (it.proteina || 0); g += (it.grasas || 0); c += (it.carbohidratos || 0); kcal += (it.calorias || 0);
             fiber += (it.fibra || 0); sodium += (it.sodio || 0); sugar += (it.azucar || 0);
          });
          return { nombre: name, items: vItems, macros: { p: p.toFixed(1), g: g.toFixed(1), c: c.toFixed(1), kcal: Math.round(kcal), fiber: fiber.toFixed(1), sodium: Math.round(sodium), sugar: sugar.toFixed(1) } };
        });
        return { nombre: meal.nombre, notas: meal.notas || '', options };
      });

      let tp=0, tg=0, tc=0, tk=0, tf=0, ts=0, taz=0;
      m.forEach((mi: any) => {
        const o0 = mi.options[0]?.macros;
        if(o0) { tp += Number(o0.p); tg += Number(o0.g); tc += Number(o0.c); tk += Number(o0.kcal); tf += Number(o0.fiber); ts += Number(o0.sodium); taz += Number(o0.sugar); }
      });

      return {
        id: d.id,
        nombre: d.nombre,
        meals: m,
        totals: { kcal: Math.round(tk), p: tp.toFixed(1), g: tg.toFixed(1), c: tc.toFixed(1), fiber: tf.toFixed(1), sodium: Math.round(ts), sugar: taz.toFixed(1) },
        goals: { kcal: d.kcal_objetivo || 0, p: d.proteina_objetivo || 0, c: d.carbohidratos_objetivo || 0, g: d.grasas_objetivo || 0, fiber: d.fibra_objetivo || 0, sugar: d.azucar_objetivo || 0, sodium: d.sodio_objetivo || 0 }
      };
    });
    this.syncDiets.set(diets);
    this.syncHasNutritionData.set(diets.length > 0);

    // 2. PROCESS ROUTINES
    const routines = this.selectedRoutinesData().map(raw => {
      const r = raw?.routine || raw;
      const exercises = r?.exercises || [];
      const targetWeeks = Number(r?.semanas) || 1;
      const targetDays = Number(r?.frecuencia) || 5;
      const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Dom'];
      const weeks: any[] = [];
      
      for (let w = 1; w <= targetWeeks; w++) {
        const week = { nombre: `Semana ${w}`, days: [] as any[] };
        for (let d = 1; d <= targetDays; d++) { week.days.push({ nombre: dayNames[d-1] || `Día ${d}`, muscleGroups: [] as any[] }); }
        weeks.push(week);
      }
      
      exercises.forEach((ex: any) => {
        const wStr = String(ex.semana || '').toLowerCase();
        const weekMatch = wStr.match(/\d+/);
        let wIdx = weekMatch ? (parseInt(weekMatch[0]) - 1) : 0;
        if (wIdx < 0) wIdx = 0;
        const dStr = String(ex.dia || '').toLowerCase().trim();
        let dIdx = dayNames.findIndex(n => dStr.includes(n.toLowerCase().trim()));
        if (dIdx === -1) {
          const dayNumMatch = dStr.match(/\d+/);
          dIdx = dayNumMatch ? (parseInt(dayNumMatch[0]) - 1) : 0;
        }
        if (dIdx < 0) dIdx = 0;
        if (!weeks[wIdx]) weeks[wIdx] = { nombre: `Semana ${wIdx + 1}`, days: [] };
        if (!weeks[wIdx].days[dIdx]) weeks[wIdx].days[dIdx] = { nombre: dayNames[dIdx] || `Día ${dIdx + 1}`, muscleGroups: [] };
        const day = weeks[wIdx].days[dIdx];
        const mgName = (ex.grupo_muscular_objetivo || ex.grupo_muscular || 'General').trim();
        let mg = day.muscleGroups.find((m: any) => m.nombre === mgName);
        if (!mg) { mg = { nombre: mgName, exercises: [] }; day.muscleGroups.push(mg); }
        mg.exercises.push(ex);
      });

      const finalHierarchy = weeks.filter(w => w && w.days && w.days.some((d: any) => d && d.muscleGroups && d.muscleGroups.length > 0));
      return { 
        id: r.id, 
        nombre: r.nombre, 
        hierarchy: finalHierarchy,
        original: r
      };
    });
    this.syncRoutines.set(routines);

    // 3. PROFILE DATA
    const pat = this.patientData();
    if (pat?.fecha_nacimiento) {
      const birth = new Date(pat.fecha_nacimiento);
      let age = new Date().getFullYear() - birth.getFullYear();
      if (new Date().getMonth() < birth.getMonth()) age--;
      this.patientAge.set(age);
    } else {
      this.patientAge.set('N/A');
    }
  }

  async generateMegaPdf() { await this._runFlow(false); }
  async downloadToPc() { await this._runFlow(true); }

  private async _runFlow(askPath: boolean) {
    const dietEnabled = this.sections.diet;
    const trainEnabled = this.sections.training;
    const measEnabled = this.sections.measurements;

    if (!dietEnabled && !trainEnabled && !measEnabled) return;

    // STRICT VALIDATION BEFORE STARTING
    // VALIDATION: PREVENT EMPTY SECTIONS IF ENABLED
    if (dietEnabled && this.selectedDietsData().length === 0) { alert('ERROR: Has seleccionado Nutrición pero no hay planes elegidos.'); return; }
    if (trainEnabled && this.selectedRoutinesData().length === 0) { alert('ERROR: Has seleccionado Entrenamiento pero no hay protocolos elegidos.'); return; }
    if (measEnabled && this.selectedMeasurementIds().length === 0) { 
        alert('ERROR: Has activado Mediciones pero no has seleccionado ningún registro manual con palomita.'); 
        return; 
    }

    this.isGenerating.set(true);
    this.status.set('SINCRO_DATA_MAESTRA...');
    
    // RE-SYNC EVERYTHING TO ENSURE NO DESYNC
    this.syncDataInternals();
    this.syncMeasurements();
    this.rebuildPageList();
    this.cdr.detectChanges();

    this.status.set('ESTABILIZANDO MOTOR DE RENDER...');
    this.exportProgress.set(5);
    await new Promise(r => setTimeout(r, 5000)); // Increased for heavy training matrices
    this.cdr.detectChanges();

    this.status.set('COMPILANDO DOSSIER...');
    this.exportProgress.set(5);
    this.cdr.detectChanges();

    try {
      this.syncDataInternals(); // RE-BUILD HIERARCHY ONE LAST TIME
      this.cdr.detectChanges();
      await new Promise(r => setTimeout(r, 1500));
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const targets = this.pages().map(p => {
        if (p.id === 'cover') return ['mega-cover'];
        if (p.id === 'profile') return ['mega-profile-page'];
        if (p.id.includes('matrix')) {
           // SPECIAL CASE: Matrix page might span multiple blocks
           const rIdx = parseInt(p.id.split('-').pop() || '0');
           const matrixElements = [];
           const rItem = this.syncRoutines()[rIdx];
           if (rItem) {
             for(let j=0; j<rItem.hierarchy.length; j++) matrixElements.push(`pdf-mega-week-block-${rIdx}-${j}`);
           }
           return matrixElements;
        }
        return [p.target];
      }).flat().filter(i => !!i && !!document.getElementById(i));

      let isFirstPage = true;
      for (let i = 0; i < targets.length; i++) {
        const targetId = targets[i];
        this.status.set(`Capturando Hoja ${i + 1}...`);
        this.exportProgress.set(Math.round((i / targets.length) * 100));
        this.cdr.detectChanges();
        await new Promise(r => setTimeout(r, 600));

        const el = document.getElementById(targetId);
        if (!el) continue;

        const canvas = await html2canvas(el, { scale: 2.5, backgroundColor: (targetId.includes('training') ? '#000000' : '#ffffff'), useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const imgWidth = 210, pageHeight = 297, imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight, position = 0;

        while (heightLeft > 0) {
            if (!isFirstPage) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
            position -= pageHeight;
            isFirstPage = false;
        }
      }

      const filename = `REPORTE_${(this.patientData()?.nombres || 'ATLETA').replace(/\s+/g,'_')}_${new Date().getTime()}.pdf`;
      const buffer = new Uint8Array(pdf.output('arraybuffer'));

      if (askPath) {
        const res = await (window as any).electronAPI.generatedDocuments.saveDialog({ filename, buffer });
        if (res.ok) { this.status.set('GUARDADO EXITOSO'); this.exportProgress.set(100); this.cdr.detectChanges(); setTimeout(() => { this.isGenerating.set(false); this.onClose(); }, 1000); }
        else { this.isGenerating.set(false); this.status.set(res.error || 'Cancelado'); }
      } else {
        const res = await (window as any).electronAPI.generatedDocuments.save({ patient_id: this.patientId, nombre: filename, tipo: 'mega_report', buffer: buffer });
        if (res.ok) { this.status.set('GUARDADO EN BÓVEDA'); this.exportProgress.set(100); this.cdr.detectChanges(); await (window as any).electronAPI.generatedDocuments.open(res.data.file_path); setTimeout(() => { this.isGenerating.set(false); this.onClose(); }, 1000); }
        else throw new Error(res.error || 'Error de disco');
      }
    } catch (e: any) { this.status.set('ERROR: ' + e.message); this.isGenerating.set(false); this.cdr.detectChanges(); }
  }

  formatDate(d: any) { return d ? new Date(d).toLocaleDateString() : '--'; }
  formatMeasurementDate(d: any) { return d ? new Date(d).toLocaleDateString('es-MX', {day:'2-digit',month:'short'}) : '--'; }

  onClose() {
    this.isGenerating.set(false);
    this.status.set('');
    this.exportProgress.set(0);
    this.close.emit();
  }
}
