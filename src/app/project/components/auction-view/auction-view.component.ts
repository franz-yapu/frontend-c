import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscription, catchError, of } from 'rxjs';
import { BuyerService } from '../../../modules/buyer/buyer.service';
import { LotDetailComponent } from './lot-detail/lot-detail.component';
import { TranslateDirective } from '../../directive/translate.directive';

@Component({
  selector: 'app-auction-view',
  standalone: true,
  imports: [CommonModule, FormsModule,LotDetailComponent,TranslateDirective],
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
  searchTerm: string = '';
  sortBy: string = 'position'; // CAMBIADO A 'position' POR DEFECTO
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedLot: any = null;
  lastBids: Map<string, any[]> = new Map();
  
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
    
    this.startTimer();
    
    if (this.isBrowser) {
      this.setupWebSocketListeners();
      this.setupConnectionMonitoring();
    }
  }

  private startTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    const intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
    
    this.timerSubscription = new Subscription();
    this.timerSubscription.add(() => clearInterval(intervalId));
  }

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

  // Método para cambiar ordenamiento - AGREGADO CASE PARA 'position'
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
       console.log(data);
       
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

          // FILTRAR DUPLICADOS ANTES DE ASIGNAR
          const uniqueBids = this.removeDuplicateBids(bids || []);
         console.log('Unique bids for lot', lot.coffeeLot.id, uniqueBids);
         
          this.lastBids.set(lot.coffeeLot.id, uniqueBids);
        }
      } catch (error) {
        console.error('Error loading bid history:', error);
        this.lastBids.set(lot.coffeeLot.id, []);
      }
    }
  }

  // NUEVO MÉTODO PARA ELIMINAR DUPLICADOS EN PUJAS
  private removeDuplicateBids(bids: any[]): any[] {
    const uniqueBids: any[] = [];
    const seen = new Set();

    bids.forEach(bid => {
      // Crear una clave única basada en monto, usuario y fecha (sin los milisegundos)
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
    
    // FILTRAR DUPLICADOS ANTES DE AGREGAR LA NUEVA PUJA
    const allBids = this.removeDuplicateBids([newBid, ...currentBids]);
    const updatedBids = allBids.slice(0, 5);
    
    this.lastBids.set(newBid.coffeeLotId, updatedBids);
  }

  // Métodos para ordenamiento y filtrado - AGREGADO CASE PARA 'position'
  sortLots() {
    this.filteredLots.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (this.sortBy) {
        case 'position': // NUEVO CASE PARA POSITION
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
          valueA = a.coffeeLot.position; // CAMBIADO A POSITION COMO DEFAULT
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
  onKeydownHandler(event: KeyboardEvent) {
    if (this.selectedLot) {
      this.closeLotDetail();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    if (this.isBrowser && this.auctionData.length > 0 && this.auctionData[0].id) {
      this.buyerService.leaveAuctionRoom(this.auctionData[0].id);
    }
  }
}