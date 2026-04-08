import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-exercise-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4" *ngIf="show" (click)="onClose()">
      <div class="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in"></div>
      
      <div class="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-zoom-in" (click)="$event.stopPropagation()">
        <header class="p-10 border-b border-white/5 flex items-center justify-between">
          <div class="flex items-center gap-5">
            <div class="w-2 h-10 bg-[#ef4444] rounded-full shadow-[0_0_15px_#ef4444]"></div>
            <div>
              <span class="text-[10px] font-black text-[#ef4444] uppercase tracking-[0.3em] italic">{{ initialData ? 'Sincronizar Protocolo' : 'Nuevo Registro Técnico' }}</span>
              <h2 class="text-2xl font-black text-white uppercase tracking-tighter">{{ initialData ? 'Editar Movimiento' : 'Registrar Movimiento' }}</h2>
            </div>
          </div>
          <button (click)="onClose()" class="w-12 h-12 rounded-2xl bg-white/[0.03] text-white/20 hover:text-white transition-all flex items-center justify-center border border-white/5 hover:border-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></svg>
          </button>
        </header>

        <div *ngIf="errorMessage" class="mx-10 mt-8 p-5 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-4">
          <div class="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/></svg>
          </div>
          <span class="text-[11px] font-black text-red-600 uppercase tracking-widest">{{ errorMessage }}</span>
        </div>

        <div class="p-10 space-y-10 max-h-[60vh] overflow-y-auto custom-scroll">
          <div class="space-y-3">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Denominación del Movimiento</label>
            <input type="text" class="w-full h-16 px-8 bg-white/[0.03] border border-white/10 rounded-2xl text-lg font-black text-white focus:border-[#ef4444] outline-none transition-all placeholder:text-white/10" [(ngModel)]="form.nombre" placeholder="EJ. PRESS BANCA PLANO" />
          </div>

          <div class="grid grid-cols-2 gap-8">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Sector Primario</label>
              <select class="w-full h-16 px-8 bg-white/[0.03] border border-white/10 rounded-2xl text-[13px] font-black text-white focus:border-[#ef4444] outline-none transition-all cursor-pointer appearance-none" [(ngModel)]="form.grupo_muscular">
                <option value="" class="text-black">SELECCIONAR</option>
                <option *ngFor="let m of muscles" [value]="m" class="text-black">{{ m | uppercase }}</option>
              </select>
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Co-activador</label>
              <select class="w-full h-16 px-8 bg-white/[0.03] border border-white/10 rounded-2xl text-[13px] font-black text-white focus:border-[#ef4444] outline-none transition-all cursor-pointer appearance-none" [(ngModel)]="form.musculo_secundario">
                <option value="" class="text-black">NINGUNO (SOLO)</option>
                <option *ngFor="let m of muscles" [value]="m" class="text-black">{{ m | uppercase }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-8">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Región Corporal</label>
              <select class="w-full h-16 px-8 bg-white/[0.03] border border-white/10 rounded-2xl text-[13px] font-black text-white focus:border-[#ef4444] outline-none transition-all cursor-pointer appearance-none" [(ngModel)]="form.region">
                <option value="" class="text-black">SELECCIONAR</option>
                <option value="Superior" class="text-black">SUPERIOR</option>
                <option value="Inferior" class="text-black">INFERIOR</option>
                <option value="Core" class="text-black">CORE</option>
                <option value="Full Body" class="text-black">FULL BODY</option>
              </select>
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Biomecánica de Agarre</label>
              <select class="w-full h-16 px-8 bg-white/[0.03] border border-white/10 rounded-2xl text-[13px] font-black text-white focus:border-[#ef4444] outline-none transition-all cursor-pointer appearance-none" [(ngModel)]="form.tipo_agarre">
                <option value="" class="text-black">N/A</option>
                <option value="Supinado" class="text-black">SUPINADO</option>
                <option value="Prono" class="text-black">PRONO</option>
                <option value="Neutro" class="text-black">NEUTRO</option>
                <option value="Cuerda/Especial" class="text-black">CUERDA / ESPECIAL</option>
              </select>
            </div>
          </div>

          <div class="space-y-3">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Protocolo de Ejecución Técnica</label>
            <textarea class="w-full p-8 bg-white/[0.03] border border-white/10 rounded-2xl text-md font-medium text-white/80 focus:border-[#ef4444] outline-none transition-all min-h-[160px] custom-scroll" [(ngModel)]="form.notas" placeholder="DETALLES SOBRE RANGO, CADENCIA Y CUES TÉCNICOS..."></textarea>
          </div>
        </div>

        <footer class="p-10 border-t border-white/5 flex gap-6 bg-black/40 backdrop-blur-3xl">
          <button (click)="onClose()" class="flex-1 h-14 rounded-2xl text-[12px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all border border-transparent hover:border-white/10">Cancelar</button>
          <button class="flex-1 h-14 rounded-2xl bg-[#ef4444] text-white font-black text-[12px] uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-glow active:scale-95 disabled:opacity-50" [disabled]="submitting()" (click)="onSave()">
             {{ submitting() ? 'Sincronizando...' : 'Sincronizar Protocolo' }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(239, 68, 68, 0.1); border-radius: 10px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.3); }
  `]
})
export class ExerciseFormModalComponent {
  @Input() show = false;
  @Input() initialData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  submitting = signal(false);
  errorMessage = '';

  muscles = ['Hombro', 'Biceps', 'Triceps', 'Pierna', 'Pecho', 'Espalda', 'Abdomen', 'Trapecio', 'Pantorrilla', 'Glúteo', 'Lumbar'];

  form: any = this.getEmptyForm();

  ngOnChanges() {
    if (this.initialData) {
      this.form = { ...this.initialData };
    } else {
      this.form = this.getEmptyForm();
    }
  }

  getEmptyForm() {
    return {
      nombre: '',
      grupo_muscular: '',
      musculo_secundario: '',
      region: '',
      tipo_agarre: '',
      notas: ''
    };
  }

  onClose() {
    this.errorMessage = '';
    this.close.emit();
  }

  async onSave() {
    if (!this.form.nombre) {
      this.errorMessage = 'Denominación técnica obligatoria';
      return;
    }

    this.submitting.set(true);
    try {
      let resp;
      if (this.initialData?.id) {
        resp = await (window as any).electronAPI.exercises.update({
          id: this.initialData.id,
          ...this.form
        });
      } else {
        resp = await (window as any).electronAPI.exercises.create(this.form);
      }

      if (!resp.ok) throw new Error(resp.error);
      
      // Return the created/updated exercise data
      this.saved.emit(resp.data || { ...this.form, id: resp.insertId || this.initialData?.id });
      this.onClose();
    } catch (err: any) {
      this.errorMessage = err.message || 'Error en sincronización';
    } finally {
      this.submitting.set(false);
    }
  }
}
