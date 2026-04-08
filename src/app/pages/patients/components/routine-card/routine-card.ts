import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-routine-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './routine-card.html',
  styleUrls: ['./routine-card.scss']
})
export class RoutineCardComponent {
  @Input() routine: any;
  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<number>();

  onView() { this.view.emit(this.routine); }
  onEdit() { this.edit.emit(this.routine); }
  onDelete() { this.delete.emit(this.routine.id); }
}