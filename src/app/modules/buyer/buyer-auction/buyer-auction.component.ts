import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  HostListener,
  inject,
  signal,
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
import { LotDetailComponent } from '../../../project/components/auction-view/lot-detail/lot-detail.component';
import {
  LotsTableComponent,
  LotColumn,
  LotRow,
} from '../../../project/components/lots-view/lots-table.component';
import { ViewModeToggleComponent } from '../../../project/components/lots-view/view-mode-toggle.component';
import {
  ViewMode,
  ViewModeService,
} from '../../../project/components/lots-view/view-mode.service';

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
  imports: [
    CommonModule,
    FormsModule,
    TranslateDirective,
    TranslatePipe,
    LotDetailComponent,
    LotsTableComponent,
    ViewModeToggleComponent,
  ],
  templateUrl: './buyer-auction.component.html',
  styleUrl: './buyer-auction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyerAuctionComponent implements OnInit, OnDestroy {
  userId: string = '';

  // ---------------------------------------------------------- vista tabla --
  private viewModeService = inject(ViewModeService);
  readonly viewMode = signal<ViewMode>(
    this.viewModeService.leer('buyer', 'table'),
  );
  readonly columnasTabla: LotColumn[] = [
    'position',
    'name',
    'score',
    'process',
    'origin',
    'quantity',
    'price',
    'leader',
    'value',
  ];
  /** Lote cuya fila parpadea porque acaba de recibir una puja. */
  pulsoLotId: string | null = null;
  private pulsoTimeout: any;

  /** Lote abierto en el modal de descripcion (antes solo existia en la vista
   *  publica: el comprador pujaba sin poder leer la ficha del cafe). */
  lotDetalle: AuctionDetail | null = null;

  cambiarVista(modo: ViewMode): void {
    this.viewMode.set(modo);
    this.viewModeService.guardar('buyer', modo);
  }

  /** Traduce los lotes a la forma que entiende la tabla compartida. */
  get filasTabla(): LotRow[] {
    return this.filteredLots.map((detail) => {
      const lote = detail.coffeeLot;
      const precio = this.currentHighestFor(detail);
      const ganando = this.esGanador(detail);
      return {
        id: detail.id,
        lotId: lote.id,
        position: lote.position,
        name: lote.name,
        subtitle: [lote.variety, lote.producerName || lote.seller]
          .filter((x) => !!x)
          .join(' • '),
        score: lote.cupScore ?? null,
        process: lote.process,
        altitude: lote.altitude ?? null,
        origin: this.lotLocation(lote),
        quantity: lote.quantityLbs ?? null,
        price: precio ?? null,
        value: precio ? precio * (lote.quantityLbs || 0) : null,
        bidsCount: null,
        leaderName: this.nombreLider(detail),
        destacada: ganando,
        destacadaTexto: ganando
          ? this.translationService.translate('AUCTION-BUYER.YOU_ARE_WINNING')
          : null,
        raw: detail,
      } as LotRow;
    });
  }

  /** La puja mas alta que conocemos de un lote, o null si no hay ninguna. */
  private mejorPuja(lotId: string): any | null {
    const pujas = this.lastBids.get(lotId) || [];
    if (!pujas.length) return null;
    return pujas.reduce((a: any, b: any) =>
      Number(b.amount) > Number(a.amount) ? b : a,
    );
  }

  /** true si la puja mas alta que conocemos de ese lote es del usuario. */
  esGanador(detail: AuctionDetail): boolean {
    if (!this.userId) return false;
    const mayor = this.mejorPuja(detail.coffeeLot.id);
    return !!mayor && (mayor.userId || mayor.user?.id) === this.userId;
  }

  /** Quien va ganando el lote: la empresa del mejor postor y, si no la tiene,
   *  su nombre y apellido. Null mientras no haya pujas. */
  nombreLider(detail: AuctionDetail): string | null {
    const mayor = this.mejorPuja(detail.coffeeLot.id);
    if (!mayor) return null;
    const u = mayor.user || {};
    const empresa = (u.companyName || '').trim();
    if (empresa) return empresa;
    const persona = [u.firstName, u.lastName]
      .map((x: any) => (x || '').trim())
      .filter((x: string) => x.length > 0)
      .join(' ');
    return persona || null;
  }

  openLotDetail(detail: AuctionDetail): void {
    this.lotDetalle = detail;
    this.lockPageScroll(true);
    this.cdr.markForCheck();
  }

  closeLotDetail(): void {
    this.lotDetalle = null;
    // Si el modal de puja sigue abierto, el scroll debe quedarse bloqueado.
    this.lockPageScroll(this.showBidModal);
    this.cdr.markForCheck();
  }
  get quickIncrements(): number[] {
    const paso = Number(this.auctionData[0]?.minIncrement) || 1;
    return [1, 2, 4, 10].map((n) => this.roundMoney(paso * n));
  }

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

    // Antes se reordenaba a la fuerza por posicion en cada puja, lo que tiraba
    // por tierra el orden que hubiera elegido el usuario (se nota mucho en la
    // tabla: ordenas por precio, alguien puja y saltan las filas). Ahora se
    // respeta el criterio activo.
    this.filteredLots = updatedLots;
    this.sortLots();

    this.highestBids.set(bid.coffeeLotId, bid.amount);
    this.updateBidHistory(bid);
    this.marcarPulso(bid.coffeeLotId);

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

  /** Resalta un segundo la fila del lote que acaba de recibir una puja. En
   *  tarjetas se nota porque cambia el precio; en una tabla densa hay que
   *  señalarlo o pasa desapercibido. */
  private marcarPulso(lotId: string): void {
    this.pulsoLotId = lotId;
    if (this.pulsoTimeout) clearTimeout(this.pulsoTimeout);
    this.pulsoTimeout = setTimeout(() => {
      this.pulsoLotId = null;
      this.cdr.markForCheck();
    }, 1200);
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
    // Se precarga el minimo valido en vez del precio actual: asi la puja mas
    // habitual (subir lo justo) es un solo clic y el boton nace habilitado, en
    // lugar de aparecer gris sin explicar por que.
    this.bidAmount = this.roundMoney(this.calculateMinBidAmount(lot));
    this.selectedIncrement = null;
    this.showManualBidInput = true;
    this.modalStep = 'select';
    this.bidError = '';
    this.totalLotValue = 0;
    this.calculateTotalValue();
    this.showBidModal = true;
    this.lockPageScroll(true);
    this.cdr.markForCheck();
  }

  closeBidModal() {
    this.showBidModal = false;
    this.selectedLot = null;
    this.modalStep = 'select';
    this.lockPageScroll(false);
    this.cdr.markForCheck();
  }

  // Con el modal abierto la rueda del raton movia la pagina de detras. Se
  // congela el scroll del documento mientras esta abierto y se devuelve al
  // cerrarlo (tambien en ngOnDestroy, por si se navega con el modal abierto).
  private lockPageScroll(bloquear: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.style.overflow = bloquear ? 'hidden' : '';
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    // La ficha se abre por encima del modal de puja, asi que se cierra primero.
    if (this.lotDetalle) {
      this.closeLotDetail();
      return;
    }
    if (this.showBidModal) this.closeBidModal();
  }

  private roundMoney(valor: number): number {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
  }

  // Precio a superar: el mayor entre la ultima puja llegada por socket y el
  // precio guardado en el lote.
  currentHighestFor(lot: AuctionDetail): number {
    return this.highestBids.get(lot.coffeeLot.id) || lot.currentPrice;
  }

  // Minimo del lote abierto, para no repetir el calculo en la plantilla.
  get minBidForSelected(): number {
    return this.selectedLot
      ? this.roundMoney(this.calculateMinBidAmount(this.selectedLot))
      : 0;
  }

  // Cuanto sube la puja respecto a la oferta actual (mensaje de ayuda en vivo).
  get bidIncreaseOverCurrent(): number {
    if (!this.selectedLot) return 0;
    return this.roundMoney(
      Number(this.bidAmount) - this.currentHighestFor(this.selectedLot),
    );
  }

  // Precio final al que deja la puja cada boton de incremento; se enseña dentro
  // del propio boton para no tener que calcularlo de cabeza.
  quickIncrementResult(increment: number): number {
    if (!this.selectedLot) return 0;
    return this.roundMoney(
      Math.max(
        this.currentHighestFor(this.selectedLot) + increment,
        this.minBidForSelected,
      ),
    );
  }

  isBidValid(): boolean {
    const monto = Number(this.bidAmount);
    return (
      !!this.selectedLot && !isNaN(monto) && monto >= this.minBidForSelected
    );
  }

  calculateMinBidAmount(lot: AuctionDetail): number {
    const currentHighest =
      this.highestBids.get(lot.coffeeLot.id) || lot.currentPrice;
    const auction = this.auctionData[0];
    return currentHighest + (auction?.minIncrement || 1);
  }

  selectQuickIncrement(increment: number): void {
    if (!this.selectedLot) return;
    this.bidAmount = this.quickIncrementResult(increment);
    this.selectedIncrement = increment;
    this.showManualBidInput = true;
    this.bidError = '';
    this.calculateTotalValue();
    this.cdr.markForCheck();
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
    this.showManualBidInput = true;
    // Si el monto escrito ya no coincide con el incremento pulsado, se apaga su
    // resaltado para que no queden dos cosas marcadas a la vez.
    if (
      this.selectedIncrement !== null &&
      Number(this.bidAmount) !== this.quickIncrementResult(this.selectedIncrement)
    ) {
      this.selectedIncrement = null;
    }
    // El aviso de monto insuficiente lo pinta la propia plantilla debajo del
    // campo; bidError queda reservado para los errores del servidor o de la
    // conexion, para no enseñar dos veces el mismo mensaje.
    this.bidError = '';
    this.calculateTotalValue();
    this.cdr.markForCheck();
  }

  calculateTotalValue(): void {
    if (this.selectedLot && Number(this.bidAmount) > 0) {
      this.totalLotValue =
        Number(this.bidAmount) * this.selectedLot.coffeeLot.quantityLbs;
    } else {
      this.totalLotValue = 0;
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
    return this.isBidValid() && !this.bidError;
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
        // 'price' y 'quantity' no estaban contemplados y caian en el default,
        // asi que ordenar por ellos ordenaba en realidad por posicion.
        case 'price':
          valueA = Number(this.currentHighestFor(a)) || 0;
          valueB = Number(this.currentHighestFor(b)) || 0;
          break;
        case 'quantity':
          valueA = Number(a.coffeeLot?.quantityLbs) || 0;
          valueB = Number(b.coffeeLot?.quantityLbs) || 0;
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
    this.lockPageScroll(false);
    if (this.pulsoTimeout) clearTimeout(this.pulsoTimeout);
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

  // Municipio/region/pais unidos saltandose los vacios: sin esto los lotes sin
  // municipio se enseñaban como ", Caranavi, Bolivia".
  lotLocation(lot: CoffeeLot): string {
    return [lot.municipality, lot.region, lot.country]
      .map((parte) => (parte || '').trim())
      .filter((parte) => parte.length > 0)
      .join(', ');
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
