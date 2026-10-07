import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {
  /** Espera antes de mostrar el loader: por debajo de esto la red va bien. */
  private static readonly SLOW_NETWORK_MS = 400;
  /** Tiempo mínimo en pantalla una vez visible, para que no parpadee. */
  private static readonly MIN_VISIBLE_MS = 500;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  /**
   * Avisa de que la sesión cambió (entrar o salir). Lo escucha BuyerService para
   * rehacer el WebSocket: el handshake lleva el token, así que una conexión
   * abierta antes del login se queda con la identidad vieja (o sin ninguna) y el
   * servidor rechaza las pujas con "No autenticado".
   */
  private sesionCambiada = new Subject<void>();
  sesionCambiada$ = this.sesionCambiada.asObservable();

  private pendingRequests = 0;
  private showTimer: any = null;
  private hideTimer: any = null;
  private shownAt = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}



  setSaveToken(data: any) {
    if (isPlatformBrowser(this.platformId)) {
      // El backend devuelve `access_token` (no `token`). Antes se guardaba
      // `undefined`; era latente porque el REST no exigía auth, pero con el guard
      // global del backend un token inválido provoca 401 + logout en bucle.
      const token = data?.access_token ?? data?.token;
      localStorage.setItem(environment.appCode + '.token', token);
      localStorage.setItem(environment.appCode + '.userData',  JSON.stringify(data.user));
      this.sesionCambiada.next();
    }
  }

  getToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(environment.appCode + '.token');
    }
    return null; 
  }

  logout(){
    if (isPlatformBrowser(this.platformId)) {
       localStorage.removeItem(environment.appCode + '.token');
       localStorage.removeItem(environment.appCode + '.userData');
       this.sesionCambiada.next();
    }
    return null; 
  }
  

   getUser() {
    if (isPlatformBrowser(this.platformId)) {
       const user = localStorage.getItem(environment.appCode + '.userData');
      if (user) {
       return JSON.parse(user);
       } else {
        // Maneja el caso cuando no hay datos en localStorage
       return null; // o un objeto vacío {}, según convenga
     }
    }
    return null; 
  }



  show() {
    this.clearShowTimer();
    this.reveal();
  }

  hide() {
    this.clearShowTimer();
    this.conceal();
  }

  /**
   * Marca el inicio de una petición. El loader NO aparece de inmediato: solo si
   * la respuesta tarda más de SLOW_NETWORK_MS. Con buena conexión la pantalla
   * no parpadea; con internet lento aparece la taza.
   */
  trackRequestStart() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.pendingRequests++;
    if (this.pendingRequests === 1 && !this.showTimer) {
      this.showTimer = setTimeout(() => {
        this.showTimer = null;
        if (this.pendingRequests > 0) this.reveal();
      }, GeneralService.SLOW_NETWORK_MS);
    }
  }

  /** Marca el fin de una petición (haya ido bien o mal). */
  trackRequestEnd() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    if (this.pendingRequests > 0) return;

    this.clearShowTimer();

    // Si ya se veía, se mantiene un mínimo en pantalla: un loader que aparece y
    // desaparece en 50 ms se ve como un defecto, no como una carga.
    const visibleFor = Date.now() - this.shownAt;
    const remaining = GeneralService.MIN_VISIBLE_MS - visibleFor;
    if (this.loadingSubject.value && remaining > 0) {
      this.hideTimer = setTimeout(() => this.conceal(), remaining);
    } else {
      this.conceal();
    }
  }

  private reveal() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    if (!this.loadingSubject.value) {
      this.shownAt = Date.now();
      this.loadingSubject.next(true);
    }
  }

  private conceal() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    if (this.loadingSubject.value) this.loadingSubject.next(false);
  }

  private clearShowTimer() {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }


}