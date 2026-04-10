import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, catchError, of } from 'rxjs';
import { BuyerService } from '../../../modules/buyer/buyer.service';
import { LotDetailComponent } from './lot-detail/lot-detail.component';
import { TranslateDirective } from '../../directive/translate.directive';
import { HomeService } from '../../../modules/home/home.service';
import { WinnersTableComponent } from './winners-table/winners-table.component';
import { TimeSyncService } from '../../services/time-sync.service';

import { ExternalWinnersComponent } from "../../../modules/external-home/external-winners/external-winners.component";
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../services/translate.service';

import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-auction-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LotDetailComponent, TranslateDirective, ExternalWinnersComponent, ExternalWinnersComponent],
  templateUrl: './auction-view.component.html',
  styleUrls: ['./auction-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuctionViewComponent implements OnInit, OnDestroy {
  auctionData: any[] = [];
  filteredLots: any[] = [];
  loading = true;
  error: string | null = null;
  isConnected = false;
  isBrowser: boolean;
  currentTime: Date = new Date();
  searchTerm: string = '';
  sortBy: string = 'position';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedLot: any = null;
  lastBids: Map<string, any[]> = new Map();
  auctionEnded: boolean = false;
  showExtensionNotification: boolean = false;
  extensionMessage: string = '';
  private notificationTimeout: any;
  timeLeft: any = { days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: false, hasEnded: false };

  private subscriptions: Subscription[] = [];
  private timerSubscription: Subscription | null = null;

  // Nuevas propiedades para manejar ganadores
  showWinners: boolean = false;
  winners: any[] = [];
  loadingWinners: boolean = false;
  winnersError: string | null = null;
  private winnersCheckInterval: any;
  private winnersLoaded: boolean = false;
// Agregar nuevas propiedades
private connectionCheckInterval: any;
private lastSuccessfulSync: Date | null = null;
private connectionLost = false;


  constructor(
    private buyerService: BuyerService, private homeService: HomeService,
    private timeSyncService: TimeSyncService,
    private translationService: TranslationService,
    @Inject(PLATFORM_ID) private platformId: any,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    await this.loadAuctionData(); // ✅ ESTE MÉTODO SÍ EXISTE AHORA

    // Sincronizar tiempo primero
    await this.timeSyncService.syncWithServer();

    this.startTimer();

    if (this.isBrowser) {
      this.setupWebSocketListeners();
      this.setupConnectionMonitoring();
      this.startWinnersCheck();
      this.setupHttpConnectionMonitoring();
    }
  }

  private setupHttpConnectionMonitoring() {
  if (!this.isBrowser) return;
  
  // Verificar conexión HTTP cada 15 segundos
  this.connectionCheckInterval = setInterval(() => {
    this.checkHttpConnection();
  }, 15000);
  
  // Verificar inmediatamente
  setTimeout(() => {
    this.checkHttpConnection();
  }, 3000);
}

private async checkHttpConnection() {
  try {
    // Lista de endpoints a probar (en orden de prioridad)
    const endpoints = [
      `${environment.backend}/time/server`,  // Endpoint de tiempo
      `${environment.backend}/api`,          // Endpoint base de API
      `${environment.backend}/`,             // Root endpoint
    ];
    
    let isBackendOnline = false;
    
    // Probar cada endpoint hasta encontrar uno que funcione
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(endpoint, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal
        }).catch(() => null).finally(() => clearTimeout(timeoutId));
        
        if (response?.ok) {
          isBackendOnline = true;
          break;
        }
      } catch (error) {
        // Continuar con el siguiente endpoint
        continue;
      }
    }
    
    if (!isBackendOnline && !this.connectionLost) {
      this.connectionLost = true;
      this.showConnectionWarning();
    } else if (isBackendOnline && this.connectionLost) {
      this.connectionLost = false;
      this.hideConnectionWarning();
      
      // Forzar resincronización y recarga de datos
      await this.timeSyncService.forceResync();
      await this.reloadAuctionData();
    }
    
  } catch (error) {
  }
}

private showConnectionWarning() {
  // Mostrar notificación de conexión perdida
  this.showExtensionNotification = true;
  this.extensionMessage = '⚠️ ' + this.translationService.translate('NOTIFICATIONS.CONNECTION_SLOW').replace('{{latency}}', '???');
  
  if (this.notificationTimeout) {
    clearTimeout(this.notificationTimeout);
  }
  
  this.notificationTimeout = setTimeout(() => {
    this.showExtensionNotification = false;
  }, 10000);
}

private hideConnectionWarning() {
  this.showExtensionNotification = true;
  this.extensionMessage = '✅ ' + this.translationService.translate('NOTIFICATIONS.CONNECTION_RESTORED');
  
  if (this.notificationTimeout) {
    clearTimeout(this.notificationTimeout);
  }
  
  this.notificationTimeout = setTimeout(() => {
    this.showExtensionNotification = false;
  }, 5000);
}

private async reloadAuctionData() {
  try {
    await this.loadAuctionData();
    
    // Reunirse a la sala WebSocket
    if (this.auctionData.length > 0 && this.auctionData[0].id) {
      this.buyerService.joinAuctionRoom(this.auctionData[0].id);
    }
  } catch (error) {
  }
}

  // ✅ MÉTODO loadAuctionData CORREGIDO Y COMPLETO
private async loadAuctionData() {
  try {
    this.loading = true;
    this.error = null;
    this.showWinners = false;
    this.winnersLoaded = false;

    const data = await this.buyerService.getAutionsLotsActive();
    this.auctionData = Array.isArray(data) ? data : [];

    if (this.auctionData.length > 0 && this.auctionData[0].auctionDetails) {
      this.filteredLots = [...this.auctionData[0].auctionDetails];

      if (this.isBrowser) {
        setTimeout(() => {
          if (this.auctionData[0]?.id) {
            this.buyerService.joinAuctionRoom(this.auctionData[0].id);
          }
        }, 1000);
      }

      await this.loadBidHistory();
      this.sortLots();
      
      // ✅ CORREGIDO: Usar tiempo sincronizado
      const auction = this.auctionData[0];
      const endDate = new Date(auction.endDate);
      const now = this.timeSyncService.getCurrentTime(); // Usar tiempo sincronizado

      // Verificar si la subasta ya terminó (hace más de 3 minutos)
      if (now.getTime() - endDate.getTime() > 3 * 60 * 1000) {
        await this.loadWinners();
      }
    }

  } catch (error) {
    this.error = 'Error al cargar los datos de la subasta';
  } finally {
    this.loading = false;
  }
}

// Agregar método para determinar qué mostrar
shouldShowWinners(): boolean {
  // Solo mostrar ganadores si hay una subasta activa que ya terminó
  if (!this.hasActiveAuction()) return false;
  
  if (this.auctionData.length === 0) return false;
  
  const auction = this.auctionData[0];
  const endDate = new Date(auction.endDate);
  const now = this.timeSyncService.getCurrentTime();
  
  const timeSinceEnd = now.getTime() - endDate.getTime();
  
  return this.auctionEnded && 
         timeSinceEnd > 3 * 60 * 1000 && 
         this.winners.length > 0;
}

hasActiveAuction(): boolean {
  // Retorna true si hay una subasta activa con lotes o si cerró hace menos de 2 minutos
  if (this.auctionData.length === 0 || !this.auctionData[0]?.auctionDetails?.length) {
    return false;
  }
  
  const status = this.auctionData[0]?.status;
  if (status === 'ACTIVE') return true;
  
  if (status === 'CLOSED') {
    const auction = this.auctionData[0];
    const endDate = new Date(auction.endDate);
    const now = this.timeSyncService.getCurrentTime();
    
    // Si la subasta terminó hace menos de 2 minutos (120000ms), la seguimos mostrando
    if (now.getTime() - endDate.getTime() <= 2 * 60 * 1000) {
      return true;
    }
  }
  
  return false;
}

shouldShowLots(): boolean {
  // Mostrar lotes SIEMPRE que:
  // 1. Tengamos datos de subasta Y
  // 2. Tengamos detalles de subasta
  
  if (this.auctionData.length === 0 || !this.auctionData[0].auctionDetails) {
    return false;
  }
  
  // SIEMPRE mostrar lotes, incluso si la subasta terminó
  // Los lotes se muestran durante los 3 minutos de procesamiento
  return true;
}

  // Modificar startTimer para usar tiempo sincronizado:
  private startTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    // Usar tiempo sincronizado
    this.timerSubscription = this.timeSyncService.getCurrentTimeObservable().subscribe(time => {
      this.currentTime = time;
      if (this.auctionData.length > 0) {
        this.timeLeft = this.calculateTimeRemaining(this.auctionData[0]);
      }
      this.cdr.markForCheck();

      // Verificar si la subasta debería haber terminado
      this.checkAuctionStatus();
    });
  }
  // Agregar método para verificar estado de subasta:
 private checkAuctionStatus() {
  if (this.auctionData.length === 0 || this.auctionEnded) return;

  // Verificar si el tiempo está sincronizado
  if (!this.timeSyncService.isTimeSynchronized()) {
    
    // Intentar resincronizar
    this.timeSyncService.forceResync().then(success => {
      if (success) {
        this.checkAuctionStatus(); // Re-verificar con tiempo sincronizado
      }
    });
    
    return;
  }

  const auction = this.auctionData[0];
  const timeRemaining = this.calculateTimeRemaining(auction);

  // Verificar si la subasta debería haber terminado
  if (timeRemaining.hasEnded && !this.auctionEnded) {
    this.auctionEnded = true;
    this.auctionData[0].status = 'CLOSED';
    this.showExtensionNotification = true;
    this.extensionMessage = this.translationService.translate('NOTIFICATIONS.AUCTION_CLOSED');

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    this.notificationTimeout = setTimeout(() => {
      this.showExtensionNotification = false;
    }, 10000);

    // Programar carga de ganadores para 3 minutos después
    setTimeout(() => {
      this.loadWinners();
    }, 3 * 60 * 1000);
  }
}

  private startWinnersCheck() {
    // Verificar cada 30 segundos si la subasta ha terminado y cargar ganadores
    this.winnersCheckInterval = setInterval(() => {
      this.checkAndLoadWinners();
    }, 30000); // 30 segundos

    // Verificar inmediatamente
    setTimeout(() => {
      this.checkAndLoadWinners();
    }, 1000);
  }

// Modificar checkAndLoadWinners para usar tiempo sincronizado:
private async checkAndLoadWinners() {
  if (this.winnersLoaded || this.loadingWinners) return;
  
  // Verificar si la subasta ha terminado
  if (this.auctionData.length > 0) {
    const auction = this.auctionData[0];
    const endDate = new Date(auction.endDate);
    const now = this.timeSyncService.getCurrentTime(); // Usar tiempo sincronizado
    
    // Si la subasta terminó hace más de 3 minutos
    if (now.getTime() - endDate.getTime() > 3 * 60 * 1000) {
      await this.loadWinners();
    }
  }
}

  // Método para cargar los ganadores
  private async loadWinners() {
    if (this.winnersLoaded || this.loadingWinners || this.auctionData.length === 0) return;

    try {
      this.loadingWinners = true;
      this.winnersError = null;

      const auctionId = this.auctionData[0].id;

      // Obtener transacciones de la subasta
      const transactions = await this.homeService.getAutionTransactions(auctionId);

      if (transactions && Array.isArray(transactions)) {
        this.winners = transactions.map(transaction => ({
          id: transaction.id,
          position: transaction.coffeeLot?.position,
          variety: transaction.coffeeLot?.variety,
          region: transaction.coffeeLot?.region,
          country: transaction.coffeeLot?.country,
          cupScore: transaction.coffeeLot?.cupScore,
          quantityLbs: transaction.coffeeLot?.quantityLbs,
          quantity: transaction.coffeeLot?.quantity,
          winningBid: transaction.amount,
          winnerName: transaction.buyer?.firstName + ' ' + transaction.buyer?.lastName,
          winnerCompany: transaction.buyer?.companyName,
          buyerName: transaction.buyer?.firstName + ' ' + transaction.buyer?.lastName,
          companyName: transaction.buyer?.companyName
        }));

        this.winnersLoaded = true;

      }

    } catch (error) {
      this.winnersError = this.translationService.translate('AUCTION.WINNERS.ERROR_TITLE');
    } finally {
      this.loadingWinners = false;
    }
  }

  // Modificar calculateTimeRemaining para usar tiempo sincronizado:
  calculateTimeRemaining(auction: any): {
    days: number,
    hours: number,
    minutes: number,
    seconds: number,
    hasStarted: boolean,
    hasEnded: boolean
  } {
    if (!auction) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: false, hasEnded: false };
    }

    if (this.auctionEnded) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: true, hasEnded: true };
    }

    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
    const now = this.currentTime; // Ya usa tiempo sincronizado

    const hasStarted = now >= startDate;
    const hasEnded = now >= endDate;

    const targetDate = hasStarted ? endDate : startDate;
    const diff = Math.max(0, targetDate.getTime() - now.getTime());

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, hasStarted, hasEnded };
  }

  private setupWebSocketListeners() {
    if (!this.isBrowser) return;

    const bidSubscription = this.buyerService.getNewBids()
      .pipe(
        catchError(error => {
          return of(null);
        })
      )
      .subscribe({
        next: (bid) => {
          if (bid) {
            this.handleNewBid(bid);
          }
        },
        error: (error) => {
        }
      });

    const auctionExtendedSubscription = this.buyerService.getAuctionExtended()
      .pipe(
        catchError(error => {
          return of(null);
        })
      )
      .subscribe({
        next: (extensionData) => {
          if (extensionData) {
            this.handleAuctionExtension(extensionData);
          }
        },
        error: (error) => {
        }
      });

    const auctionClosedSubscription = this.buyerService.getAuctionClosed()
      .pipe(
        catchError(error => {
          return of(null);
        })
      )
      .subscribe({
        next: (closeData) => {
          if (closeData) {
            this.handleAuctionClosed(closeData);
            this.cdr.markForCheck();
          }
        }
      });

    const timeSyncSubscription = this.buyerService.getTimeSync().subscribe(syncData => {
      if (this.auctionData.length > 0 && this.auctionData[0].id === syncData.auctionId) {
        if (syncData.endDate) {
          this.auctionData[0].endDate = syncData.endDate;
        }
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.push(bidSubscription, auctionExtendedSubscription, auctionClosedSubscription, timeSyncSubscription);
  }

private handleAuctionExtension(extensionData: any) {
  if (this.auctionData.length > 0 && this.auctionData[0].id === extensionData.auctionId) {
    this.auctionData[0].endDate = extensionData.newEndDate;
    
    // Si la subasta estaba marcada como finalizada, reactivarla
    if (this.auctionEnded) {
      this.auctionEnded = false;
      this.auctionData[0].status = 'ACTIVE';
      this.showWinners = false;
      this.winners = []; // Limpiar ganadores
      this.winnersLoaded = false; // Permitir recarga
      
    }
    
    this.showExtensionNotification = true;
    const newEndTime = new Date(extensionData.newEndDate);
    const formattedTime = newEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.extensionMessage = this.translationService.translate('NOTIFICATIONS.AUCTION_EXTENDED').replace('{{time}}', formattedTime);
    
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    this.notificationTimeout = setTimeout(() => {
      this.showExtensionNotification = false;
    }, 5000);

    this.currentTime = this.timeSyncService.getCurrentTime();
    
  }
}

private handleAuctionClosed(closeData: any) {
  if (this.auctionData.length > 0 && this.auctionData[0].id === closeData.auctionId) {
    this.auctionEnded = true;
    this.auctionData[0].status = 'CLOSED';
    
    this.showExtensionNotification = true;
    this.extensionMessage = this.translationService.translate('NOTIFICATIONS.AUCTION_CLOSED');
    
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    this.notificationTimeout = setTimeout(() => {
      this.showExtensionNotification = false;
    }, 5000);

    this.currentTime = this.timeSyncService.getCurrentTime();
    
    
    // ✅ MEJORADO: Esperar 3 minutos antes de cargar ganadores
    setTimeout(() => {
      this.loadWinners();
    }, 3 * 60 * 1000); // Esperar 3 minutos exactos
    
    // Mostrar mensaje de "procesando resultados" inmediatamente
    this.showWinners = false;
    this.winners = []; // Limpiar ganadores anteriores
  }
}

  closeExtensionNotification() {
    this.showExtensionNotification = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

private setupConnectionMonitoring() {
  if (!this.isBrowser) return;

  const connectionSubscription = this.buyerService.getConnectionStatus()
    .subscribe(connected => {
      this.isConnected = connected;
      
      if (connected) {
        // Recargar datos cuando se reconecta
        this.loadAuctionData();
      } else {
      }
    });

  this.subscriptions.push(connectionSubscription);
}

  private handleNewBid(bid: any) {
    this.filteredLots = this.filteredLots.map(lot => {
      if (lot.coffeeLot?.id === bid.coffeeLotId) {
        return { ...lot, currentPrice: bid.amount };
      }
      return lot;
    });

    this.updateBidHistory(bid);
  }

  private async loadBidHistory() {
    for (const lot of this.filteredLots) {
      try {
        if (lot.auctionId && lot.coffeeLot?.id) {
          const bids = await this.buyerService.getLastBids(
            lot.auctionId,
            lot.coffeeLot.id,
            5
          ).pipe(
            catchError(error => {
              console.warn('Error loading bid history:', error);
              return of([]);
            })
          ).toPromise();

          const uniqueBids = this.removeDuplicateBids(bids || []);
          this.lastBids.set(lot.coffeeLot.id, uniqueBids);
        }
      } catch (error) {
        console.error('Error loading bid history:', error);
        this.lastBids.set(lot.coffeeLot.id, []);
      }
    }
  }

  private removeDuplicateBids(bids: any[]): any[] {
    const uniqueBids: any[] = [];
    const seen = new Set();

    bids.forEach(bid => {
      const bidKey = `${bid.amount}_${bid.user?.id}_${new Date(bid.createdAt).toISOString().slice(0, 16)}`;

      if (!seen.has(bidKey)) {
        seen.add(bidKey);
        uniqueBids.push(bid);
      }
    });

    return uniqueBids;
  }

  private updateBidHistory(newBid: any) {
    if (!newBid.coffeeLotId) return;

    const currentBids = this.lastBids.get(newBid.coffeeLotId) || [];
    const allBids = this.removeDuplicateBids([newBid, ...currentBids]);
    const updatedBids = allBids.slice(0, 5);

    this.lastBids.set(newBid.coffeeLotId, updatedBids);
  }

  // Métodos para ordenamiento y filtrado
  sortLots() {
    this.filteredLots.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (this.sortBy) {
        case 'position':
          valueA = a.coffeeLot.position;
          valueB = b.coffeeLot.position;
          break;
        case 'name':
          valueA = a.coffeeLot.name;
          valueB = b.coffeeLot.name;
          break;
        case 'score':
          valueA = a.coffeeLot.cupScore;
          valueB = b.coffeeLot.cupScore;
          break;
        case 'price':
          valueA = a.currentPrice;
          valueB = b.currentPrice;
          break;
        case 'quantity':
          valueA = a.coffeeLot.quantityLbs;
          valueB = b.coffeeLot.quantityLbs;
          break;
        default:
          valueA = a.coffeeLot.position;
          valueB = b.coffeeLot.position;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return this.sortDirection === 'asc'
          ? Number(valueA) - Number(valueB)
          : Number(valueB) - Number(valueA);
      }
    });
  }

  filterLots() {
    if (!this.auctionData.length || !this.auctionData[0].auctionDetails) return;

    this.filteredLots = this.auctionData[0].auctionDetails.filter((lot: any) =>
      lot.coffeeLot.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      lot.coffeeLot.variety.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      lot.coffeeLot.region.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      lot.coffeeLot.country.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.sortLots();
  }

  changeSort(criteria: string) {
    if (this.sortBy === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criteria;
      this.sortDirection = 'asc';
    }
    this.sortLots();
  }

  reloadData() {
    this.loadAuctionData();
  }

  openLotDetail(lot: any) {
    this.selectedLot = lot;
    document.body.style.overflow = 'hidden';
  }

  closeLotDetail() {
    this.selectedLot = null;
    document.body.style.overflow = 'auto';
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: Event) {
    if (this.selectedLot) {
      this.closeLotDetail();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());

    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    if (this.isBrowser && this.auctionData.length > 0 && this.auctionData[0].id) {
      this.buyerService.leaveAuctionRoom(this.auctionData[0].id);
    }

     if (this.connectionCheckInterval) {
    clearInterval(this.connectionCheckInterval);
  }
  }
}