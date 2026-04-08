import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  loading = signal(true);

  patientsCount = signal(0);
  foodsCount = signal(0);
  exercisesCount = signal(0);
  recentPatients = signal<any[]>([]);

  // Real stats
  objectiveStats = signal<{label: string, value: number, percent: number}[]>([]);
  foodCategoryStats = signal<{label: string, value: number, color: string}[]>([]);
  exerciseRegionStats = signal<{label: string, value: number}[]>([]);
  patientGrowth = signal<number[]>([]); // Last 6 months

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading.set(true);

    try {
      const elec = (window as any).electronAPI;

      const pReq = elec.patients.getAll();
      const fReq = elec.foods.getAll();
      const eReq = elec.exercises.getAll();

      const [patientsRes, foodsRes, exeRes] = await Promise.all([pReq, fReq, eReq]);

      if (patientsRes.ok) {
        const allPatients = patientsRes.data || [];
        const activePatients = allPatients.filter((p: any) => !p.deleted_at);
        this.patientsCount.set(activePatients.length);
        
        // Distribution by Objective
        const objs: Record<string, number> = {};
        activePatients.forEach((p: any) => {
          const o = p.objetivo || 'Sin asignar';
          objs[o] = (objs[o] || 0) + 1;
        });
        const total = activePatients.length || 1;
        this.objectiveStats.set(Object.entries(objs).map(([label, val]) => ({
          label,
          value: val,
          percent: Math.round((val / total) * 100)
        })));

        // Recent Patients
        const sorted = [...activePatients].sort((a, b) => b.id - a.id);
        this.recentPatients.set(sorted.slice(0, 4).map(p => ({
          ...p,
          displayName: `${p.nombres} ${p.apellido_paterno}`
        })));

        // Growth (Mock for now but based on IDs as trend)
        const trend = [10, 15, 8, 20, 12, activePatients.length];
        this.patientGrowth.set(trend);
      }
      
      if (foodsRes.ok) {
        const foods = foodsRes.data || [];
        this.foodsCount.set(foods.length);

        // Stats by Category
        const cats: Record<string, number> = {};
        foods.forEach((f: any) => {
          const c = f.categoria || 'Sin Categoría';
          cats[c] = (cats[c] || 0) + 1;
        });
        
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        this.foodCategoryStats.set(Object.entries(cats).slice(0, 6).map(([label, val], idx) => ({
          label,
          value: val,
          color: colors[idx % colors.length]
        })));
      }

      if (exeRes.ok) {
        const exes = exeRes.data || [];
        this.exercisesCount.set(exes.length);

        // Regions
        const regs: Record<string, number> = {};
        exes.forEach((e: any) => {
          const r = e.region || 'Desconocido';
          regs[r] = (regs[r] || 0) + 1;
        });
        this.exerciseRegionStats.set(Object.entries(regs).map(([label, val]) => ({
          label,
          value: val
        })));
      }

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      this.loading.set(false);
    }
  }

  viewPatient(id: number) {
    this.router.navigate(['/patients']);
  }

  async deletePatient(id: number) {
     if (!confirm('¿ESTÁS SEGURO? Esta acción purgará el registro biométrico de forma permanente.')) return;
     try {
       const res = await (window as any).electronAPI.patients.delete(id);
       if (res.ok) await this.loadDashboardData();
     } catch (err) {
       console.error('Error al eliminar:', err);
     }
  }
}