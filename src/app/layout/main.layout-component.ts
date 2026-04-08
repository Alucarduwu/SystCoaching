import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="layout-shell" [class.collapsed]="isCollapsed()">
    <!-- Sidebar -->
    <aside class="sidebar bg-[#070707] border-r border-white/5 flex flex-col pb-6 transition-all duration-500 ease-in-out relative z-50">
      
      <!-- Branding & System Label -->
      <div class="branding min-h-[140px] pt-10 flex flex-col transition-all duration-500" 
           [class.px-8]="!isCollapsed()" 
           [class.items-center]="isCollapsed()">
        
        <div class="flex items-center w-full mb-8" 
             [class.justify-between]="!isCollapsed()" 
             [class.flex-col-reverse]="isCollapsed()"
             [class.gap-6]="isCollapsed()">
            
            <!-- Logo Section -->
            <div class="flex items-center gap-3 overflow-hidden transition-all duration-500">
                <div class="w-1.5 h-8 bg-[#ef4444] rounded-full shadow-glow-red shrink-0 transition-all duration-500" 
                     [class.h-10]="isCollapsed()"></div>
                <h1 class="text-2xl font-black text-white tracking-tighter uppercase leading-none truncate transition-all duration-500" 
                    [class.opacity-0]="isCollapsed()" 
                    [class.w-0]="isCollapsed()">SYSTCOACH</h1>
            </div>

            <!-- Single Control Toggle -->
            <button (click)="toggleSidebar()" 
                    class="p-2.5 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all transform shrink-0 border border-white/0 hover:border-white/5"
                    [class.rotate-180]="isCollapsed()">
                <svg class="w-5 h-5 transition-transform duration-500" [class.rotate-180]="isCollapsed()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" *ngIf="!isCollapsed()"/>
                  <path d="M13 5l7 7-7 7M5 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" *ngIf="isCollapsed()"/>
                </svg>
            </button>
        </div>
        
        <div class="px-2 w-full" [class.hidden]="isCollapsed()">
          <span class="text-[9px] font-black text-white/30 tracking-[0.3em] uppercase block mb-1">Centro de Mando</span>
          <p class="text-[8px] font-bold text-slate-500 tracking-[0.15em] uppercase truncate border-l-2 border-[#ef4444]/40 pl-3">Gestión Profesional</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 flex flex-col px-3 gap-1.5 overflow-y-auto no-scrollbar transition-all duration-500">
        <a
          *ngFor="let item of navItems"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.exact }"
          [title]="isCollapsed() ? item.label : ''"
          class="nav-item group relative flex items-center h-11 px-4 rounded-xl text-white/40 hover:text-white transition-all overflow-hidden hover:bg-white/[0.02]"
          [class.justify-center]="isCollapsed()"
        >
          <div class="indicator absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#ef4444] rounded-r-full opacity-0 scale-y-0 transition-all duration-300"></div>
          
          <div class="nav-icon w-5 h-5 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity shrink-0" [innerHTML]="item.icon"></div>
          
          <span class="text-[10px] font-extrabold uppercase tracking-[0.12em] pt-0.5 whitespace-nowrap transition-all duration-500 ml-4"
                [class.opacity-0]="isCollapsed()" 
                [class.w-0]="isCollapsed()"
                [class.ml-0]="isCollapsed()">
            {{ item.label }}
          </span>
        </a>
      </nav>

      <!-- Sidebar Footer -->
      <div class="px-3 flex flex-col gap-1.5 mt-auto pt-6 border-t border-white/5 transition-all duration-500">
        <div class="px-4 py-2" [class.hidden]="isCollapsed()">
          <span class="text-[8px] font-black text-white/10 tracking-widest uppercase italic">Configuración</span>
        </div>
        <a routerLink="/settings" 
           routerLinkActive="active" 
           [title]="isCollapsed() ? 'AJUSTES' : ''"
           class="nav-item group flex items-center h-11 px-4 rounded-xl text-white/40 hover:text-white transition-all relative hover:bg-white/[0.02]"
           [class.justify-center]="isCollapsed()">
          <div class="indicator absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#ef4444] rounded-r-full opacity-0 scale-y-0 transition-all duration-300"></div>
          <div class="w-5 h-5 flex items-center justify-center opacity-40 shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <span class="text-[9px] font-black uppercase tracking-[0.1em] pt-0.5 whitespace-nowrap transition-all duration-500 ml-4"
                [class.opacity-0]="isCollapsed()" 
                [class.w-0]="isCollapsed()"
                [class.ml-0]="isCollapsed()">AJUSTES</span>
        </a>
      </div>
    </aside>

    <main class="main-area bg-[#030303] relative overflow-hidden flex flex-col transition-all duration-500 ease-in-out">
      <!-- Ambient Background Decor -->
      <div class="absolute inset-0 pointer-events-none z-0 opacity-10 transition-opacity duration-1000" [class.opacity-[0.2]]="isCollapsed()">
        <div class="w-full h-full bg-gradient-to-br from-[#ef4444]/5 via-transparent to-[#ef4444]/2"></div>
      </div>

      <section class="content-viewport flex-1 overflow-hidden relative z-10 p-0 md:p-3 lg:p-4 transition-all duration-500">
        <div class="w-full h-full bg-[#070707] md:rounded-[2rem] border border-white/5 md:shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl">
          <router-outlet></router-outlet>
        </div>
      </section>

      <!-- Global Persistent Footer -->
      <footer class="shrink-0 py-2.5 px-8 border-t border-white/5 flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-[#ef4444]/40 italic bg-[#030303] relative z-20">
        <div class="flex items-center gap-4">
          <span class="text-white/10 transition-opacity duration-500" [class.opacity-20]="isCollapsed()">SYSTCOACH_v4 // SECURE_OPERATIONS</span>
          <div class="w-1 h-1 rounded-full bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"></div>
        </div>
        <div class="flex items-center gap-6">
            <span *ngIf="isCollapsed()" class="text-white/5">COMPACT_OPERATIONS // ACTIVE</span>
            <span>OS_STABLE // RC-123.P</span>
        </div>
      </footer>
    </main>
  </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; background: #000; overflow: hidden; }
    * { box-sizing: border-box; font-family: 'Inter', 'Outfit', sans-serif; }
    
    .layout-shell {
      display: grid;
      grid-template-columns: 280px 1fr;
      height: 100vh;
      width: 100vw;
      transition: grid-template-columns 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .layout-shell.collapsed {
      grid-template-columns: 90px 1fr; /* Mini version */
    }

    .no-scrollbar::-webkit-scrollbar { display: none; }

    .nav-item.active {
      background: rgba(239, 68, 68, 0.08);
      color: #fff !important;
      box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.05);
    }

    .nav-item.active .indicator {
      opacity: 1;
      transform: translateY(-50%) scaleY(1);
    }

    .nav-item.active .nav-icon {
      opacity: 1;
      color: #ef4444;
      filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.6));
    }

    .custom-scroll::-webkit-scrollbar { width: 3px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.03); border-radius: 10px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.2); }
  `]
})
export class MainLayoutComponent implements OnInit {
  isCollapsed = signal(false);

  navItems = [
    { label: 'INICIO', route: '/dashboard', exact: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { label: 'PACIENTES', route: '/patients', exact: false, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { label: 'ALIMENTOS', route: '/foods', exact: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>' },
    { label: 'EJERCICIOS', route: '/exercises', exact: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 3h12"/><path d="M18 11V3"/><path d="M6 11V3"/><path d="M2 11h20"/><path d="M6 21v-4"/><path d="M18 21v-4"/><path d="M2 13v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8"/></svg>' }
  ];

  ngOnInit() {}

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }
}