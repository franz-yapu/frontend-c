import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  severity: 'success' | 'error' | 'info' | 'warning';
  summary: string;
  detail: string;
  life?: number; // ms duración
}

@Injectable({ providedIn: 'root' })
export class ToasterService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);
  toasts = this.toasts$.asObservable();

  private counter = 0;

  showToast(params: Omit<ToastMessage, 'id'>) {
    const id = ++this.counter;
    const toast: ToastMessage = { id, ...params, life: params.life ?? 3000 };
    this.toasts$.next([...this.toasts$.value, toast]);

    // Auto elimina después de "life"
    setTimeout(() => {
      this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
    }, toast.life);
  }
}
