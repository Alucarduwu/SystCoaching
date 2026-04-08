import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExerciseFormModalComponent } from './exercise-form-modal/exercise-form-modal';

export interface ExerciseItem {
  id: number;
  nombre: string;
  grupo_muscular?: string | null;
  musculo_secundario?: string | null;
  region?: string | null;
  tipo_agarre?: string | null;
  notas?: string | null;
}

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, ExerciseFormModalComponent],
  template: `
    <section class="page-shell h-screen overflow-hidden bg-transparent text-white p-8 animate-fade-in relative z-10 flex flex-col">
      <!-- Compact Header Container -->
      <div class="shrink-0 bg-[#050505]/80 backdrop-blur-md pb-6">
        <header class="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 pt-2">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3 border-l-4 border-[#ef4444] pl-5">
              <h1 class="text-3xl font-black text-white uppercase tracking-tighter leading-none">Biblioteca Técnica</h1>
            </div>
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 ml-5">Protocolos de ejecución y biomecánica pro</p>
          </div>

          <button
            type="button"
            class="h-11 px-8 rounded-xl bg-[#ef4444] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg active:scale-95 flex items-center gap-3"
            (click)="openCreateModal()"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5v15m7.5-7.5h-15" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" />
            </svg>
            Nuevo Ejercicio
          </button>
        </header>

        <!-- Compact Search Toolbar -->
        <div class="flex flex-col sm:flex-row gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
          <div class="flex items-center gap-4 flex-1">
             <div class="w-1 h-5 bg-[#ef4444] rounded-full shadow-[0_0_10px_#ef4444]"></div>
             <h2 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Catálogo de Movimientos</h2>
          </div>

          <!-- Region Filter Select -->
          <div class="relative w-full md:w-48 group">
            <select 
              [ngModel]="regionFilter()" 
              (ngModelChange)="regionFilter.set($event)"
              class="w-full h-11 px-6 bg-white/[0.03] border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-[#ef4444]/30 transition-all cursor-pointer appearance-none shadow-xl"
            >
              <option value="Todas" class="text-black">Todas las Zonas</option>
              <option value="Superior" class="text-black">Superior</option>
              <option value="Inferior" class="text-black">Inferior</option>
              <option value="Core" class="text-black">Core</option>
              <option value="Full Body" class="text-black">Full Body</option>
            </select>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
               <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m19.5 8.25-7.5 7.5-7.5-7.5" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></svg>
            </div>
          </div>

          <div class="relative w-full md:w-80 group">
            <input
              type="text"
              class="w-full h-11 pl-11 pr-5 bg-white/[0.03] border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest focus:border-[#ef4444]/30 focus:bg-white/[0.05] transition-all outline-none placeholder:text-white/20"
              placeholder="Buscar por movimiento..."
              [ngModel]="search()"
              (ngModelChange)="setSearch($event)"
            />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-[#ef4444] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Scrollable Library Grid -->
      <div class="flex-1 overflow-y-auto custom-scroll pr-4 pb-20 mt-8">
        <div class="animate-fade-in relative z-10">
          <div *ngIf="loading()" class="py-24 flex flex-col items-center justify-center gap-4">
            <div class="w-12 h-12 border-2 border-white/5 border-t-[#ef4444] rounded-full animate-spin"></div>
            <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest">Consultando protocolos técnicos...</p>
          </div>

          <div *ngIf="errorMessage()" class="mb-8 p-5 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl text-[#ef4444] text-[11px] font-bold uppercase tracking-wide flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/></svg>
            ERROR: {{ errorMessage() }}
          </div>

          <div *ngIf="!loading() && filteredExercises().length === 0" class="py-32 flex flex-col items-center justify-center text-center bg-[#0a0a0a] border border-white/5 rounded-3xl">
            <div class="text-5xl mb-6 opacity-20">🏋️‍♂️</div>
            <h3 class="text-sm font-black text-white uppercase tracking-widest mb-1">Cámara de Vacío</h3>
            <p class="text-[11px] text-white/30 uppercase tracking-widest">No se han detectado registros técnicos en esta búsqueda.</p>
          </div>

          <!-- Exercise Cards Grid -->
          <div *ngIf="!loading() && filteredExercises().length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <article 
              *ngFor="let exe of filteredExercises()"
              class="group relative bg-[#0a0a0a] border border-white/5 border-l-4 border-l-[#ef4444] rounded-xl p-5 hover:bg-[#111111] transition-all duration-300 cursor-pointer flex flex-col min-h-[140px] shadow-2xl active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden" 
              (click)="openEditModal(exe)"
            >
              <!-- Decorative Background Glow -->
              <div class="absolute -top-10 -right-10 w-32 h-32 bg-[#ef4444]/5 blur-[60px] group-hover:bg-[#ef4444]/10 transition-all duration-500 opacity-60"></div>
 
              <div class="flex items-center justify-between mb-4 relative z-10">
                <div class="flex flex-col gap-1">
                  <h3 class="text-lg font-black text-white uppercase tracking-tighter leading-none group-hover:text-[#ef4444] transition-colors truncate max-w-[200px]">
                    {{ exe.nombre }}
                  </h3>
                  <div class="flex items-center gap-2">
                    <span class="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none">ID-{{ 1000 + exe.id }}</span>
                  </div>
                </div>
                <!-- Muscle Group Tag -->
                <div class="flex flex-col items-end gap-1">
                  <div class="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-md">
                     <span class="text-[9px] font-black text-slate-400 tracking-wider uppercase leading-none">{{ exe.grupo_muscular || 'Gral' }}</span>
                  </div>
                  <div *ngIf="exe.musculo_secundario" class="px-2 py-0.5 bg-white/[0.01] border border-white/5 rounded-sm">
                     <span class="text-[7px] font-black text-slate-600 tracking-widest uppercase leading-none">+ {{ exe.musculo_secundario }}</span>
                  </div>
                </div>
              </div>
 
              <!-- Compact Technical Data -->
              <div class="flex items-center gap-5 mb-4 relative z-10 p-2 bg-white/[0.01] border border-white/5 rounded-lg group-hover:bg-white/[0.03] transition-all">
                <div class="flex flex-col">
                  <span class="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Carga</span>
                  <span class="text-[11px] font-bold text-white leading-none">Técnica</span>
                </div>
                <div class="w-px h-5 bg-white/5" *ngIf="exe.tipo_agarre"></div>
                <div class="flex flex-col" *ngIf="exe.tipo_agarre">
                  <span class="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Agarre</span>
                  <span class="text-[11px] font-bold text-[#ef4444] leading-none uppercase">{{ exe.tipo_agarre }}</span>
                </div>
                <div class="w-px h-5 bg-white/5"></div>
                <div class="flex flex-col">
                  <span class="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Zona</span>
                  <span class="text-[11px] font-bold text-white leading-none">{{ exe.region || 'Gral' }}</span>
                </div>
              </div>
 
              <!-- Footer Actions (Compact) -->
              <footer class="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10 opacity-60 group-hover:opacity-100 transition-all">
                <span class="text-[8px] font-black text-white/10 uppercase tracking-[0.3em] group-hover:text-white/20">PROTOCOLO ACTIVO</span>
                <div class="flex items-center gap-3">
                  <button (click)="openEditModal(exe); $event.stopPropagation()" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/></svg>
                  </button>
                  <button (click)="deleteExercise(exe.id); $event.stopPropagation()" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-slate-500 hover:text-[#ef4444] transition-all flex items-center justify-center">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/></svg>
                  </button>
                </div>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal Unificado -->
    <app-exercise-form-modal
      [show]="showModal()"
      [initialData]="activeForm"
      (close)="closeModal()"
      (saved)="onExerciseSaved($event)">
    </app-exercise-form-modal>
  `,
  styles: [`
    :host { display: block; width: 100%; background: transparent; }
    .custom-scroll::-webkit-scrollbar { width: 5px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
  `]
})
export class ExercisesComponent implements OnInit {
  loading = signal(false);
  submitting = signal(false);
  showModal = signal(false);
  editing = signal(false);
  search = signal('');
  regionFilter = signal('Todas');
  errorMessage = signal('');
  
  exercises = signal<ExerciseItem[]>([]);
  activeId = signal<number | null>(null);

  activeForm: any = this.getEmptyForm();

  ngOnInit() {
    this.loadData();
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

  setSearch(val: string) {
    this.search.set(val);
  }

  filteredExercises() {
    const term = this.search().toLowerCase();
    const filter = this.regionFilter();
    let exes = this.exercises();

    if (filter !== 'Todas') {
      exes = exes.filter(e => String(e.region || '').toLowerCase() === filter.toLowerCase());
    }

    if (!term) return exes;

    return exes.filter(e => 
      (e.nombre || '').toLowerCase().includes(term) ||
      (e.grupo_muscular || '').toLowerCase().includes(term)
    );
  }

  async loadData() {
    this.loading.set(true);
    try {
      const resp = await (window as any).electronAPI.exercises.getAll();
      if (!resp.ok) throw new Error(resp.error);
      this.exercises.set(resp.data || []);
    } catch(e: any) {
      this.errorMessage.set(e.message || 'Error cargando ejercicios');
    } finally {
      this.loading.set(false);
    }
  }

  openCreateModal() {
    this.activeForm = this.getEmptyForm();
    this.editing.set(false);
    this.activeId.set(null);
    this.showModal.set(true);
  }

  openEditModal(exe: ExerciseItem) {
    this.activeForm = { ...exe };
    this.editing.set(true);
    this.activeId.set(exe.id);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onExerciseSaved(exercise: any) {
    this.showModal.set(false);
    this.loadData();
  }

  async deleteExercise(id: number) {
    if(!confirm('¿Eliminar ejercicio técnico del catálogo?')) return;
    try {
      const resp = await (window as any).electronAPI.exercises.delete(id);
      if(!resp.ok) throw new Error(resp.error);
      this.loadData();
    } catch(e: any) {
      this.errorMessage.set(e.message || 'Error eliminando');
    }
  }
}