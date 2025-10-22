import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom, Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class BuyerService {
  private socket: Socket | null = null;
  private bidSubject = new Subject<any>();
  private auctionExtendedSubject = new Subject<any>();
  private auctionClosedSubject = new Subject<any>(); // NUEVO
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private isInitialized = false;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {
    this.initializeSocket();
  }

  private initializeSocket() {
    if (this.isInitialized) return;
    
    try {
      this.socket = io(`${environment.Socket}/bids`, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        autoConnect: true
      });

      this.setupSocketListeners();
      this.setupConnectionListeners();
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  private setupConnectionListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.ngZone.run(() => {
        console.log('✅ Conectado al servidor WebSocket');
        this.connectionStatus.next(true);
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.ngZone.run(() => {
        console.log('❌ Desconectado del servidor WebSocket:', reason);
        this.connectionStatus.next(false);
      });
    });

    this.socket.on('connect_error', (error) => {
      this.ngZone.run(() => {
        console.error('❌ Error de conexión WebSocket:', error);
        this.connectionStatus.next(false);
      });
    });
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('newBid', (bid: any) => {
      this.ngZone.run(() => {
        this.bidSubject.next(bid);
      });
    });

    this.socket.on('auctionExtended', (data: any) => {
      this.ngZone.run(() => {
        console.log('🔄 Subasta extendida:', data);
        this.auctionExtendedSubject.next(data);
      });
    });

       this.socket.on('auctionClosed', (data: any) => {
      this.ngZone.run(() => {
        console.log('🔚 Subasta cerrada:', data);
        this.auctionClosedSubject.next(data);
      });
    });

    this.socket.on('bidError', (error: any) => {
      this.ngZone.run(() => {
        console.error('Error en puja:', error);
      });
    });
  }

  // Unirse a la sala de subasta
  joinAuctionRoom(auctionId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinAuctionRoom', auctionId);
    } else {
      console.warn('Socket no conectado, no se puede unir a la sala');
      // Reintentar después de 1 segundo si no está conectado
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('joinAuctionRoom', auctionId);
        }
      }, 1000);
    }
  }

  // Salir de la sala de subasta
  leaveAuctionRoom(auctionId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leaveAuctionRoom', auctionId);
    }
  }

  // Colocar una puja
  placeBid(bidData: any): Observable<any> {
    return new Observable(observer => {
      if (!this.socket || !this.socket.connected) {
        observer.error('Socket no conectado');
        return;
      }

      const timeout = setTimeout(() => {
        observer.error('Timeout: No se recibió respuesta del servidor');
      }, 10000);

      const responseHandler = (response: any) => {
        clearTimeout(timeout);
        if (response.event === 'bidAccepted') {
          observer.next(response);
          observer.complete();
        } else if (response.event === 'bidError') {
          observer.error(response.data);
        }
      };

      this.socket.once('bidResponse', responseHandler);
      this.socket.emit('placeBid', bidData);
    });
  }

  // Obtener estado de conexión
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  // Métodos HTTP con manejo de errores
  getAuctionsLotsActive(): Observable<any> {
    return this.http.get(`${environment.backend}/auctions/active`);
  }

  getAutionsLotsActive() {
    return firstValueFrom(
      this.http.get(`${environment.backend}/auctions/active`)
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
  // Limpiar recursos
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
    }
  }

  getOrders(id: string): Observable<any> {
    return this.http.get(`${environment.backend}/transactions/buyer/${id}/wins`);
  }
}