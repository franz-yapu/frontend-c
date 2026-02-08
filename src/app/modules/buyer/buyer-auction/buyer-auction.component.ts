import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { BuyerService } from '../buyer.service';
import { interval, Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeneralService } from '../../../core/gerneral.service';
import { TranslateDirective } from '../../../project/directive/translate.directive';
import { ConnectionQualityService } from '../../../project/services/connection-quality.service';
import { TimeSyncService } from '../../../project/services/time-sync.service';

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
  imports: [CommonModule, FormsModule, TranslateDirective],
  templateUrl: './buyer-auction.component.html',
  styleUrl: './buyer-auction.component.scss'
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

  // Agregar estas propiedades a la clase:
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline' = 'good';
  latency: number = 0;
  showConnectionWarning: boolean = false;

  // En el constructor, agregar:
 

  constructor(
    private buyerService: BuyerService,
    private generalService: GeneralService,
    private connectionQualityService: ConnectionQualityService,
    private timeSyncService: TimeSyncService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  async ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    const dataUser: any = this.generalService.getUser();
    this.userId = dataUser.id;
    
    // Sincronizar tiempo primero
    await this.timeSyncService.syncWithServer();
    
    await this.loadAuctionData();
    this.setupWebSocket();
    this.setupConnectionQuality();
    this.setupConnectionMonitoring();
    
    // Usar tiempo sincronizado
    this.timerSubscription = this.timeSyncService.getCurrentTimeObservable().subscribe(time => {
      this.currentTime = time;
    });
  }
}

  async loadAuctionData() {
    try {
      this.isLoading = true;
      const data = await this.buyerService.getAuctionsLotsActive().toPromise();
      this.auctionData = data;

      if (this.auctionData.length > 0 && this.auctionData[0].auctionDetails) {
        this.filteredLots = [...this.auctionData[0].auctionDetails].sort((a, b) => {
          return (Number(a.coffeeLot.position) || 0) - (Number(b.coffeeLot.position) || 0);
        });

        console.log('📦 Lotes cargados:', this.filteredLots.length);

        this.buyerService.joinAuctionRoom(this.auctionData[0].id);
        await this.loadHighestBids();
        await this.loadBidHistory();
      }

      this.timerSubscription = interval(1000).subscribe(() => {
        this.currentTime = new Date();
      });
    } catch (error) {
      console.error('Error loading auction data:', error);
      this.showNotification('Error al cargar datos de la subasta', 'error');
    } finally {
      this.isLoading = false;
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
      } catch (error) {
        console.error('Error loading highest bid for lot:', lot.coffeeLot.name, error);
      }
    }
  }

  async loadBidHistory() {
    for (const lot of this.filteredLots) {
      try {
        const bids = await this.buyerService
          .getLastBids(lot.auctionId, lot.coffeeLot.id, 5)
          .toPromise();
        this.lastBids.set(lot.coffeeLot.id, bids || []);
      } catch (error) {
        console.error('Error loading bid history:', error);
        this.lastBids.set(lot.coffeeLot.id, []);
      }
    }
  }

 setupWebSocket() {
  if (this.bidSubscription) return;

  console.log('🔌 Configurando WebSocket listeners...');

  this.bidSubscription = this.buyerService.getNewBids().subscribe((newBid: Bid) => {
    console.log('🔄 Nueva puja recibida via WebSocket:', newBid);
    this.handleNewBid(newBid);
  });

  this.auctionExtendedSubscription = this.buyerService.getAuctionExtended().subscribe((extensionData: any) => {
    console.log('🔄 Extensión de subasta recibida:', extensionData);
    this.handleAuctionExtension(extensionData);
  });

  this.auctionClosedSubscription = this.buyerService.getAuctionClosed().subscribe((closeData: any) => {
    console.log('🔚 Cierre de subasta recibido:', closeData);
    this.handleAuctionClosed(closeData);
  });

  this.buyerService.getConnectionStatus().subscribe((connected: boolean) => {
    if (!connected) {
      this.showNotification('Conexión perdida. Reconectando...', 'warning');
    } else {
      console.log('✅ WebSocket reconectado');
      // Recargar datos cuando se reconecta
      this.loadAuctionData();
    }
  });
}

  handleNewBid(bid: Bid) {
    console.log('🔄 Nueva puja recibida para lote:', bid.coffeeLotId);

    const updatedLots = this.filteredLots.map(lot => {
      if (lot.coffeeLot.id === bid.coffeeLotId) {
        return { ...lot, currentPrice: bid.amount };
      }
      return lot;
    });

    this.filteredLots = updatedLots.sort((a, b) => {
      return (Number(a.coffeeLot.position) || 0) - (Number(b.coffeeLot.position) || 0);
    });

    this.highestBids.set(bid.coffeeLotId, bid.amount);
    this.updateBidHistory(bid);

    if (this.selectedLot?.coffeeLot.id === bid.coffeeLotId) {
      this.updateSelectedLotPrice();
    }
  }

  updateSelectedLotPrice() {
    if (this.selectedLot) {
      const newPrice = this.highestBids.get(this.selectedLot.coffeeLot.id) || this.selectedLot.currentPrice;
      this.selectedLot = { ...this.selectedLot, currentPrice: newPrice };
    }
  }

  updateBidHistory(newBid: any) {
    const currentBids = this.lastBids.get(newBid.coffeeLotId) || [];
    const updatedBids = [newBid, ...currentBids].slice(0, 5);
    this.lastBids.set(newBid.coffeeLotId, updatedBids);
  }

 handleAuctionExtension(extensionData: any) {
  console.log('🔄 Procesando extensión de subasta:', extensionData);
  
  if (this.auctionData.length > 0 && this.auctionData[0].id === extensionData.auctionId) {
    // Actualizar fecha de fin
    this.auctionData[0].endDate = extensionData.newEndDate;
    
    // Actualizar auctionEnded si estaba marcada como finalizada
    if (this.auctionEnded) {
      this.auctionEnded = false;
      this.auctionData[0].status = 'ACTIVE';
    }
    
    // Mostrar notificación
    const newEndTime = new Date(extensionData.newEndDate);
    const formattedTime = newEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.showNotification(`¡Subasta extendida hasta las ${formattedTime}!`, 'info');
    
    // Actualizar tiempo actual
    this.currentTime = this.timeSyncService.getCurrentTime();
  }
}

 handleAuctionClosed(closeData: any) {
  console.log('🔚 Procesando cierre de subasta:', closeData);
  
  if (this.auctionData.length > 0 && this.auctionData[0].id === closeData.auctionId) {
    this.auctionEnded = true;
    this.auctionData[0].status = 'CLOSED';
    
    // Mostrar notificación
    this.showNotification('¡Subasta finalizada definitivamente!', 'info');
    
    // Actualizar tiempo actual
    this.currentTime = this.timeSyncService.getCurrentTime();
    
    // Deshabilitar botones de puja
    this.filteredLots.forEach(lot => {
      // Los botones ya se deshabilitarán por la lógica de isLotAvailable
    });
  }
}

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.extensionMessage = message;
    this.showExtensionNotification = true;

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notificationTimeout = setTimeout(() => {
      this.showExtensionNotification = false;
    }, 5000);
  }

  // En openBidModal, actualiza para que sea consistente:
  openBidModal(lot: AuctionDetail) {
    this.selectedLot = lot;
    // Establecer bidAmount como el precio actual (no el mínimo)
    this.bidAmount = lot.currentPrice;
    this.selectedIncrement = null;
    this.showManualBidInput = false;
    this.modalStep = 'select';
    this.bidError = '';
    this.totalLotValue = 0;
    this.showBidModal = true;
  }

  closeBidModal() {
    this.showBidModal = false;
    this.selectedLot = null;
    this.bidAmount = 0;
    this.bidError = '';
    this.modalStep = 'select';
    this.totalLotValue = 0;
  }

  calculateMinBidAmount(lot: AuctionDetail): number {
    const currentHighest = this.highestBids.get(lot.coffeeLot.id) || lot.currentPrice;
    const auction = this.auctionData[0];
    return currentHighest + auction.minIncrement;
  }

  selectQuickIncrement(increment: number): void {
    if (this.selectedLot) {
      // Obtener el precio actual del lote (no el mínimo requerido)
      const currentPrice = this.selectedLot.currentPrice;
      // Sumar el incremento rápido directamente al precio actual
      this.bidAmount = currentPrice + increment;
      this.selectedIncrement = increment;
      this.showManualBidInput = false;
      this.bidError = '';
      this.calculateTotalValue();
    }
  }

  // En showManualInput, cambia para que use el monto mínimo requerido:
  showManualInput(): void {
    this.showManualBidInput = true;
    this.selectedIncrement = null;
    // Para input manual, se usa el monto mínimo requerido
    this.bidAmount = this.calculateMinBidAmount(this.selectedLot!);
    this.bidError = '';
    this.calculateTotalValue();
  }

  onManualBidChange(): void {
    if (!this.selectedLot) return;

    const minBid = this.calculateMinBidAmount(this.selectedLot);

    if (this.bidAmount <= 0) {
      this.bidError = 'Ingresa un monto válido';
    } else if (this.bidAmount < minBid) {
      this.bidError = `El monto mínimo es $${minBid.toFixed(2)}`;
    } else {
      this.bidError = '';
      this.calculateTotalValue();
    }
  }

  calculateTotalValue(): void {
    if (this.selectedLot && this.bidAmount > 0) {
      this.totalLotValue = this.bidAmount * this.selectedLot.coffeeLot.quantityLbs;
    } else {
      this.totalLotValue = 0;
    }
  }

  proceedToConfirm(): void {
    if (this.canProceedToConfirm()) {
      this.modalStep = 'confirm';
    }
  }

  backToSelection(): void {
    this.modalStep = 'select';
  }

  canProceedToConfirm(): boolean {
    if (!this.selectedLot) return false;

    const minBid = this.calculateMinBidAmount(this.selectedLot);
    const hasValidQuickIncrement = this.selectedIncrement !== null;
    const hasValidManualBid = this.showManualBidInput && this.bidAmount >= minBid && !this.bidError;

    return (hasValidQuickIncrement || hasValidManualBid);
  }

  canConfirmBid(): boolean {
    return this.canProceedToConfirm() && !this.isLoading;
  }

async placeBid() {
  if (!this.selectedLot || this.isLoading) return;

  // Verificar que la subasta esté activa
  if (this.auctionEnded) {
    this.bidError = 'La subasta ha finalizado. No se pueden realizar más pujas.';
    this.showNotification('Subasta finalizada', 'error');
    return;
  }

  // Verificar tiempo restante
  const timeRemaining = this.calculateTimeRemaining(this.auctionData[0]);
  if (!timeRemaining.hasStarted || timeRemaining.hasEnded) {
    this.bidError = 'La subasta no está activa en este momento.';
    this.showNotification('Subasta no activa', 'error');
    return;
  }

  // Verificar calidad de conexión
  if (this.connectionQuality === 'offline') {
    this.bidError = 'Sin conexión a internet. No se puede realizar la puja.';
    this.showNotification('Sin conexión a internet', 'error');
    return;
  }

  this.isLoading = true;
  this.bidError = '';

  try {
    const bidData = {
      amount: this.bidAmount,
      auctionId: this.selectedLot.auctionId,
      coffeeLotId: this.selectedLot.coffeeLot.id,
      userId: this.userId
    };

    console.log('📤 Enviando puja:', bidData);

    // Aumentar timeout para conexiones lentas
    const response = await this.buyerService.placeBid(bidData).toPromise();
    
    console.log('✅ Puja exitosa:', response);
    
    // Actualizar datos locales
    this.userBidAmounts.set(this.selectedLot.coffeeLot.id, this.bidAmount);

    if (response.data && response.lastBids) {
      this.lastBids.set(this.selectedLot.coffeeLot.id, response.lastBids);
    }

    // Verificar si la subasta fue extendida
    if (response.auctionExtended) {
      this.showNotification('¡Subasta extendida 3 minutos!', 'info');
      // Recargar datos de la subasta
      await this.loadAuctionData();
    }

    this.showNotification('¡Puja realizada exitosamente!', 'success');
    this.closeBidModal();
    
  } catch (error: any) {
    console.error('❌ Error al pujar:', error);
    
    // Manejar diferentes tipos de errores
    if (error.message?.includes('precio actual') || error.message?.includes('mayor al precio')) {
      // Recargar precio actual
      await this.loadHighestBidsForLot(this.selectedLot);
      const newMinBid = this.calculateMinBidAmount(this.selectedLot);
      this.bidAmount = newMinBid;
      this.bidError = `El precio ha cambiado. Nuevo monto mínimo: $${newMinBid.toFixed(2)}`;
    } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      this.bidError = 'La puja tardó demasiado en procesarse. Verifica tu conexión e intenta nuevamente.';
      this.showNotification('Timeout en la puja', 'warning');
    } else if (error.message?.includes('conexión') || error.message?.includes('Socket')) {
      this.bidError = 'Problema de conexión. Verifica tu internet e intenta nuevamente.';
      this.showNotification('Error de conexión', 'error');
    } else if (error.message?.includes('finalizada') || error.message?.includes('finalizado')) {
      this.bidError = 'La subasta ha finalizado. No se pueden realizar más pujas.';
      this.auctionEnded = true;
      this.showNotification('Subasta finalizada', 'info');
    } else {
      this.bidError = error.message || 'Error al procesar la puja';
    }
    
    this.modalStep = 'select';
  } finally {
    this.isLoading = false;
  }
}

  async loadHighestBidsForLot(lot: AuctionDetail) {
    try {
      const highestBid = await this.buyerService
        .getHighestBidForCoffeeLot(lot.auctionId, lot.coffeeLot.id)
        .toPromise();

      if (highestBid) {
        this.highestBids.set(lot.coffeeLot.id, highestBid.amount);
        lot.currentPrice = highestBid.amount;

        this.filteredLots = this.filteredLots.map(filteredLot => {
          if (filteredLot.coffeeLot.id === lot.coffeeLot.id) {
            return { ...filteredLot, currentPrice: highestBid.amount };
          }
          return filteredLot;
        });
      }
    } catch (error) {
      console.error('Error cargando precio más alto:', error);
    }
  }

  filterLots() {
    if (!this.auctionData.length || !this.auctionData[0].auctionDetails) return;

    this.filteredLots = this.auctionData[0].auctionDetails.filter(lot =>
      lot.coffeeLot.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      lot.coffeeLot.variety.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      lot.coffeeLot.region.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      lot.coffeeLot.country.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.sortLots();
  }

  sortLots() {
    this.filteredLots.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (this.sortBy) {
        case 'position':
          valueA = Number(a.coffeeLot.position) || 0;
          valueB = Number(b.coffeeLot.position) || 0;
          break;
        case 'name':
          valueA = a.coffeeLot.name.toLowerCase();
          valueB = b.coffeeLot.name.toLowerCase();
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
          valueA = Number(a.coffeeLot.position) || 0;
          valueB = Number(b.coffeeLot.position) || 0;
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

  changeSort(criteria: string) {
    if (this.sortBy === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criteria;
      this.sortDirection = 'asc';
    }
    this.sortLots();
  }

  calculateTimeRemaining(auction: Auction): {
  days: number,
  hours: number,
  minutes: number,
  seconds: number,
  hasStarted: boolean,
  hasEnded: boolean
} {
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

// Agregar método para verificar estado de subasta desde el servidor:
async checkAuctionStatusFromServer() {
  try {
    const auction = this.auctionData[0];
    if (!auction) return;
    
    // Podrías agregar un endpoint en el backend para verificar estado
    // Por ahora, usamos el tiempo sincronizado
    const serverTime = this.timeSyncService.getCurrentTime();
    const endDate = new Date(auction.endDate);
    
    if (serverTime >= endDate && !this.auctionEnded) {
      this.auctionEnded = true;
      this.auctionData[0].status = 'CLOSED';
      this.showNotification('¡Subasta finalizada!', 'info');
    }
  } catch (error) {
    console.error('Error verificando estado de subasta:', error);
  }
}

  formatTimeRemaining(time: { days: number, hours: number, minutes: number, seconds: number }): string {
    if (time.days > 0) {
      return `${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s`;
    } else {
      return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
    }
  }

  closeExtensionNotification() {
    this.showExtensionNotification = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

 private setupConnectionMonitoring() {
  // Verificar estado de la subasta cada 30 segundos
  this.connectionCheckInterval = setInterval(() => {
    this.checkAuctionStatus();
  }, 30000);
}

  private checkAuctionStatus() {
  if (this.auctionData.length === 0) return;
  
  const auction = this.auctionData[0];
  const timeRemaining = this.calculateTimeRemaining(auction);
  
  // Verificar si la subasta debería haber terminado
  if (timeRemaining.hasEnded && !this.auctionEnded) {
    console.log('⚠️ Subasta debería haber terminado según tiempo local');
    this.auctionEnded = true;
    this.auctionData[0].status = 'CLOSED';
    this.showNotification('Subasta finalizada (verificación local)', 'info');
  }
  
  // Verificar conexión WebSocket
  this.buyerService.getConnectionStatus().subscribe(connected => {
    if (!connected) {
      console.warn('⚠️ Conexión WebSocket perdida');
    }
  });
}

  ngOnDestroy() {
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
    if (this.bidSubscription) this.bidSubscription.unsubscribe();
    if (this.auctionExtendedSubscription) this.auctionExtendedSubscription.unsubscribe();
    if (this.auctionClosedSubscription) this.auctionClosedSubscription.unsubscribe();
    if (this.connectionCheckInterval) clearInterval(this.connectionCheckInterval);
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);

    if (this.auctionData.length > 0) {
      this.buyerService.leaveAuctionRoom(this.auctionData[0].id);
    }
  }

  getBidHistory(lotId: string): any[] {
    return this.lastBids.get(lotId) || [];
  }

  hasUserBid(lotId: string): boolean {
    return this.userBidAmounts.has(lotId);
  }

  getUserBidAmount(lotId: string): number | null {
    return this.userBidAmounts.get(lotId) || null;
  }

  isUserHighestBidder(lotId: string): boolean {
    const userBid = this.userBidAmounts.get(lotId);
    const highestBid = this.highestBids.get(lotId);
    return userBid !== undefined && highestBid !== undefined && userBid === highestBid;
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  isLotAvailable(lot: AuctionDetail): boolean {
    if (this.auctionEnded) return false;

    const timeRemaining = this.calculateTimeRemaining(this.auctionData[0]);
    return timeRemaining.hasStarted && !timeRemaining.hasEnded;
  }

  getTimeColor(time: { hasStarted: boolean, hasEnded: boolean }): string {
    if (time.hasEnded) return 'text-danger';
    if (time.hasStarted) return 'text-success';
    return 'text-warning';
  }

  getStatusText(time: { hasStarted: boolean, hasEnded: boolean }): string {
    if (time.hasEnded) return 'Finalizada';
    if (time.hasStarted) return 'En curso';
    return 'Próximamente';
  }

// En setupConnectionQuality, corregir:
private setupConnectionQuality() {
  // Suscribirse a cambios de calidad
  this.connectionQualityService.quality$.subscribe(quality => {
    console.log(`📡 Calidad de conexión cambiada: ${quality}`);
    this.connectionQuality = quality;
    this.showConnectionWarning = quality === 'poor' || quality === 'offline';
  });
  
  // Suscribirse a cambios de latencia
  this.connectionQualityService.latency$.subscribe(latency => {
    this.latency = latency;
    
    // Mostrar notificación solo si la latencia es muy alta
    if (latency > 1000 && this.connectionQuality !== 'offline') {
      this.showNotification(`Conexión lenta (${latency}ms). Las pujas pueden tardar.`, 'warning');
    }
  });
  
  // Suscribirse a cambios de estado online
  this.connectionQualityService.isOnline$.subscribe(isOnline => {
    if (!isOnline) {
      this.showNotification('Sin conexión a internet. Las pujas no se podrán realizar.', 'error');
    } else if (this.connectionQuality === 'offline') {
      this.showNotification('Conexión restablecida', 'success');
    }
  });
}


// Agregar estos métodos para UI:
getConnectionQualityText(): string {
  return this.connectionQualityService.getQualityText();
}

getConnectionQualityColor(): string {
  return this.connectionQualityService.getQualityColor();
}
}