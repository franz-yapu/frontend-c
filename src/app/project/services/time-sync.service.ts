import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TimeSyncService {
  private serverTimeOffset = 0;
  private currentTime = new BehaviorSubject<Date>(new Date());
  private isSyncing = false;
   private syncAttempts = 0;
  private maxSyncAttempts = 3;
  
  constructor(private http: HttpClient) {
    // Sincronizar inmediatamente
    this.syncWithServer();
    
    // Sincronizar cada minuto
    interval(60000).subscribe(() => this.syncWithServer());
    
    // Actualizar reloj cada segundo
    interval(1000).subscribe(() => this.updateClock());
  }
  
  syncWithServer(): Promise<boolean> {
    if (this.isSyncing) return Promise.resolve(true);
    
    this.isSyncing = true;
    return this.http.get<{ serverTime: string; timestamp: number }>(
      `${environment.backend}/time/server`
    ).toPromise()
      .then((response:any) => {
        const serverTime = new Date(response.serverTime).getTime();
        const clientTime = Date.now();
        this.serverTimeOffset = serverTime - clientTime;
        console.log('🕒 Tiempo sincronizado con servidor. Offset:', this.serverTimeOffset, 'ms');
        return true;
      })
      .catch(error => {
        console.error('Error sincronizando tiempo:', error);
        return false;
      })
      .finally(() => {
        this.isSyncing = false;
      });
  }
  
  private updateClock(): void {
    this.currentTime.next(new Date(Date.now() + this.serverTimeOffset));
  }
  
  getCurrentTime(): Date {
    return new Date(Date.now() + this.serverTimeOffset);
  }
  
  getCurrentTimeObservable() {
    return this.currentTime.asObservable();
  }
  
  getServerTimeOffset(): number {
    return this.serverTimeOffset;
  }

   // Verificar si el tiempo está sincronizado
  isTimeSynchronized(): boolean {
    return Math.abs(this.serverTimeOffset) < 1000; // Menos de 1 segundo de diferencia
  }

   // Forzar resincronización
  forceResync(): Promise<boolean> {
    console.log('🔄 Forzando resincronización de tiempo...');
    this.syncAttempts = 0;
    return this.syncWithServer();
  }
}