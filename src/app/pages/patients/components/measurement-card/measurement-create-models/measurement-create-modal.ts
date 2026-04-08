import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-measurement-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './measurement-create-modal.html'
})
export class MeasurementCreateModalComponent {
  @Input() open = false;
  @Input() saving = false;
  @Input() isEditing = false;
  @Input() form: any = {};

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() fieldChange = new EventEmitter<void>();

  get today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
