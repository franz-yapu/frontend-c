import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { BuyerService } from '../buyer.service';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeneralService } from '../../../core/gerneral.service';
import { ConnectionQualityService } from '../../../project/services/connection-quality.service';
import { TimeSyncService } from '../../../project/services/time-sync.service';
import { TranslationService } from '../../../project/services/translate.service';
import { TranslateDirective } from '../../../project/directive/translate.directive';
import { TranslatePipe } from '../../../project/pipe/translate.pipe';

interface CoffeeLot {
  id: string;
  name: string;
  cupScore: number;
  variety: string;
  process: string;
  quantityLbs: number;
  altitude: number;
  region: string;
  country: string;
  harvestYear: number;
  producerName: string | null;
  isSpecialty: boolean;
  position: string;
  municipality: string;
  seller: string;
}

interface AuctionDetail {
  id: string;
  startingPrice: number;
  currentPrice: number;
  reservePrice: number | null;
  coffeeLot: CoffeeLot;
  auctionId: string;
  coffeeLotId: string;
  position: number;
}

interface Auction {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  minIncrement: number;
  auctionDetails: AuctionDetail[];
}

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  userId: string;
  auctionId: string;
  coffeeLotId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string;
  };
}

@Component({
  selector: 'app-buyer-auction',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateDirective, TranslatePipe],
  templateUrl: './buyer-auction.component.html',
  styleUrl: './buyer-auction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyerAuctionComponent implements OnInit, OnDestroy {
  userId: string = '';
  quickIncrements: number[] = [1, 2, 3, 5, 8, 13, 21];

  auctionData: Auction[] = [];
  currentTime: Date = new Date();
  filteredLots: AuctionDetail[] = [];
  searchTerm: string = '';
  sortBy: string = 'position';
  sortDirection: 'asc' | 'desc' = 'asc';

  private timerSubscription!: Subscription;
  private bidSubscription!: Subscription;
  private auctionExtendedSubscription!: Subscription;
  private auctionClosedSubscription!: Subscription;

  highestBids: Map<string, number> = new Map();
  userBidAmounts: Map<string, number> = new Map();
  lastBids: Map<string, any[]> = new Map();

  showBidModal: boolean = false;
  selectedLot: AuctionDetail | null = null;
  bidAmount: number = 0;
  bidError: string = '';
  isLoading: boolean = false;
  showExtensionNotification: boolean = false;
  extensionMessage: string = '';
  auctionEnded: boolean = false;

  private notificationTimeout: any;
  private connectionCheckInterval: any;

  selectedIncrement: number | null = null;
  showManualBidInput: boolean = false;
  modalStep: 'select' | 'confirm' = 'select';
  totalLotValue: number = 0;

  private onVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && !this.auctionEnded) {
      try {
        await this.timeSyncService.syncWithServer();
        await this.loadAuctionData();
        this.cdr.markForCheck();
      } catch (e) {
        console.error('Error on visibility change sync', e);
      }
    }
  };

  timeLeft: any = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    hasStarted: false,
    hasEnded: false,
  };
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline' =
    'good';
  latency: number = 0;
  showConnectionWarning: boolean = false;

  constructor(
    private buyerService: BuyerService,
    private generalService: GeneralService,
    private connectionQualityService: ConnectionQualityService,
    public timeSyncService: TimeSyncService,
    private translationService: TranslationService,
    @Inject(PLATFORM_ID) private platformId: any,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      const dataUser: any = this.generalService.getUser();
      if (dataUser) this.userId = dataUser.id;

      await this.timeSyncService.syncWithServer();
      await this.loadAuctionData();
      this.setupWebSocketListeners();
      this.setupConnectionQuality();
      this.setupConnectionMonitoring();

      this.timerSubscription = this.timeSyncService
        .getCurrentTimeObservable()
        .subscribe((time) => {
          this.currentTime = time;
          if (this.auctionData.length > 0) {
            this.timeLeft = this.calculateTimeRemaining(this.auctionData[0]);

            // Network precision validation for UI warning
            const totalSecs =
              this.timeLeft.days * 86400 +
              this.timeLeft.hours * 3600 +
              this.timeLeft.minutes * 60 +
              this.timeLeft.seconds;
            const isNetworkUnstableAtClose =
              totalSecs <= 3 && this.latency >= 1000;

            if (this.showBidModal && isNetworkUnstableAtClose) {
              this.bidError = this.translationService.translate(
                'AUCTION_SYNC.SLOW_BID_PROMPT',
              );
            } else if (
              this.showBidModal &&
              this.bidError ===
                this.translationService.translate(
                  'AUCTION_SYNC.SLOW_BID_PROMPT',
                ) &&
              !isNetworkUnstableAtClose
            ) {
              this.bidError = '';
            }
          }
          this.cdr.markForCheck();
        });
    }
  }

  async loadAuctionData() {
    try {
      this.isLoading = true;
      const data = await this.buyerService.getAuctionsLotsActive().toPromise();
      this.auctionData = data || [];

      if (this.auctionData.length > 0 && this.auctionData[0].auctionDetails) {
        this.filteredLots = [...this.auctionData[0].auctionDetails].sort(
          (a, b) => {
            return (
              (Number(a.coffeeLot?.position) || 0) -
              (Number(b.coffeeLot?.position) || 0)
            );
          },
        );

        this.buyerService.joinAuctionRoom(this.auctionData[0].id);
        await this.loadHighestBids();
        await this.loadBidHistory();
      }
      this.cdr.markForCheck();
    } catch (error) {
      this.showNotification(
        this.translationService.translate('NOTIFICATIONS.SYNC_ERROR'),
        'error',
      );
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async loadHighestBids() {
    for (const lot of this.filteredLots) {
      try {
        const highestBid = await this.buyerService
          .getHighestBidForCoffeeLot(lot.auctionId, lot.coffeeLot.id)
          .toPromise();

        if (highestBid) {
          this.highestBids.set(lot.coffeeLot.id, highestBid.amount);
          lot.currentPrice = highestBid.amount;
        }
      } catch (error) {}
    }
    this.cdr.markForCheck();
  }

  async loadBidHistory() {
    for (const lot of this.filteredLots) {
      try {
        const bids = await this.buyerService
          .getLastBids(lot.auctionId, lot.coffeeLot.id, 5)
          .toPromise();
        this.lastBids.set(lot.coffeeLot.id, bids || []);
      } catch (error) {
        this.lastBids.set(lot.coffeeLot.id, []);
      }
    }
    this.cdr.markForCheck();
  }

  setupWebSocketListeners() {
    if (this.bidSubscription) this.bidSubscription.unsubscribe();
    this.bidSubscription = this.buyerService
      .getNewBids()
      .subscribe((newBid) => {
        if (newBid) {
          this.handleNewBid(newBid);
          this.cdr.markForCheck();
        }
      });

    if (this.auctionExtendedSubscription)
      this.auctionExtendedSubscription.unsubscribe();
    this.auctionExtendedSubscription = this.buyerService
      .getAuctionExtended()
      .subscribe((extensionData) => {
        if (extensionData) {
          this.handleAuctionExtension(extensionData);
          this.cdr.markForCheck();
        }
      });

    if (this.auctionClosedSubscription)
      this.auctionClosedSubscription.unsubscribe();
    this.auctionClosedSubscription = this.buyerService
      .getAuctionClosed()
      .subscribe((closeData) => {
        if (closeData) {
          this.handleAuctionClosed(closeData);
          this.cdr.markForCheck();
        }
      });

    this.buyerService.getTimeSync().subscribe(() => {
      this.timeSyncService.syncWithServer().then(() => {
        this.cdr.markForCheck();
      });
    });

    this.buyerService.getConnectionStatus().subscribe((isConnected) => {
      if (isConnected) {
        this.loadAuctionData();
      }
    });
  }

  private setupConnectionQuality() {
    this.buyerService.getConnectionQuality().subscribe((quality) => {
      this.connectionQuality = quality as any;
      this.showConnectionWarning = quality === 'poor' || quality === 'offline';
      this.latency = this.buyerService.getCurrentLatency();

      if (quality === 'poor' && this.latency > 1000) {
        this.showNotification(
          this.translationService
            .translate('NOTIFICATIONS.CONNECTION_SLOW')
            .replace('{{latency}}', this.latency.toString()),
          'warning',
        );
      }
      this.cdr.markForCheck();
    });

    this.buyerService.getConnectionStatus().subscribe((isConnected) => {
      if (!isConnected) {
        this.showNotification(
          this.translationService.translate('AUCTION_SYNC.OFFLINE_BID'),
          'error',
        );
      } else if (this.connectionQuality === 'offline') {
        this.showNotification(
          this.translationService.translate(
            'NOTIFICATIONS.CONNECTION_RESTORED',
          ),
          'success',
        );
      }
      this.cdr.markForCheck();
    });
  }

  handleNewBid(bid: Bid) {
    const updatedLots = this.filteredLots.map((lot) => {
      if (lot.coffeeLot.id === bid.coffeeLotId) {
        return { ...lot, currentPrice: bid.amount };
      }
      return lot;
    });

    this.filteredLots = updatedLots.sort((a, b) => {
      return (
        (Number(a.coffeeLot?.position) || 0) -
        (Number(b.coffeeLot?.position) || 0)
      );
    });

    this.highestBids.set(bid.coffeeLotId, bid.amount);
    this.updateBidHistory(bid);

    // 2. Sincronización redundante de fecha de fin
    if (
      (bid as any).auctionEndDate &&
      this.auctionData.length > 0 &&
      this.auctionData[0].id === bid.auctionId
    ) {
      const serverEndDate = (bid as any).auctionEndDate;
      if (this.auctionData[0].endDate !== serverEndDate) {
        this.auctionData[0].endDate = serverEndDate;
        if (this.auctionEnded) {
          this.auctionEnded = false;
          this.auctionData[0].status = 'ACTIVE';
        }
      }
    }

    if (this.selectedLot?.coffeeLot?.id === bid.coffeeLotId) {
      this.selectedLot = { ...this.selectedLot, currentPrice: bid.amount };
    }
  }

  updateBidHistory(newBid: any) {
    const currentBids = this.lastBids.get(newBid.coffeeLotId) || [];
    const updatedBids = [newBid, ...currentBids].slice(0, 5);
    this.lastBids.set(newBid.coffeeLotId, updatedBids);
  }

  handleAuctionExtension(extensionData: any) {
    if (
      this.auctionData.length > 0 &&
      this.auctionData[0].id === extensionData.auctionId
    ) {
      this.auctionData[0].endDate = extensionData.newEndDate;
      if (this.auctionEnded) {
        this.auctionEnded = false;
        this.auctionData[0].status = 'ACTIVE';
      }
      const newEndTime = new Date(extensionData.newEndDate);
      const formattedTime = newEndTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      this.showNotification(
        this.translationService
          .translate('NOTIFICATIONS.AUCTION_EXTENDED')
          .replace('{{time}}', formattedTime),
        'info',
      );
      this.cdr.markForCheck();
    }
  }

  handleAuctionClosed(closeData: any) {
    if (
      this.auctionData.length > 0 &&
      this.auctionData[0].id === closeData.auctionId
    ) {
      this.auctionEnded = true;
      this.auctionData[0].status = 'CLOSED';
      this.showNotification(
        this.translationService.translate('NOTIFICATIONS.AUCTION_CLOSED'),
        'info',
      );
      this.cdr.markForCheck();
    }
  }

  showNotification(message: string, type: string) {
    this.extensionMessage = message;
    this.showExtensionNotification = true;
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.showExtensionNotification = false;
      this.cdr.markForCheck();
    }, 5000);
    this.cdr.markForCheck();
  }

  openBidModal(lot: AuctionDetail) {
    this.selectedLot = lot;
    this.bidAmount = lot.currentPrice;
    this.selectedIncrement = null;
    this.showManualBidInput = false;
    this.modalStep = 'select';
    this.bidError = '';
    this.totalLotValue = 0;
    this.showBidModal = true;
    this.cdr.markForCheck();
  }

  closeBidModal() {
    this.showBidModal = false;
    this.selectedLot = null;
    this.modalStep = 'select';
    this.cdr.markForCheck();
  }

  calculateMinBidAmount(lot: AuctionDetail): number {
    const currentHighest =
      this.highestBids.get(lot.coffeeLot.id) || lot.currentPrice;
    const auction = this.auctionData[0];
    return currentHighest + (auction?.minIncrement || 1);
  }

  selectQuickIncrement(increment: number): void {
    if (this.selectedLot) {
      this.bidAmount = this.selectedLot.currentPrice + increment;
      this.selectedIncrement = increment;
      this.showManualBidInput = false;
      this.calculateTotalValue();
      this.cdr.markForCheck();
    }
  }

  showManualInput(): void {
    this.showManualBidInput = true;
    this.selectedIncrement = null;
    if (this.selectedLot) {
      this.bidAmount = this.calculateMinBidAmount(this.selectedLot);
    }
    this.calculateTotalValue();
    this.cdr.markForCheck();
  }

  onManualBidChange(): void {
    if (!this.selectedLot) return;
    const minBid = this.calculateMinBidAmount(this.selectedLot);
    if (this.bidAmount < minBid) {
      this.bidError = this.translationService
        .translate('AUCTION_BUYER.MIN_BID_ERROR')
        .replace('${{min}}', minBid.toFixed(2));
    } else {
      this.bidError = '';
      this.calculateTotalValue();
    }
    this.cdr.markForCheck();
  }

  calculateTotalValue(): void {
    if (this.selectedLot && this.bidAmount > 0) {
      this.totalLotValue =
        this.bidAmount * this.selectedLot.coffeeLot.quantityLbs;
    }
  }

  proceedToConfirm(): void {
    if (this.canProceedToConfirm()) {
      this.modalStep = 'confirm';
      this.cdr.markForCheck();
    }
  }

  backToSelection(): void {
    this.modalStep = 'select';
    this.cdr.markForCheck();
  }

  canProceedToConfirm(): boolean {
    if (!this.selectedLot) return false;
    const minBid = this.calculateMinBidAmount(this.selectedLot);
    return (
      this.selectedIncrement !== null ||
      (this.showManualBidInput && this.bidAmount >= minBid && !this.bidError)
    );
  }

  canConfirmBid(): boolean {
    return this.canProceedToConfirm() && !this.isLoading;
  }

  async placeBid() {
    if (!this.selectedLot || this.isLoading || this.auctionEnded) return;

    if (this.auctionData.length > 0) {
      const timeLeft = this.calculateTimeRemaining(this.auctionData[0]);
      const totalSecs =
        timeLeft.days * 86400 +
        timeLeft.hours * 3600 +
        timeLeft.minutes * 60 +
        timeLeft.seconds;
      if (totalSecs <= 3 && this.latency >= 1000) {
        this.bidError = this.translationService.translate(
          'AUCTION_SYNC.BLOCKED_AT_CLOSE',
        );
        this.cdr.markForCheck();
        return;
      }
    }

    this.isLoading = true;
    this.bidError = '';

    const bidData = {
      amount: this.bidAmount,
      auctionId: this.selectedLot.auctionId,
      coffeeLotId: this.selectedLot.coffeeLot.id,
      userId: this.userId,
    };

    this.buyerService.placeBid(bidData).subscribe({
      next: (response) => {
        this.loadAuctionData();
        this.userBidAmounts.set(this.selectedLot!.coffeeLot.id, this.bidAmount);
        this.showNotification(
          this.translationService.translate('NOTIFICATIONS.BID_SUCCESS'),
          'success',
        );
        this.closeBidModal();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.bidError =
          error.message ||
          this.translationService.translate('NOTIFICATIONS.BID_ERROR');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  async loadHighestBidsForLot(lot: AuctionDetail) {
    try {
      const highestBid = await this.buyerService
        .getHighestBidForCoffeeLot(lot.auctionId, lot.coffeeLot.id)
        .toPromise();
      if (highestBid) {
        this.highestBids.set(lot.coffeeLot.id, highestBid.amount);
        lot.currentPrice = highestBid.amount;
        this.cdr.markForCheck();
      }
    } catch (error) {}
  }

  filterLots() {
    if (!this.auctionData.length || !this.auctionData[0].auctionDetails) return;
    this.filteredLots = this.auctionData[0].auctionDetails.filter(
      (lot) =>
        lot.coffeeLot?.name
          ?.toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        lot.coffeeLot?.variety
          ?.toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        lot.coffeeLot?.region
          ?.toLowerCase()
          .includes(this.searchTerm.toLowerCase()),
    );
    this.sortLots();
    this.cdr.markForCheck();
  }

  sortLots() {
    this.filteredLots.sort((a, b) => {
      let valueA: any, valueB: any;
      switch (this.sortBy) {
        case 'position':
          valueA = Number(a.coffeeLot?.position) || 0;
          valueB = Number(b.coffeeLot?.position) || 0;
          break;
        case 'name':
          valueA = a.coffeeLot?.name?.toLowerCase() || '';
          valueB = b.coffeeLot?.name?.toLowerCase() || '';
          break;
        case 'score':
          valueA = a.coffeeLot?.cupScore || 0;
          valueB = b.coffeeLot?.cupScore || 0;
          break;
        default:
          valueA = Number(a.coffeeLot?.position) || 0;
          valueB = Number(b.coffeeLot?.position) || 0;
      }
      return this.sortDirection === 'asc'
        ? valueA > valueB
          ? 1
          : -1
        : valueA < valueB
          ? 1
          : -1;
    });
  }

  changeSort(criteria: string) {
    if (this.sortBy === criteria)
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else {
      this.sortBy = criteria;
      this.sortDirection = 'asc';
    }
    this.sortLots();
    this.cdr.markForCheck();
  }

  calculateTimeRemaining(auction: Auction): any {
    if (this.auctionEnded)
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        hasStarted: true,
        hasEnded: true,
      };
    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
    const now = this.currentTime;
    const hasStarted = now >= startDate;
    const hasEnded = now >= endDate;
    const targetDate = hasStarted ? endDate : startDate;
    const diff = Math.max(0, targetDate.getTime() - now.getTime());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      hasStarted,
      hasEnded,
    };
  }

  formatTimeRemaining(time: any): string {
    return time.days > 0
      ? `${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s`
      : `${time.hours}h ${time.minutes}m ${time.seconds}s`;
  }

  closeExtensionNotification() {
    this.showExtensionNotification = false;
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.cdr.markForCheck();
  }

  private setupConnectionMonitoring() {
    this.connectionCheckInterval = setInterval(() => {
      this.checkAuctionStatus();
    }, 30000);
  }

  private checkAuctionStatus() {
    if (this.auctionData.length === 0) return;
    const timeLeft = this.calculateTimeRemaining(this.auctionData[0]);
    if (timeLeft.hasEnded && !this.auctionEnded) {
      this.auctionEnded = true;
      if (this.auctionData[0]) this.auctionData[0].status = 'CLOSED';
      this.showNotification(
        this.translationService.translate('NOTIFICATIONS.AUCTION_ENDED_LOCAL'),
        'info',
      );
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
    if (this.bidSubscription) this.bidSubscription.unsubscribe();
    if (this.auctionExtendedSubscription)
      this.auctionExtendedSubscription.unsubscribe();
    if (this.auctionClosedSubscription)
      this.auctionClosedSubscription.unsubscribe();
    if (this.connectionCheckInterval)
      clearInterval(this.connectionCheckInterval);
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    if (this.auctionData.length > 0)
      this.buyerService.leaveAuctionRoom(this.auctionData[0].id);
  }

  getBidHistory(lotId: string): any[] {
    return this.lastBids.get(lotId) || [];
  }
  isUserHighestBidder(lotId: string): boolean {
    const userBid = this.userBidAmounts.get(lotId);
    const highestBid = this.highestBids.get(lotId);
    return (
      userBid !== undefined &&
      highestBid !== undefined &&
      userBid === highestBid
    );
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
  isLotAvailable(lot: AuctionDetail): boolean {
    if (this.auctionEnded) return false;
    if (this.auctionData.length === 0) return false;
    const tr = this.calculateTimeRemaining(this.auctionData[0]);
    return tr.hasStarted && !tr.hasEnded;
  }

  getTimeColor(time: any): string {
    return time.hasEnded
      ? 'text-danger'
      : time.hasStarted
        ? 'text-success'
        : 'text-warning';
  }
  getStatusText(time: any): string {
    return time.hasEnded
      ? 'Finalizada'
      : time.hasStarted
        ? 'En curso'
        : 'Próximamente';
  }

  getConnectionQualityText(): string {
    switch (this.connectionQuality) {
      case 'excellent':
        return this.translationService.translate(
          'AUCTION_SYNC.QUALITY.EXCELLENT',
        );
      case 'good':
        return this.translationService.translate('AUCTION_SYNC.QUALITY.GOOD');
      case 'fair':
        return this.translationService.translate('AUCTION_SYNC.QUALITY.FAIR');
      case 'poor':
        return this.translationService.translate('AUCTION_SYNC.QUALITY.POOR');
      case 'offline':
        return this.translationService.translate(
          'AUCTION_SYNC.QUALITY.OFFLINE',
        );
      default:
        return this.translationService.translate(
          'AUCTION_SYNC.QUALITY.UNKNOWN',
        );
    }
  }

  getConnectionQualityColor(): string {
    switch (this.connectionQuality) {
      case 'excellent':
        return 'text-success';
      case 'good':
        return 'text-primary';
      case 'fair':
        return 'text-warning';
      case 'poor':
        return 'text-danger';
      case 'offline':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  }
}
