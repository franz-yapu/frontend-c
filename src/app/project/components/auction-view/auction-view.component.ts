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
  imports: [CommonModule, FormsModule, LotDetailComponent, TranslateDirective],
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
  sortBy: string = 'position';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedLot: any = null;
  lastBids: Map<string, any[]> = new Map();
  auctionEnded: boolean = false;
  showExtensionNotification: boolean = false;
  extensionMessage: string = '';
  private notificationTimeout: any;
  
  private subscriptions: Subscription[] = [];
  private timerSubscription: Subscription | null = null;

  constructor(
    private buyerService: BuyerService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    await this.loadAuctionData(); // ✅ ESTE MÉTODO SÍ EXISTE AHORA
    
    this.startTimer();
    
    if (this.isBrowser) {
      this.setupWebSocketListeners();
      this.setupConnectionMonitoring();
    }
  }

  // ✅ MÉTODO loadAuctionData CORREGIDO Y COMPLETO
  private async loadAuctionData() {
    try {
      this.loading = true;
      this.error = null;

      const data = await this.buyerService.getAutionsLotsActive();
      this.auctionData = Array.isArray(data) ? data : [];
       
      console.log('Datos de subasta cargados:', data);
       
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
      }
      
    } catch (error) {
      console.error('Error loading auction data:', error);
      this.error = 'Error al cargar los datos de la subasta';
    } finally {
      this.loading = false;
    }
  }

  private startTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    this.timerSubscription = new Subscription();
    
    const intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
    
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

    if (this.auctionEnded) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: true, hasEnded: true };
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

    const auctionExtendedSubscription = this.buyerService.getAuctionExtended()
      .pipe(
        catchError(error => {
          console.warn('WebSocket auctionExtended error:', error);
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
          console.error('Auction extended subscription error:', error);
        }
      });

    const auctionClosedSubscription = this.buyerService.getAuctionClosed()
      .pipe(
        catchError(error => {
          console.warn('WebSocket auctionClosed error:', error);
          return of(null);
        })
      )
      .subscribe({
        next: (closeData) => {
          if (closeData) {
            this.handleAuctionClosed(closeData);
          }
        },
        error: (error) => {
          console.error('Auction closed subscription error:', error);
        }
      });

    this.subscriptions.push(bidSubscription, auctionExtendedSubscription, auctionClosedSubscription);
  }

  private handleAuctionExtension(extensionData: any) {
    if (this.auctionData.length > 0 && this.auctionData[0].id === extensionData.auctionId) {
      this.auctionData[0].endDate = extensionData.newEndDate;
      
      this.showExtensionNotification = true;
      this.extensionMessage = `¡Subasta extendida! Nueva hora: ${new Date(extensionData.newEndDate).toLocaleTimeString()}`;
      
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }
      
      this.notificationTimeout = setTimeout(() => {
        this.showExtensionNotification = false;
      }, 5000);

      this.currentTime = new Date();
      
      console.log('🔄 Subasta extendida en AuctionViewComponent');
    }
  }

  private handleAuctionClosed(closeData: any) {
    if (this.auctionData.length > 0 && this.auctionData[0].id === closeData.auctionId) {
      this.auctionEnded = true;
      this.auctionData[0].status = 'CLOSED';
      
      this.showExtensionNotification = true;
      this.extensionMessage = '¡Subasta finalizada!';
      
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }
      
      this.notificationTimeout = setTimeout(() => {
        this.showExtensionNotification = false;
      }, 5000);

      this.currentTime = new Date();
      
      console.log('🔚 Subasta finalizada en AuctionViewComponent');
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
    
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    if (this.isBrowser && this.auctionData.length > 0 && this.auctionData[0].id) {
      this.buyerService.leaveAuctionRoom(this.auctionData[0].id);
    }
  }
}