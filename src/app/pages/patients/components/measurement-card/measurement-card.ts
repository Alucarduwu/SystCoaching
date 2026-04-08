import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-measurement-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './measurement-card.html',
  styleUrls: ['./measurement-card.scss']
})
export class MeasurementCardComponent {

  /* =========================
     INPUTS
  ========================= */

  @Input() measurement: any;
  @Input() expanded = false;
  @Input() formattedDate = 'Sin fecha';

  /* =========================
     OUTPUTS
  ========================= */

  @Output() toggleExpand = new EventEmitter<number>();
  @Output() triggerPhotoInput = new EventEmitter<number>();
  @Output() uploadPhotos = new EventEmitter<{ measurement: any; event: Event }>();
  @Output() openPhotoPreview = new EventEmitter<any>();
  @Output() deletePhoto = new EventEmitter<number>();
  @Output() deleteMeasurement = new EventEmitter<number>();
  @Output() editMeasurement = new EventEmitter<any>();
  @Input() isSelected = false;
  @Output() toggleSelect = new EventEmitter<number>();
  @Output() downloadPdf = new EventEmitter<any>();


  /* =========================
     UI ACTIONS
  ========================= */

  toggle() {
    if (!this.measurement?.id) return;
    this.toggleExpand.emit(this.measurement.id);
  }

  triggerInput() {
    if (!this.measurement?.id) return;
    this.triggerPhotoInput.emit(this.measurement.id);
  }
  
  removeMeasurement(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.measurement?.id) return;
    this.deleteMeasurement.emit(this.measurement.id);
  }

  handleUpload(event: Event) {
    this.uploadPhotos.emit({
      measurement: this.measurement,
      event
    });
  }

  preview(photo: any) {
    this.openPhotoPreview.emit(photo);
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.editMeasurement.emit(this.measurement);
  }

  removePhoto(photoId: number) {
    this.deletePhoto.emit(photoId);
  }

  onDownloadPdf(event: MouseEvent) {
    event.stopPropagation();
    this.downloadPdf.emit(this.measurement);
  }

  /* =========================
     HELPERS
  ========================= */

  trackPhoto(index: number, photo: any) {
    return photo?.id ?? index;
  }

  get photosCount(): number {
    return this.measurement?.fotos?.length || 0;
  }
}