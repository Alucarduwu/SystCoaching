import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-diet-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diet-card.html',
  styleUrls: ['./diet-card.scss']
})
export class DietCardComponent {
  @Input() diet: any;
  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<number>();

  onView() { this.view.emit(this.diet); }
  onEdit() { this.edit.emit(this.diet); }
  onDelete() { this.delete.emit(this.diet.id); }
}