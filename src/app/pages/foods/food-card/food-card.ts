import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { FoodItem } from '../foods-components';

@Component({
  selector: 'app-food-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './food-card.html',
  styleUrls: ['./food-card.scss']
})
export class FoodCardComponent {
  @Input() food!: FoodItem;
  
  get displayKcal(): number {
    const f = this.food as any;
    return f.kcal_100g || f.kcal || f.calorias || 0;
  }

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  getFoodIcon(): string {
    const cat = (this.food.categoria || '').toUpperCase();
    
    if (cat.includes('PROT')) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-6 h-6"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`;
    }
    if (cat.includes('VEGE')) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-6 h-6"><path d="M11 20A7 7 0 0 1 4 13V5a2 2 0 0 1 2-2h5V2a1 1 0 0 1 2 0v1h5a2 2 0 0 1 2 2v8a7 7 0 0 1-7 7z"/><path d="M11 3v17"/><path d="M13 3v17"/></svg>`;
    }
    if (cat.includes('LÁCT') || cat.includes('HUEV')) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-6 h-6"><circle cx="12" cy="5" r="3"/><path d="M12 22a8 8 0 0 0 8-8V8a2 2 0 0 0-2-2h-1.5a1.5 1.5 0 0 1-1.5-1.5V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v.5A1.5 1.5 0 0 1 5.5 6H4a2 2 0 0 0-2 2v6a8 8 0 0 0 8 8z"/></svg>`;
    }
    if (cat.includes('PESC')) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-6 h-6"><path d="M22 12s-5-7-10-7-10 7-10 7 5 7 10 7 10-7 10-7Zm-10 3a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>`;
    }
    
    // Default
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-6 h-6"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>`;
  }
}