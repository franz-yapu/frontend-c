import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';


export interface ConfirmModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmSeverity?: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger';
  icon?: string;
  iconColor?: 'text-blue-500' | 'text-green-500' | 'text-yellow-500' | 'text-red-500' | 'text-gray-500';
  iconBackground?: 'bg-blue-100' | 'bg-green-100' | 'bg-yellow-100' | 'bg-red-100' | 'bg-gray-100';
}
@Component({
  selector: 'app-confirm-modal',
  imports: [CommonModule, ButtonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
  data: ConfirmModalData;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.data = this.config.data;
  }

  onConfirm(): void {
    this.ref.close(true);
  }

  onCancel(): void {
    this.ref.close(false);
  }
}