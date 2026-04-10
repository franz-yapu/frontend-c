import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConnectionQualityService {
  private quality = new BehaviorSubject<'excellent' | 'good' | 'fair' | 'poor' | 'offline'>('good');
  private latency = new BehaviorSubject<number>(0);
  private isOnline = new BehaviorSubject<boolean>(navigator.onLine);
  
  quality$ = this.quality.asObservable();
  latency$ = this.latency.asObservable();
  isOnline$ = this.isOnline.asObservable();
  
  constructor() {
    // Monitorear estado de conexión del navegador
    window.addEventListener('online', () => {
      this.isOnline.next(true);
      this.updateQualityBasedOnLatency();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline.next(false);
      this.quality.next('offline');
    });
    
    // Verificar conexión periódicamente
    setInterval(() => {
      this.checkConnection();
    }, 10000);
  }
  
  updateLatency(latency: number): void {
    this.latency.next(latency);
    this.updateQualityBasedOnLatency();
  }
  
  private updateQualityBasedOnLatency(): void {
    if (!this.isOnline.value) {
      this.quality.next('offline');
      return;
    }
    
    const latency = this.latency.value;
    let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline' = 'good';
    
    if (latency > 2000) quality = 'poor';
    else if (latency > 1000) quality = 'fair';
    else if (latency > 500) quality = 'good';
    else if (latency > 200) quality = 'good';
    else quality = 'excellent';
    
    this.quality.next(quality);
  }
  
  private checkConnection(): void {
    // Verificar si el navegador reporta online
    if (!navigator.onLine && this.isOnline.value) {
      this.isOnline.next(false);
      this.quality.next('offline');
    }
  }
  
  getQualityColor(): string {
    const q = this.quality.value;
    switch(q) {
      case 'excellent': return 'bg-success-500';
      case 'good': return 'bg-success-400';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-warning-500';
      case 'offline': return 'bg-danger-500';
      default: return 'bg-gray-500';
    }
  }
  
  getQualityText(): string {
    const q = this.quality.value;
    switch(q) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  }
}