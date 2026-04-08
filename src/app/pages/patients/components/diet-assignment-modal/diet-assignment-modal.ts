import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, computed, signal } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-diet-assignment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './diet-assignment-modal.html',
  styleUrl: './diet-assignment-modal.scss'
})
export class DietAssignmentModalComponent implements OnChanges {
  @Input() open = false;
  @Input() patientId: number | null = null;
  @Input() dietToEdit?: any;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dietToEdit'] && this.dietToEdit) {
      this.populateFormWithDiet(this.dietToEdit);
    }
  }

  private populateFormWithDiet(raw: any) {
    if (!raw) return;
    const diet = raw.diet || raw;
    const mealsArray = raw.meals || diet.meals || [];

    this.dietForm = {
      nombre: diet.nombre || '',
      objetivo: diet.objetivo || '',
      notas: diet.notas || '',
      fecha: diet.fecha || (diet.created_at ? diet.created_at.split(/[T ]/)[0] : new Date().toISOString().split('T')[0]),
      tipo_plan: diet.tipo_plan || 'Técnico v4',
      kcal_objetivo: diet.calorias_objetivo || diet.calorias_totales || 2000,
      proteina_objetivo: diet.proteina_objetivo || diet.proteina_total || 150,
      carbs_objetivo: diet.carbs_objetivo || diet.carbohidratos_total || 250,
      grasas_objetivo: diet.grasas_objetivo || diet.grasas_total || 60,
      fibra_objetivo: diet.fibra_objetivo || 30,
      sodio_objetivo: diet.sodio_objetivo || 2300,
      azucar_objetivo: diet.azucar_objetivo || 50
    };

    if (mealsArray && Array.isArray(mealsArray)) {
      this.meals = mealsArray.map((m: any) => {
        const items = m.items || [];
        const variantGroups: { [key: string]: any[] } = {};

        // Robust Grouping Logic: Prevents loss of variants due to naming inconsistencies
        items.forEach((item: any) => {
          const rawV = (item.variante || 'Opción 1').trim();
          const vKey = rawV.charAt(0).toUpperCase() + rawV.slice(1).toLowerCase();
          if (!variantGroups[vKey]) variantGroups[vKey] = [];
          
          variantGroups[vKey].push({
            food_id: item.food_id,
            food_original: {
               id: item.food_id,
               nombre: item.food_nombre || item.nombre,
               calorias: item.food_kcal,
               proteina: item.food_proteina,
               carbohidratos: item.food_carbohidratos,
               grasas: item.food_grasas,
               fibra: item.food_fibra,
               sodio: item.food_sodio,
               azucar: item.food_azucar,
               unidad: item.food_unidad
            },
            nombre: item.food_nombre || item.nombre,
            cantidad: item.cantidad,
            unidad: item.unidad_personalizada || item.unidad,
            calorias: item.calorias,
            proteina: item.proteina,
            carbohidratos: item.carbohidratos,
            grasas: item.grasas,
            fibra: item.fibra || 0,
            sodio: item.sodio || 0,
            azucar: item.azucar || 0,
            notas: item.notas
          });
        });

        const options = Object.keys(variantGroups).sort((a,b) => a.localeCompare(b, undefined, {numeric:true, sensitivity:'base'})).map(name => ({
          nombre: name,
          items: variantGroups[name]
        }));

        return {
          nombre: m.nombre,
          notas: m.notas || '',
          options: options.length > 0 ? options : [{ nombre: 'Opción 1', items: [] }]
        };
      });
    }
    this.cdr.detectChanges();
  }

  dropMeal(event: CdkDragDrop<any[]>) { moveItemInArray(this.meals, event.previousIndex, event.currentIndex); }
  dropOption(mealIndex: number, event: CdkDragDrop<any[]>) { moveItemInArray(this.meals[mealIndex].options, event.previousIndex, event.currentIndex); }

  patientData = signal<any>(null);
  dietForm = { nombre: '', objetivo: '', notas: '', fecha: new Date().toISOString().split('T')[0], tipo_plan: '', kcal_objetivo: 2000, proteina_objetivo: 150, carbs_objetivo: 200, grasas_objetivo: 70, fibra_objetivo: 30, sodio_objetivo: 2000, azucar_objetivo: 50 };
  
  showNoteModal = signal(false);
  editingNoteIndex = signal<number | null>(null);
  tempNote = signal('');

  openNoteEditor(index: number) { this.editingNoteIndex.set(index); this.tempNote.set(this.meals[index].notas || ''); this.showNoteModal.set(true); }
  saveNote() { const idx = this.editingNoteIndex(); if (idx !== null) this.meals[idx].notas = this.tempNote(); this.showNoteModal.set(false); }

  meals: any[] = [
    { nombre: 'Desayuno', notas: '', options: [ { nombre: 'Opción 1', items: [] } ] },
    { nombre: 'Comida', notas: '', options: [ { nombre: 'Opción 1', items: [] } ] },
    { nombre: 'Cena', notas: '', options: [ { nombre: 'Opción 1', items: [] } ] }
  ];

  foodSearch = signal('');
  searchResults = signal<any[]>([]);
  loadingSearch = signal(false);
  saving = signal(false);
  isExporting = signal(false);
  exportProgress = signal(0);
  measurementsHistory: any[] = [];

  onClose() { this.close.emit(); }
  addMeal() { this.meals.push({ nombre: 'Nueva Comida', notas: '', options: [{ nombre: 'Opción 1', items: [] }] }); }
  addOptionToMeal(mealIndex: number) {
    const existingNum = this.meals[mealIndex].options.length + 1;
    this.meals[mealIndex].options.push({ nombre: `Opción ${existingNum}`, items: [] });
  }
  removeOption(mealIndex: number, optionIndex: number) { this.meals[mealIndex].options.splice(optionIndex, 1); if (this.meals[mealIndex].options.length === 0) this.meals.splice(mealIndex, 1); }
  removeMeal(index: number) { this.meals.splice(index, 1); }

  async searchFoods(query: string) {
    this.foodSearch.set(query);
    if (query.length < 2) { this.searchResults.set([]); return; }
    try {
      this.loadingSearch.set(true);
      const res = await (window as any).electronAPI.foods.search(query);
      this.searchResults.set(res.ok ? res.data : []);
    } catch (err) { console.error(err); } finally { this.loadingSearch.set(false); }
  }

  addItemToMeal(mealIndex: number, optionIndex: number, food: any) {
    const porcionBase = Number(food.porcion_base) || 100;
    this.meals[mealIndex].options[optionIndex].items.push({
      food_id: food.id, food_original: food, nombre: food.nombre, cantidad: porcionBase, unidad: food.unidad || 'g',
      calorias: food.calorias, proteina: food.proteina, carbohidratos: food.carbohidratos, grasas: food.grasas,
      fibra: food.fibra || 0, sodio: food.sodio || 0, azucar: food.azucar || 0, equivalentes: 1
    });
    this.foodSearch.set(''); this.searchResults.set([]);
  }

  getOptionMacros(mealIndex: number, optionIndex: number) {
    let k = 0, p = 0, c = 0, g = 0, fi = 0, s = 0, a = 0;
    const items = this.meals[mealIndex].options[optionIndex].items;
    items.forEach((i: any) => { k += Number(i.calorias)||0; p += Number(i.proteina)||0; c += Number(i.carbohidratos)||0; g += Number(i.grasas)||0; fi += Number(i.fibra)||0; s += Number(i.sodio)||0; a += Number(i.azucar)||0; });
    return { kcal: k, proteina: p, carbs: c, grasas: g, fibra: fi, sodio: s, azucar: a };
  }

  resolveMacro(food: any, macro: string): number {
    const fallbacks: { [key: string]: string[] } = {
      'kcal': ['kcal_100g', 'kcal', 'calorias', 'calories'],
      'proteina': ['proteina_100g', 'proteina', 'protein'],
      'carbohidratos': ['carbohidratos_100g', 'carbohidratos', 'carbs', 'carbohydrates'],
      'grasas': ['grasas_100g', 'grasas', 'fat', 'fats'],
      'fibra': ['fibra_100g', 'fibra', 'fiber'],
      'sodio': ['sodio_100g', 'sodio', 'sodium'],
      'azucar': ['azucar_100g', 'azucar', 'azucares', 'sugar', 'sugars']
    };
    const keys = fallbacks[macro] || [macro];
    for (const key of keys) { if (food[key] !== undefined && food[key] !== null) return Number(food[key]); }
    return 0;
  }

  calcMacro(valPorcion: any, qty: number, porcionBase: number): number {
    if (!valPorcion || !porcionBase) return 0;
    return Number(((Number(valPorcion) * qty) / porcionBase).toFixed(2));
  }

  updateItemMacros(item: any) {
    const food = item.food_original; if (!food) return;
    const qty = Number(item.cantidad) || 0; const pb = Number(food.porcion_base) || 100;
    item.calorias = this.calcMacro(this.resolveMacro(food, 'kcal'), qty, pb);
    item.proteina = this.calcMacro(this.resolveMacro(food, 'proteina'), qty, pb);
    item.carbohidratos = this.calcMacro(this.resolveMacro(food, 'carbohidratos'), qty, pb);
    item.grasas = this.calcMacro(this.resolveMacro(food, 'grasas'), qty, pb);
    item.fibra = this.calcMacro(this.resolveMacro(food, 'fibra'), qty, pb);
    item.sodio = this.calcMacro(this.resolveMacro(food, 'sodio'), qty, pb);
    item.azucar = this.calcMacro(this.resolveMacro(food, 'azucar'), qty, pb);
    item.equivalentes = Number((qty / pb).toFixed(2));
  }

  formatPdfDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-'); if (parts.length !== 3) return dateStr;
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  }

  get currentTotals() {
    let tot = { kcal: 0, p: 0, c: 0, g: 0, f: 0, s: 0, a: 0 };
    this.meals.forEach((m, i) => { if (m.options.length > 0) { const primary = this.getOptionMacros(i, 0); tot.kcal += primary.kcal; tot.p += primary.proteina; tot.c += primary.carbs; tot.g += primary.grasas; tot.f += primary.fibra; tot.s += primary.sodio; tot.a += primary.azucar; } });
    return { kcal: tot.kcal, proteina: tot.p, carbs: tot.c, grasas: tot.g, fibra: tot.f, sodio: tot.s, azucar: tot.a };
  }

  getStatusColor(current: number, target: number): string {
    if (!target || target === 0) return 'text-white/40';
    if (current > target * 1.05) return 'text-red-500';
    if (current >= target * 0.9) return 'text-emerald-500';
    return 'text-amber-500';
  }

  removeItemFromMeal(mealIndex: number, optionIndex: number, itemIndex: number) { this.meals[mealIndex].options[optionIndex].items.splice(itemIndex, 1); }

  async onSave() {
    if (!this.dietForm.nombre || !this.patientId) { alert('Nombre requerido.'); return; }
    try {
      this.saving.set(true);
      const sanitized = this.meals.map(m => ({ ...m, options: m.options.map((o: any) => ({ ...o, items: (o.items || []).filter((i: any) => i.food_id != null) })) }));
      const payload = { patient_id: this.patientId, nombre: this.dietForm.nombre, fecha: this.dietForm.fecha, objetivo: this.dietForm.nombre, calorias_objetivo: this.dietForm.kcal_objetivo, proteina_objetivo: this.dietForm.proteina_objetivo, carbs_objetivo: this.dietForm.carbs_objetivo, grasas_objetivo: this.dietForm.grasas_objetivo, fibra_objetivo: this.dietForm.fibra_objetivo, sodio_objetivo: this.dietForm.sodio_objetivo, azucar_objetivo: this.dietForm.azucar_objetivo, meals: sanitized };
      const dietId = this.dietToEdit?.diet?.id || this.dietToEdit?.id;
      let res = dietId ? await (window as any).electronAPI.diets.updateFull({ id: dietId, ...payload }) : await (window as any).electronAPI.diets.createFull(payload);
      if (!res.ok) throw new Error(res.error);
      this.saved.emit(); this.onClose();
    } catch (err) { console.error(err); } finally { this.saving.set(false); }
  }

  async exportPdf() {
    if (!this.dietForm.nombre) { 
      alert("⚠️ ASIGNACIÓN INCOMPLETA: El nombre de la dieta es requerido.");
      this.isExporting.set(false);
      return;
    }

    const hasAnyFood = this.meals.some(m => m.options.some((o: any) => o.items.length > 0));
    if (!hasAnyFood) {
      alert("🚫 REPORTE BLOQUEADO: No se pueden exportar planes sin alimentos (Matriz vacía).");
      this.isExporting.set(false);
      return;
    }

    if (this.patientId) {
      const res = await (window as any).electronAPI.patients.getProfile(this.patientId);
      if (res.ok) {
        this.patientData.set(res.data.patient);
        this.measurementsHistory = res.data.measurements || [];
      }
    }

    this.isExporting.set(true);
    this.exportProgress.set(10);
    this.cdr.detectChanges();

    const pageIds = [ 'pdf-diet-master', 'pdf-diet-breakdown', 'pdf-diet-recommendations', 'pdf-diet-reference' ];

    setTimeout(async () => {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        let firstPage = true;

        for (let i = 0; i < pageIds.length; i++) {
          this.exportProgress.set(20 + (i * 20));
          this.cdr.detectChanges();
          
          const el = document.getElementById(pageIds[i]);
          if (!el) continue;

          // CAPTURE AT HIGH RESOLUTION
          const canvas = await html2canvas(el, { scale: 2.5, useCORS: true, logging: false, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          
          const imgWidth = 210; 
          const pageHeight = 297; 
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          // SMART SLICER for Individual PDF (prevents content loss if many meals/variants exist)
          while (heightLeft > 0) {
              if (!firstPage) pdf.addPage();
              pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
              heightLeft -= pageHeight;
              position -= pageHeight;
              firstPage = false;
          }
        }

        const fileName = `PLAN_NUTRICIONAL_${(this.patientData()?.nombres || 'CLIENTE').replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        this.exportProgress.set(100);
      } catch (err: any) { alert('Error: ' + err.message); } finally { setTimeout(() => { this.isExporting.set(false); this.exportProgress.set(0); }, 500); }
    }, 400);
  }
}
