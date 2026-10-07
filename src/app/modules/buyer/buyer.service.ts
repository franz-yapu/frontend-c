import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom, Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { GeneralService } from '../../core/gerneral.service';
import { SKIP_LOADER } from '../../core/loading.interceptor';

@Injectable({
  providedIn: 'root'
})
export class BuyerService {
  private socket: Socket | null = null;
  private bidSubject = new Subject<any>();
  private auctionExtendedSubject = new Subject<any>();
  private auctionClosedSubject = new Subject<any>();
  private outbidSubject = new Subject<any>();
  private timeSyncSubject = new Subject<any>();
  private endDateChangedSubject = new Subject<any>();
  private lotsChangedSubject = new Subject<any>();
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private connectionQuality = new BehaviorSubject<'excellent' | 'good' | 'fair' | 'poor' | 'offline'>('good');
  private isInitialized = false;
  private latency = 0;
  /** Sala en la que está el usuario, para volver a entrar tras una reconexión. */
  private currentAuctionRoom: string | null = null;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
    private general: GeneralService
  ) {
    this.initializeSocket();

    // El token viaja en el handshake, así que una conexión abierta antes de
    // iniciar sesión se queda SIN identidad para siempre: el servidor la deja
    // escuchar, pero al pujar responde "No autenticado. Vuelve a iniciar sesión".
    // Pasaba siempre que alguien miraba la subasta pública y luego entraba con
    // su cuenta sin recargar la página (y al revés: tras cambiar de usuario el
    // socket seguía con el anterior). Al cambiar la sesión rehacemos la conexión.
    this.general.sesionCambiada$.subscribe(() => this.reconectarConLaSesionNueva());
  }

  /**
   * Cierra y vuelve a abrir el socket para que el handshake lleve el token
   * actual. `auth` es una función, así que socket.io lo relee solo; y el
   * manejador de `connect` vuelve a entrar a la sala en la que estuviéramos.
   */
  private reconectarConLaSesionNueva() {
    if (!this.socket) {
      this.initializeSocket();
      return;
    }
    try {
      this.socket.disconnect();
      this.socket.connect();
    } catch (error) {
      console.error('No se pudo rehacer la conexión de pujas:', error);
    }
  }

  private initializeSocket() {
    if (this.isInitialized) return;

    try {
      this.socket = io(`${environment.Socket}/bids`, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        // 20 s de margen para el handshake: en 3G, 10 s se agotan solos.
        timeout: 20000,
        // NUNCA dejar de reintentar. Antes eran 5 intentos: tras ~10 segundos
        // sin red el comprador se quedaba sin pujas en vivo y sin aviso, para
        // siempre, hasta recargar la página a mano. Con internet inestable eso
        // pasa constantemente. Ahora reintenta indefinidamente, con espera
        // creciente hasta 5 s y algo de azar para no sincronizar a todos los
        // clientes en la misma reconexión.
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        autoConnect: true,
        // Enviar el JWT en el handshake. Al ser una función, socket.io la
        // reevalúa en cada (re)conexión y toma el token fresco tras el login.
        auth: (cb: (data: { token: string }) => void) =>
          cb({ token: this.general.getToken() || '' })
      });

      this.setupSocketListeners();
      this.setupConnectionListeners();
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Eventos existentes
    this.socket.on('newBid', (bid: any) => {
      this.ngZone.run(() => {
        this.bidSubject.next(bid);
      });
    });

    this.socket.on('auctionExtended', (data: any) => {
      this.ngZone.run(() => {
        this.auctionExtendedSubject.next(data);
      });
    });

    // Aviso personal: otra persona superó tu puja (llega solo a tu sala user-<id>).
    this.socket.on('outbid', (data: any) => {
      this.ngZone.run(() => {
        this.outbidSubject.next(data);
      });
    });

    this.socket.on('auctionClosed', (data: any) => {
      this.ngZone.run(() => {
        this.auctionClosedSubject.next(data);
      });
    });

    this.socket.on('bidError', (error: any) => {
      this.ngZone.run(() => {
        console.error('Error en puja:', error);
      });
    });

    // NUEVOS EVENTOS DEL BACKEND MEJORADO
      this.socket.on('ping', (data: any) => {
    this.ngZone.run(() => {
      this.handlePing(data);
    });
  });


    this.socket.on('highLatencyWarning', (data: any) => {
      this.ngZone.run(() => {
        console.warn('⚠️ Advertencia de latencia alta:', data);
        this.updateLatency(data.latency);
      });
    });

    // El admin añadió un lote a la subasta en curso: hay que recargar, si no el
    // lote nuevo no aparece hasta que alguien refresque la página.
    this.socket.on('auctionLotsChanged', (data: any) => {
      this.ngZone.run(() => {
        this.lotsChangedSubject.next(data);
      });
    });

    // El admin movió la hora de cierre: llega al momento, sin esperar al
    // `timeSync` periódico.
    this.socket.on('auctionEndDateChanged', (data: any) => {
      this.ngZone.run(() => {
        this.endDateChangedSubject.next(data);
      });
    });

    this.socket.on('timeSync', (data: any) => {
      this.ngZone.run(() => {
        this.timeSyncSubject.next(data);
      });
    });

    this.socket.on('joinedRoom', (data: any) => {
      // room joined
    });
  }

private handlePing(pingData: any) {
  const now = Date.now();
  
  if (pingData?.timestamp) {
    this.latency = now - pingData.timestamp;
    this.updateLatency(this.latency);
  }
  
  if (this.socket?.connected) {
    const response = {
      timestamp: pingData?.timestamp || now,
      clientTime: now,
      serverTime: pingData?.serverTime,
      latency: this.latency
    };
    
    this.socket.emit('pong', response);
  }
}


  private updateLatency(latency: number) {
    this.latency = latency;
    
    let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline' = 'good';
    if (latency > 1000) quality = 'poor';
    else if (latency > 500) quality = 'fair';
    else if (latency > 200) quality = 'good';
    else quality = 'excellent';
    
    this.connectionQuality.next(quality);
  }

  private setupConnectionListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.ngZone.run(() => {
        this.connectionStatus.next(true);
        this.connectionQuality.next('good');
      });

      // Al reconectar hay que volver a entrar a la sala: socket.io restablece
      // la conexión pero NO recuerda las salas, así que el cliente quedaba
      // "conectado" sin recibir una sola puja de las demás personas.
      if (this.currentAuctionRoom) {
        this.socket?.emit('joinAuctionRoom', this.currentAuctionRoom);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.ngZone.run(() => {
        this.connectionStatus.next(false);
        this.connectionQuality.next('offline');
      });
    });

    this.socket.on('connect_error', (error) => {
      this.ngZone.run(() => {
        this.connectionStatus.next(false);
        this.connectionQuality.next('offline');
      });
    });
  }

  // Unirse a la sala de subasta
  joinAuctionRoom(auctionId: string) {
    this.currentAuctionRoom = auctionId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinAuctionRoom', auctionId);
    } else {
      console.warn('Socket no conectado, no se puede unir a la sala');
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('joinAuctionRoom', auctionId);
        }
      }, 1000);
    }
  }

  // Salir de la sala de subasta
  leaveAuctionRoom(auctionId: string) {
    if (this.currentAuctionRoom === auctionId) this.currentAuctionRoom = null;
    if (this.socket && this.socket.connected) {
      this.socket.emit('leaveAuctionRoom', auctionId);
    }
  }

  /**
   * Colocar una puja.
   *
   * Camino normal: WebSocket, que es el rápido y el que avisa a todos en vivo.
   * Si el socket está caído —o el servidor no confirma a tiempo, algo habitual
   * con internet malo— la puja se reintenta por HTTP contra `POST /bids`, que
   * en el servidor hace exactamente lo mismo (mismo candado por lote, mismo
   * incremento mínimo, misma identidad sacada del token). Antes, sin socket
   * simplemente no se podía pujar.
   *
   * Sobre pujar dos veces: no es un riesgo real. Si la primera entró y el aviso
   * se perdió, la segunda con el mismo monto la rechaza el propio servidor por
   * no superar el precio actual. Y para que ese rechazo no se le muestre al
   * usuario como un fallo cuando en realidad su puja SÍ entró, antes de dar el
   * error comprobamos quién va ganando el lote.
   */
  placeBid(bidData: any): Observable<any> {
    return new Observable((observer) => {
      const porHttp = (motivo: string) => {
        this.placeBidHttp(bidData, motivo).then(
          (res) => {
            observer.next(res);
            observer.complete();
          },
          (err) => observer.error(err),
        );
      };

      if (!this.socket || !this.socket.connected) {
        porHttp('sin socket');
        return;
      }

      let resuelto = false;

      // 12 s: por encima de esto damos el socket por perdido y vamos por HTTP.
      const timeout = setTimeout(() => {
        if (resuelto) return;
        resuelto = true;
        this.socket?.off('bidResponse', responseHandler);
        porHttp('sin respuesta del socket');
      }, 12000);

      const responseHandler = (response: any) => {
        if (resuelto) return;
        resuelto = true;
        clearTimeout(timeout);

        if (response.event === 'bidAccepted') {
          observer.next(response);
          observer.complete();
        } else if (/no autenticado/i.test(String(response.data ?? ''))) {
          // El socket perdió la identidad (se abrió antes de iniciar sesión).
          // La puja se manda por HTTP, donde el token va en la cabecera, y de
          // paso se rehace la conexión para las siguientes.
          this.reconectarConLaSesionNueva();
          porHttp('socket sin sesión');
        } else {
          // Rechazo del servidor (monto bajo, subasta cerrada…): es una
          // respuesta legítima, NO se reintenta por HTTP.
          observer.error(new Error(response.data));
        }
      };

      this.socket.once('bidResponse', responseHandler);
      this.socket.emit('placeBid', bidData);
    });
  }

  /** Puja por HTTP. El servidor toma la identidad del token, no del cuerpo. */
  private async placeBidHttp(bidData: any, motivo: string): Promise<any> {
    console.warn(`Puja por HTTP (${motivo})`);

    try {
      const bid: any = await firstValueFrom(
        this.http.post(
          `${environment.backend}/bids`,
          {
            amount: bidData.amount,
            auctionId: bidData.auctionId,
            coffeeLotId: bidData.coffeeLotId,
          },
          this.sinLoaderGlobal,
        ),
      );

      return {
        event: 'bidAccepted',
        data: bid,
        currentPrice: bid?.amount,
        isWinningBid: true,
        viaHttp: true,
      };
    } catch (error: any) {
      // ¿Y si la puja ya había entrado por el socket y solo se perdió el aviso?
      // Si el usuario figura como mejor postor con su monto, fue un éxito.
      const yaEntro = await this.esMiPujaLaGanadora(bidData);
      if (yaEntro) {
        return {
          event: 'bidAccepted',
          data: yaEntro,
          currentPrice: yaEntro.amount,
          isWinningBid: true,
          viaHttp: true,
        };
      }

      const mensaje =
        error?.error?.message ||
        error?.message ||
        'No se pudo registrar la puja. Revisa tu conexión.';
      throw new Error(
        Array.isArray(mensaje) ? mensaje.join(', ') : String(mensaje),
      );
    }
  }

  /** Comprueba si la puja más alta del lote ya es la de este usuario. */
  private async esMiPujaLaGanadora(bidData: any): Promise<any | null> {
    try {
      const top: any = await firstValueFrom(
        this.getHighestBidForCoffeeLot(bidData.auctionId, bidData.coffeeLotId),
      );
      const mismoUsuario =
        top && bidData.userId && top.userId === bidData.userId;
      const mismoMonto = top && Number(top.amount) === Number(bidData.amount);
      return mismoUsuario && mismoMonto ? top : null;
    } catch {
      return null;
    }
  }

  // Obtener estado de conexión
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  // Obtener calidad de conexión
  getConnectionQuality(): Observable<string> {
    return this.connectionQuality.asObservable();
  }

  // Obtener latencia actual
  getCurrentLatency(): number {
    return this.latency;
  }

  /**
   * Las llamadas de la sala de pujas NO encienden el loader de pantalla
   * completa: esa pantalla se recarga sola al reconectar o al volver a la
   * pestaña, y taparla mientras alguien está por pujar sería lo peor posible.
   * Tiene su propio loader en línea mientras no hay lotes que mostrar.
   */
  private readonly sinLoaderGlobal = {
    context: new HttpContext().set(SKIP_LOADER, true),
  };

  // Métodos HTTP
  getAuctionsLotsActive(): Observable<any> {
    return this.http.get(
      `${environment.backend}/auctions/active`,
      this.sinLoaderGlobal,
    );
  }

  getAutionsLotsActive() {
    return firstValueFrom(
      this.http.get(
        `${environment.backend}/auctions/active`,
        this.sinLoaderGlobal,
      ),
    );
  }

  getHighestBidForCoffeeLot(auctionId: string, coffeeLotId: string): Observable<any> {
    return this.http.get(`${environment.backend}/bids/highest/${auctionId}/${coffeeLotId}`);
  }

  getLastBids(auctionId: string, coffeeLotId: string, limit: number = 5): Observable<any> {
    return this.http.get(`${environment.backend}/bids/last-bids/${auctionId}/${coffeeLotId}?limit=${limit}`);
  }

  // Observable para nuevas pujas
  getNewBids(): Observable<any> {
    return this.bidSubject.asObservable();
  }

  // Observable para extensiones de subasta
  getAuctionExtended(): Observable<any> {
    return this.auctionExtendedSubject.asObservable();
  }

  getAuctionClosed(): Observable<any> {
    return this.auctionClosedSubject.asObservable();
  }

  /** Aviso de que otra persona superó tu puja en un lote. */
  getOutbid(): Observable<any> {
    return this.outbidSubject.asObservable();
  }

  getTimeSync(): Observable<any> {
    return this.timeSyncSubject.asObservable();
  }

  /** Aviso de que la hora de cierre cambió (la movió el administrador). */
  getEndDateChanged(): Observable<any> {
    return this.endDateChangedSubject.asObservable();
  }

  /** Aviso de que la lista de lotes de la subasta cambió. */
  getLotsChanged(): Observable<any> {
    return this.lotsChangedSubject.asObservable();
  }


  // Limpiar recursos
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
    }
  }

  getOrders(id: string): Observable<any> {
    return this.http.get(
      `${environment.backend}/transactions/buyer/${id}/wins`,
      this.sinLoaderGlobal,
    );
  }
}