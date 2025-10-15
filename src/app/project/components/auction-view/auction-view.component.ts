import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscription, catchError, of } from 'rxjs';
import { BuyerService } from '../../../modules/buyer/buyer.service';

@Component({
  selector: 'app-auction-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auction-view.component.html',
  styleUrls: ['./auction-view.component.scss']
})
export class AuctionViewComponent implements OnInit, OnDestroy {
  auctionData: any[] = [];
  filteredLots: any[] = [];
  loading = true;
  error: string | null = null;
  isConnected = false;
  isBrowser: boolean;
  currentTime: Date = new Date();
  searchTerm: string = ''; // AÑADIR ESTA PROPIEDAD
  sortBy: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Hacer públicas las propiedades que se usan en el template
  lastBids: Map<string, any[]> = new Map(); // CAMBIAR DE PRIVATE A PUBLIC
  
  private subscriptions: Subscription[] = [];
  private timerSubscription: Subscription | null = null;

  constructor(
    private buyerService: BuyerService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    await this.loadAuctionData();
    
    // Iniciar el contador de tiempo
    this.startTimer();
    
    // Solo configurar WebSocket en el navegador
    if (this.isBrowser) {
      this.setupWebSocketListeners();
      this.setupConnectionMonitoring();
    }
  }

  private startTimer() {
    // Usar setInterval directamente en lugar de Subscription para el timer
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    const intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
    
    this.timerSubscription = new Subscription();
    this.timerSubscription.add(() => clearInterval(intervalId));
  }

  // MÉTODO QUE FALTABA - Calculate Time Remaining
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

    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
    const now = this.currentTime;
    
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

  // Método para cambiar ordenamiento
  changeSort(criteria: string) {
    if (this.sortBy === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criteria;
      this.sortDirection = 'asc';
    }
    this.sortLots();
  }

  private async loadAuctionData() {
    try {
      this.loading = true;
      this.error = null;

      const data = await this.buyerService.getAutionsLotsActive();
      this.auctionData = Array.isArray(data) ? data : [];
      
      if (this.auctionData.length > 0 && this.auctionData[0].auctionDetails) {
        this.filteredLots = [...this.auctionData[0].auctionDetails];
        
        // Unirse a la sala solo en browser y después de cargar datos
        if (this.isBrowser) {
          setTimeout(() => {
            if (this.auctionData[0]?.id) {
              this.buyerService.joinAuctionRoom(this.auctionData[0].id);
            }
          }, 1000);
        }
        
        await this.loadBidHistory();
        this.sortLots(); // Ordenar después de cargar
      }
      
    } catch (error) {
      console.error('Error loading auction data:', error);
      this.error = 'Error al cargar los datos de la subasta';
    } finally {
      this.loading = false;
    }
  }

  private setupWebSocketListeners() {
    if (!this.isBrowser) return;

    const bidSubscription = this.buyerService.getNewBids()
      .pipe(
        catchError(error => {
          console.warn('WebSocket error:', error);
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
          console.error('WebSocket subscription error:', error);
        }
      });

    this.subscriptions.push(bidSubscription);
  }

  private setupConnectionMonitoring() {
    if (!this.isBrowser) return;

    const connectionSubscription = this.buyerService.getConnectionStatus()
      .subscribe(connected => {
        this.isConnected = connected;
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

          this.lastBids.set(lot.coffeeLot.id, bids || []);
        }
      } catch (error) {
        console.error('Error loading bid history:', error);
        this.lastBids.set(lot.coffeeLot.id, []);
      }
    }
  }

  private updateBidHistory(newBid: any) {
    if (!newBid.coffeeLotId) return;
    
    const currentBids = this.lastBids.get(newBid.coffeeLotId) || [];
    const updatedBids = [newBid, ...currentBids].slice(0, 5);
    this.lastBids.set(newBid.coffeeLotId, updatedBids);
  }

  // Métodos para ordenamiento y filtrado
  sortLots() {
    this.filteredLots.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (this.sortBy) {
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
          valueA = a.coffeeLot.name;
          valueB = b.coffeeLot.name;
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

  reloadData() {
    this.loadAuctionData();
  }

  ngOnDestroy() {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Detener el timer
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    // Salir de la sala de subasta solo en browser
    if (this.isBrowser && this.auctionData.length > 0 && this.auctionData[0].id) {
      this.buyerService.leaveAuctionRoom(this.auctionData[0].id);
    }
  }
}