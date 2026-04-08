import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, computed, signal, SimpleChanges, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ComparisonSectionId = 'showSummary' | 'showTable' | 'showPhotos' | 'showTimeline';

interface ComparisonItem {
  id: string;
  title: string;
  initialId: number | null;
  finalId: number | null;
  expanded: boolean;
  sections?: ComparisonSection[];
  showSummary?: boolean;
  showTable?: boolean;
  showPhotos?: boolean;
  showTimeline?: boolean;
  [key: string]: any;
}

interface ComparisonSection {
  id: string;
  label: string;
}

@Component({
  selector: 'app-patient-comparison-v2',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './app-patient-progress-comparison.html',
  styleUrl: './app-patient-progress-comparison.scss'
})
export class PatientProgressComparisonComponent implements OnInit, OnChanges {
  @Input() patientProfile: any = null;
  @Input() measurements: any[] = [];
  @Output() pdfGenerated = new EventEmitter<void>();

  public isExporting = signal(false);
  public exportProgress = signal(0);
  public exportPage = signal(0);

  public initialMeasurementId = signal<number | null>(null);
  public finalMeasurementId = signal<number | null>(null);
  public comparisons = signal<ComparisonItem[]>([]);
  public activePdfItem = signal<ComparisonItem | null>(null);
  public activePdfMeasurements = signal<any>(null);
  public activeTimelineMeasurements = signal<any[]>([]);
  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);

  public defaultSections: ComparisonSection[] = [
    { id: 'showSummary', label: 'Resumen' },
    { id: 'showTable', label: 'Tablas' },
    { id: 'showPhotos', label: 'Fotos' },
    { id: 'showTimeline', label: 'Timeline' },
  ];

  public sortedMeasurements = computed(() => {
    if (!this.measurements) return [];
    return [...this.measurements].sort((a, b) => {
      const dateA = new Date(a.fecha || a.created_at).getTime();
      const dateB = new Date(b.fecha || b.created_at).getTime();
      return dateA - dateB;
    });
  });

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    this.refreshTimeline();
    if (this.patientProfile?.id) {
      await this.loadSavedComparisons();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['measurements']) {
      this.refreshTimeline();
    }
    if (changes['patientProfile'] && this.patientProfile?.id) {
       this.loadSavedComparisons();
    }
  }

  async loadSavedComparisons() {
    try {
      const res = await (window as any).electronAPI.comparisons.getByPatient(this.patientProfile.id);
      if (res.ok) {
        const mapped = res.data.map((c: any) => {
          const item: any = {
            id: `db-${c.id}`,
            dbId: c.id,
            title: c.title,
            initialId: c.initial_id,
            finalId: c.final_id,
            expanded: false,
            sections: [...this.defaultSections]
          };
          if (c.sections) {
             Object.assign(item, c.sections);
          } else {
             item.showSummary = true;
             item.showTable = true;
             item.showPhotos = true;
             item.showTimeline = true;
          }
          return item;
        });
        this.comparisons.set(mapped);
      }
    } catch (e) {
      console.error("Error loading comparisons", e);
    }
  }

  private refreshTimeline() {
    if (!this.measurements) return;
    this.activeTimelineMeasurements.set([...this.measurements].sort((a, b) => {
      const dateA = new Date(a.fecha || a.created_at).getTime();
      const dateB = new Date(b.fecha || b.created_at).getTime();
      return dateB - dateA;
    }));
  }

  public patientId(): number {
    return this.patientProfile?.id || 0;
  }

  public today() {
    return new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  }

  public patientName() {
    if (!this.patientProfile) return 'PACIENTE';
    const nombre = this.patientProfile.nombres || this.patientProfile.nombre || '';
    const apellido = this.patientProfile.apellido_paterno || this.patientProfile.apellido || '';
    return (nombre + ' ' + apellido).trim().toUpperCase();
  }

  public setInitialMeasurement(id: any) { this.initialMeasurementId.set(id); }
  public setFinalMeasurement(id: any) { this.finalMeasurementId.set(id); }

  public async addComparison() {
    const iId = this.initialMeasurementId();
    const fId = this.finalMeasurementId();
    
    if (!iId) { this.errorMessage.set("SELECCIÓN REQUERIDA: Defina la medición de ORIGEN."); return; }
    if (!fId) { this.errorMessage.set("SELECCIÓN REQUERIDA: Defina la medición de DESTINO."); return; }
    if (Number(iId) === Number(fId)) { this.errorMessage.set("OPERACIÓN INVÁLIDA: No es posible comparar una medición contra sí misma."); return; }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const initial = this.measurements.find(m => Number(m.id) === Number(iId));
    const final = this.measurements.find(m => Number(m.id) === Number(fId));
    
    if (!initial || !final) {
      this.errorMessage.set("ERROR TÉCNICO: Una de las mediciones seleccionadas ya no está disponible.");
      this.isLoading.set(false);
      return;
    }
    
    const title = `${this.formatDate(initial.fecha)} -> ${this.formatDate(final.fecha)}`;
    const sections = {
      showSummary: true,
      showTable: true,
      showPhotos: true,
      showTimeline: true
    };

    try {
      const res = await (window as any).electronAPI.comparisons.create({
        patient_id: this.patientId(),
        title,
        initial_id: iId,
        final_id: fId,
        sections: sections
      });
      
      if (res.ok) {
        await this.loadSavedComparisons();
        setTimeout(() => {
          const newList = this.comparisons();
          if (newList.length > 0) {
              this.toggleComparison(newList[0].id);
          }
        }, 100);
        this.initialMeasurementId.set(null);
        this.finalMeasurementId.set(null);
      }
    } catch (e: any) {
      console.error("Error saving comparison", e);
      this.errorMessage.set(e.message || "Error al persistir la comparativa.");
    } finally {
      this.isLoading.set(false);
    }
  }

  public toggleComparison(id: string) {
    this.comparisons.update(list => list.map(item => item.id === id ? { ...item, expanded: !item.expanded } : item));
  }

  public async removeComparison(item: ComparisonItem) {
    const confirmed = confirm('¿Eliminar esta comparativa guardada?');
    if (!confirmed) return;
    if (item['dbId']) {
      try {
        const res = await (window as any).electronAPI.comparisons.delete(item['dbId']);
        if (res.ok) await this.loadSavedComparisons();
      } catch (e) { console.error("Error deleting comparison", e); }
    } else {
      this.comparisons.update(list => list.filter(i => i.id !== item.id));
    }
  }

  public updateComparisonTitle(id: string, title: string) {
    this.comparisons.update(list => list.map(item => item.id === id ? { ...item, title } : item));
  }

  public toggleComparisonSection(itemId: string, sectionId: string) {
    this.comparisons.update(list => list.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, [sectionId]: !item[sectionId] };
    }));
  }

  public onDropReport(event: CdkDragDrop<ComparisonItem[]>) {
    this.comparisons.update(list => {
      const arr = [...list];
      moveItemInArray(arr, event.previousIndex, event.currentIndex);
      return arr;
    });
  }

  public onReorderSections(item: ComparisonItem, event: CdkDragDrop<ComparisonSection[]>) {
    this.comparisons.update(list => list.map(c => {
      if (c.id !== item.id) return c;
      const sections = [...(c.sections || this.defaultSections)];
      moveItemInArray(sections, event.previousIndex, event.currentIndex);
      return { ...c, sections };
    }));
  }

  public getComparisonMeasurements(item: ComparisonItem): { initial: any; final: any } {
    return {
      initial: this.measurements.find(m => Number(m.id) === Number(item.initialId)) || null,
      final: this.measurements.find(m => Number(m.id) === Number(item.finalId)) || null,
    };
  }

  public getPhotos(m: any): any[] { return m?.fotos || []; }

  public getComparisonSummary(item: ComparisonItem): any[] {
    const { initial, final } = this.getComparisonMeasurements(item);
    if (!initial || !final) return [];
    const diff = (a: any, b: any) => (b != null && a != null) ? parseFloat((b - a).toFixed(2)) : null;
    const items = [
      { label: 'Peso', value: this.formatSignedValue(diff(initial.peso_kg, final.peso_kg), 'kg'), raw: diff(initial.peso_kg, final.peso_kg) },
      { label: 'Masa Magra', value: this.formatSignedValue(diff(initial.masa_magra, final.masa_magra), 'kg'), raw: diff(initial.masa_magra, final.masa_magra) },
      { label: 'Grasa Corporal', value: this.formatSignedValue(diff(initial.grasa_corporal, final.grasa_corporal), '%'), raw: diff(initial.grasa_corporal, final.grasa_corporal) },
      { label: 'IMC', value: this.formatSignedValue(diff(initial.imc, final.imc), ''), raw: diff(initial.imc, final.imc) },
      { label: 'Cintura', value: this.formatSignedValue(diff(initial.cintura, final.cintura), 'cm'), raw: diff(initial.cintura, final.cintura) },
      { label: 'Cadera', value: this.formatSignedValue(diff(initial.cadera, final.cadera), 'cm'), raw: diff(initial.cadera, final.cadera) },
    ];
    return items.map(i => ({ ...i, status: this.getMetricStatus(i.label, i.raw) })).filter(c => c.value !== '—');
  }

  public getMetricStatus(label: string, diff: number | null): 'positive' | 'warning' | 'neutral' {
    if (diff === null || diff === 0) return 'neutral';
    const labelLower = label.toLowerCase();
    if (labelLower.includes('peso') || labelLower.includes('grasa') || labelLower.includes('imc') || labelLower.includes('cintura') || labelLower.includes('cadera')) {
      return diff < 0 ? 'positive' : 'warning';
    }
    if (labelLower.includes('masa magra') || labelLower.includes('masa muscular') || labelLower.includes('fuerza')) {
      return diff > 0 ? 'positive' : 'warning';
    }
    return 'neutral';
  }

  public getMetricEvaluation(label: string, diff: number | null, percent: number | null): string {
    if (diff === null || diff === 0) return 'ESTABLE';
    const status = this.getMetricStatus(label, diff);
    const absPercent = Math.abs(percent || 0);
    if (label.toLowerCase().includes('masa magra') && diff < -2) return 'PÉRDIDA CRÍTICA';
    if (label.toLowerCase().includes('grasa') && diff < -1) return 'REDUCCIÓN EFECTIVA';
    if (label.toLowerCase().includes('peso')) {
       if (diff < -5) return 'DESCENSO AGRESIVO';
       if (diff < 0) return 'ÓPTIMO DESCENSO';
       return 'AUMENTO DE CARGA';
    }
    if (status === 'positive') return absPercent > 5 ? 'MEJORA SIGNIFICATIVA' : 'PROGRESO POSITIVO';
    if (status === 'warning') return absPercent > 5 ? 'AJUSTE REQUERIDO' : 'PRECAUCIÓN';
    return 'EN RANGO';
  }

  public generateBiologicalAnalysis(initial: any, final: any): string {
    if (!initial || !final) return 'DATOS INSUFICIENTES PARA ANÁLISIS BIO-MÉTRICO.';
    const pesoDiff = (final.peso_kg || 0) - (initial.peso_kg || 0);
    const magraDiff = (final.masa_magra || 0) - (initial.masa_magra || 0);
    const grasaDiff = (final.grasa_corporal || 0) - (initial.grasa_corporal || 0);
    let analysis = "";
    if (pesoDiff < -2) {
      analysis += `El atleta presenta una reducción significativa de peso (${pesoDiff.toFixed(1)} kg). `;
      if (magraDiff < -2) analysis += `Se observa una pérdida de masa magra de ${Math.abs(magraDiff).toFixed(1)} kg, déficit excesivo. `;
      else if (magraDiff >= 0) analysis += `Pérdida de tejido graso con preservación de masa magra (recomposición óptima). `;
    } else if (pesoDiff > 2) {
      analysis += `Aumento de peso corporal (+${pesoDiff.toFixed(1)} kg). `;
      if (magraDiff > 1) analysis += `Ganancia de masa magra, superávit nutricional bien aprovechado. `;
      else analysis += `Aumento de peso sin ganancia de masa magra, riesgo de acumulación lipídica. `;
    } else {
      analysis += `Peso corporal estable (${pesoDiff > 0 ? '+' : ''}${pesoDiff.toFixed(1)} kg). `;
      if (grasaDiff < -1 && magraDiff > 0.5) analysis += `Recomposición positiva: grasa ↓ masa muscular ↑. `;
    }
    return analysis.trim() || "TENDENCIA BIOLÓGICA ESTABLE.";
  }

  public getExecutiveStats(item: ComparisonItem): any[] {
    const { initial, final } = this.getComparisonMeasurements(item);
    if (!initial || !final) return [];
    const makeRow = (label: string, key: string, suffix: string) => {
      const i = initial[key]; const f = final[key];
      const diff = (i != null && f != null) ? parseFloat((f - i).toFixed(2)) : null;
      const percent = (i && f && i !== 0) ? parseFloat(((f - i) / Math.abs(i) * 100).toFixed(1)) : null;
      return { label, final: f, diff, percent, suffix, status: this.getMetricStatus(label, diff) };
    };
    return [
      makeRow('Peso', 'peso_kg', 'kg'), makeRow('Masa Magra', 'masa_magra', 'kg'),
      makeRow('Grasa Corporal', 'grasa_corporal', '%'), makeRow('IMC', 'imc', ''),
      makeRow('Cintura', 'cintura', 'cm'), makeRow('Cadera', 'cadera', 'cm'),
    ];
  }

  public getCategorizedComparisonRows(item: ComparisonItem): { category: string; rows: any[] }[] {
    const { initial, final } = this.getComparisonMeasurements(item);
    if (!initial || !final) return [];
    const makeRow = (label: string, key: string, suffix: string) => {
      const i = initial[key]; const f = final[key];
      const diff = (i != null && f != null) ? parseFloat((f - i).toFixed(2)) : null;
      const percent = (i && f && i !== 0) ? parseFloat(((f - i) / Math.abs(i) * 100).toFixed(1)) : null;
      return { label, initialValue: i, finalValue: f, diff, percent, suffix, 
               status: this.getMetricStatus(label, diff), 
               evaluation: this.getMetricEvaluation(label, diff, percent) };
    };
    return [
      { category: 'COMPOSICIÓN CORPORAL', rows: [makeRow('Peso', 'peso_kg', 'kg'), makeRow('IMC', 'imc', ''), makeRow('Masa Magra', 'masa_magra', 'kg'), makeRow('Masa Muscular', 'masa_muscular', 'kg'), makeRow('Grasa Corporal', 'grasa_corporal', '%')] },
      { category: 'MEDIDAS ESTRUCTURALES', rows: [makeRow('Cintura', 'cintura', 'cm'), makeRow('Cadera', 'cadera', 'cm'), makeRow('Cuello', 'cuello', 'cm'), makeRow('Pecho/Espalda', 'pecho_espalda', 'cm')] },
      { category: 'EXTREMIDADES', rows: [makeRow('Brazo Derecho', 'brazo_derecho', 'cm'), makeRow('Brazo Izquierdo', 'brazo_izquierdo', 'cm'), makeRow('Pierna Derecha', 'pierna_derecha', 'cm'), makeRow('Pierna Izquierda', 'pierna_izquierda', 'cm')] }
    ];
  }

  public getComparisonRows(item: ComparisonItem): any[] {
    const { initial, final } = this.getComparisonMeasurements(item);
    if (!initial || !final) return [];
    const makeRow = (label: string, key: string, suffix: string) => {
      const i = initial[key]; const f = final[key];
      const diff = (i != null && f != null) ? parseFloat((f - i).toFixed(2)) : null;
      const percent = (i && f && i !== 0) ? parseFloat(((f - i) / Math.abs(i) * 100).toFixed(1)) : null;
      return { label, initialValue: i, finalValue: f, diff, percent, suffix, status: this.getMetricStatus(label, diff), evaluation: this.getMetricEvaluation(label, diff, percent) };
    };
    return [
      makeRow('Peso', 'peso_kg', 'kg'), makeRow('IMC', 'imc', ''),
      makeRow('Masa Magra', 'masa_magra', 'kg'), makeRow('Masa Muscular', 'masa_muscular', 'kg'),
      makeRow('Grasa Corporal', 'grasa_corporal', '%'), makeRow('Cuello', 'cuello', 'cm'),
      makeRow('Pecho/Espalda', 'pecho_espalda', 'cm'), makeRow('Cintura', 'cintura', 'cm'),
      makeRow('Cadera', 'cadera', 'cm'), makeRow('Brazo Derecho', 'brazo_derecho', 'cm'),
      makeRow('Brazo Izquierdo', 'brazo_izquierdo', 'cm'), makeRow('Pierna Derecha', 'pierna_derecha', 'cm'),
      makeRow('Pierna Izquierda', 'pierna_izquierda', 'cm'),
    ];
  }

  public formatDate(fecha: any): string {
    if (!fecha) return '—';
    try {
      const d = new Date(fecha + 'T12:00:00');
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    } catch { return String(fecha); }
  }

  public formatValue(val: any, suffix: string): string {
    if (val == null) return '—';
    return `${val}${suffix ? ' ' + suffix : ''}`;
  }

  public formatSignedValue(val: any, suffix: string): string {
    if (val == null) return '—';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val}${suffix ? ' ' + suffix : ''}`;
  }

  public formatPercent(val: any): string {
    if (val == null) return '—';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val}%`;
  }

  public calcBodyFat(m: any): string {
    if (!m) return '—';
    if (m.grasa_corporal != null) return `${m.grasa_corporal}%`;
    if (m.peso_kg && m.masa_magra && m.peso_kg > 0) {
      return `${((m.peso_kg - m.masa_magra) / m.peso_kg * 100).toFixed(1)}%`;
    }
    return '—';
  }

  public async exportComparisonPdf(item: ComparisonItem) {
    this.activePdfItem.set(item);
    this.isExporting.set(true);
    this.exportProgress.set(10);
    this.exportPage.set(0);
    const { initial, final } = this.getComparisonMeasurements(item);
    const fileName = `COMPARATIVA_${this.formatDate(initial?.fecha)}_vs_${this.formatDate(final?.fecha)}.pdf`;
    this.activePdfMeasurements.set({ initial, final });
    this.cdr.detectChanges();
    const potentialPageIds = ['pdf-page-summary', 'pdf-page-table', 'pdf-page-photos'];
    setTimeout(async () => {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        let capturedPages = 0;
        for (const id of potentialPageIds) {
          const pageEl = document.getElementById(id);
          if (!pageEl) continue;
          this.exportPage.update(p => p + 1);
          this.exportProgress.set(20 + (capturedPages * 25));
          this.cdr.detectChanges();
          const canvas = await html2canvas(pageEl, { 
            scale: 2.2, useCORS: true, allowTaint: true, logging: false, 
            backgroundColor: '#000000', width: 850, height: 1200
          });
          if (capturedPages > 0) pdf.addPage();
          pdf.setFillColor(0, 0, 0); pdf.rect(0, 0, 210, 297, 'F');
          const imgData = canvas.toDataURL('image/jpeg', 0.90);
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
          capturedPages++;
        }
        if (capturedPages === 0) {
            this.errorMessage.set("ERROR: No se seleccionaron secciones para el reporte.");
            this.isExporting.set(false);
            return;
        }
        const pdfBuffer = pdf.output('arraybuffer');
        pdf.save(fileName);
        await (window as any).electronAPI.generatedDocuments.save({
          patient_id: this.patientId(), nombre: fileName, tipo: 'pdf_progress',
          buffer: Array.from(new Uint8Array(pdfBuffer)),
          metadata: { initial_date: initial?.fecha, final_date: final?.fecha, generated_at: new Date().toISOString() }
        });
        this.pdfGenerated.emit();
      } catch (error) { console.error('Error in Comparison PDF:', error); }
      finally {
        this.isExporting.set(false); this.exportProgress.set(0); this.exportPage.set(0);
        this.activePdfItem.set(null); this.activePdfMeasurements.set(null);
        this.cdr.detectChanges();
      }
    }, 1500);
  }

  public async exportSingleMeasurementPdf(measurement: any) {
    if (!measurement) return;
    this.isExporting.set(true); this.exportProgress.set(30); this.cdr.detectChanges();
    const fileName = `REPORTE_${measurement.fecha || 'N'}.pdf`;
    setTimeout(async () => {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.setFillColor(5, 5, 6); pdf.rect(0, 0, 210, 297, 'F');
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(18);
        pdf.text('REPORTE BIOMETRICO', 20, 25);
        pdf.save(fileName);
        const pdfBuffer = pdf.output('arraybuffer');
        await (window as any).electronAPI.invoke('generated-documents:save', {
          patient_id: this.patientId(), nombre: fileName, tipo: 'pdf_progress',
          buffer: Array.from(new Uint8Array(pdfBuffer))
        });
        this.pdfGenerated.emit();
      } catch (e) {
        console.error(e);
      } finally {
        this.isExporting.set(false); this.exportProgress.set(0); this.cdr.detectChanges();
      }
    }, 500);
  }
}