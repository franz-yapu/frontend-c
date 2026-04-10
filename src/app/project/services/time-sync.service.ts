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
  private hasSynced = false;
  
  constructor(private http: HttpClient) {
    // Sincronizar inmediatamente
    this.syncWithServer();
    
    // Sincronizar cada minuto (o más frecuente si es necesario)
    interval(60000).subscribe(() => this.syncWithServer());
    
    // Actualizar reloj cada segundo
    interval(1000).subscribe(() => this.updateClock());

    // Escuchar cambios de visibilidad para resincronizar cuando el usuario vuelve a la pestaña
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncWithServer();
        }
      });
    }
  }
  
  syncWithServer(): Promise<boolean> {
    if (this.isSyncing) return Promise.resolve(true);
    
    this.isSyncing = true;
    const requestStartTime = Date.now();

    return this.http.get<{ serverTime: string; timestamp: number }>(
      `${environment.backend}/time/server`
    ).toPromise()
      .then((response:any) => {
        const requestEndTime = Date.now();
        const latency = (requestEndTime - requestStartTime) / 2;
        
        // El servidor nos da el tiempo devuelto + latencia de ida -> debería estimar el tiempo del servidor AHORA.
        const serverTime = new Date(response.serverTime).getTime() + latency;
        const clientTime = requestEndTime;
        
        // Qué agregar al clientTime para obtener el serverTime real:
        this.serverTimeOffset = serverTime - clientTime;
        this.hasSynced = true;
        return true;
      })
      .catch(error => {
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
    return this.hasSynced; // Mientras haya podido sincronizar al menos una vez, estamos bien
  }

   // Forzar resincronización
  forceResync(): Promise<boolean> {
    this.syncAttempts = 0;
    return this.syncWithServer();
  }
}