import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-food-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-form.html',
  styleUrls: ['./food-form.scss']
})
export class FoodFormModalComponent {
  @Input() open = false;
  @Input() saving = false;
  @Input() isEditing = false;
  @Input() form: any;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  icons = ['🍗', '🥩', '🍚', '🍞', '🥑', '🥚', '🥛', '🍎', '🍌', '🥦', '🍠', '🍝', '🐟', '🧀', '🥜', '🍽️'];

  selectIcon(icon: string) {
    this.form.icono = icon;
  }
}