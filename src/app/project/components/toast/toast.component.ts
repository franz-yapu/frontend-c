import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Subscription } from 'rxjs';
import { ToasterService, ToastMessage } from '../../services/toaster.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent implements OnInit {
  toasts: ToastMessage[] = [];
  private sub?: Subscription;

  constructor(private toaster: ToasterService) {}

  ngOnInit() {
    this.sub = this.toaster.toasts.subscribe(messages => {
      this.toasts = messages;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toastClasses(severity: string) {
    switch(severity) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-600';
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-400 text-black';
      default: return 'bg-gray-500';
    }
  }
}
