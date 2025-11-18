import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { BuyerService } from '../buyer.service';
import { interval, Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeneralService } from '../../../core/gerneral.service';

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
}

interface AuctionDetail {
  id: string;
  startingPrice: number;
  currentPrice: number;
  reservePrice: number | null;
  coffeeLot: CoffeeLot;
  auctionId: string;
  coffeeLotId: string;
  position: number; // ✅ NUEVA PROPIEDAD
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
  imports: [CommonModule, FormsModule],
  templateUrl: './buyer-auction.component.html',
  styleUrl: './buyer-auction.component.scss'
})
export class BuyerAuctionComponent implements OnInit, OnDestroy {
  userId: string = ''; 
  auctionData: Auction[] = [];
  currentTime: Date = new Date();
  filteredLots: AuctionDetail[] = [];
  searchTerm: string = '';
  sortBy: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  private timerSubscription!: Subscription;
  private bidSubscription!: Subscription;
  private auctionExtendedSubscription!: Subscription;
  private highestBids: Map<string, number> = new Map();
  userBidAmounts: Map<string, number> = new Map();
  lastBids: Map<string, any[]> = new Map();
  showBidModal: boolean = false;
  selectedLot: AuctionDetail | null = null;
  bidAmount: number = 0;
  bidError: string = '';
  isLoading: boolean = false;
  showExtensionNotification: boolean = false;
  extensionMessage: string = '';
  private notificationTimeout: any;

  private auctionClosedSubscription!: Subscription; // NUEVO
  auctionEnded: boolean = false; // NUEVO: para controlar el estado

  constructor(
    private buyerService: BuyerService,
    private generalService: GeneralService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const dataUser: any = this.generalService.getUser();
      this.userId = dataUser.id;
      // PRIMERO configurar WebSocket, LUEGO cargar datos
    this.setupWebSocket();
    await this.loadAuctionData();
    }
  }

  async loadAuctionData() {
    try {
      const data = await this.buyerService.getAuctionsLotsActive().toPromise();
      this.auctionData = data;
      
      if (this.auctionData.length > 0 && this.auctionData[0].auctionDetails) {
        this.filteredLots = [...this.auctionData[0].auctionDetails];
        console.log(this.filteredLots);
        
        // Unirse a la sala de la subasta
        this.buyerService.joinAuctionRoom(this.auctionData[0].id);
        
        // Cargar pujas más altas para cada lote
        await this.loadHighestBids();
        // Cargar historial de pujas
        await this.loadBidHistory();
      }
      
      // Iniciar el contador regresivo
      this.timerSubscription = interval(1000).subscribe(() => {
        this.currentTime = new Date();
      });
    } catch (error) {
      console.error('Error loading auction data:', error);
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
        console.error('Error loading highest bid for lot:', error);
        try {
          const generalBid = await this.buyerService
            .getHighestBidForCoffeeLot(lot.auctionId, lot.coffeeLot.id)
            .toPromise();
          
          if (generalBid && generalBid.coffeeLotId === lot.coffeeLot.id) {
            this.highestBids.set(lot.coffeeLot.id, generalBid.amount);
            lot.currentPrice = generalBid.amount;
          }
        } catch (fallbackError) {
          console.error('Error loading general highest bid:', fallbackError);
        }
      }
    }
  }

  setupWebSocket() {
    if (this.bidSubscription) {
      return;
    }
    console.log('🔌 Configurando WebSocket listeners...');
    // Suscripción a nuevas pujas
    this.bidSubscription = this.buyerService.getNewBids().subscribe((newBid: Bid) => {
      console.log('New bid received via WebSocket:', newBid);
      this.handleNewBid(newBid);
    });

    // Suscripción a extensiones de subasta
    this.auctionExtendedSubscription = this.buyerService.getAuctionExtended().subscribe((extensionData: any) => {
      console.log('Auction extended received:', extensionData);
      this.handleAuctionExtension(extensionData);
    });

     // NUEVO: Suscripción a cierre de subasta
    this.auctionClosedSubscription = this.buyerService.getAuctionClosed().subscribe((closeData: any) => {
      console.log('Auction closed received:', closeData);
      this.handleAuctionClosed(closeData);
    });

     // Verificar estado de conexión
  this.buyerService.getConnectionStatus().subscribe((connected: boolean) => {
    console.log('📡 WebSocket connection status:', connected);
  });
  }

  handleAuctionClosed(closeData: any) {
  if (this.auctionData.length > 0 && this.auctionData[0].id === closeData.auctionId) {
    this.auctionEnded = true;
    
    // Actualizar el estado de la subasta
    this.auctionData[0].status = 'CLOSED';
    
    // Mostrar notificación de cierre
    this.showExtensionNotification = true;
    this.extensionMessage = '¡Subasta finalizada definitivamente!';
    
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationTimeout = setTimeout(() => {
      this.showExtensionNotification = false;
    }, 5000);

    // Forzar actualización inmediata
    this.currentTime = new Date();
    
    console.log('🔚 Subasta cerrada definitivamente');
  }
}

  handleNewBid(bid: Bid) {
    // Actualizar el precio actual del lote correspondiente
    this.filteredLots = this.filteredLots.map(lot => {
      if (lot.coffeeLot.id === bid.coffeeLotId) {
        return {
          ...lot,
          currentPrice: bid.amount
        };
      }
      return lot;
    });

    // Actualizar el mapa de pujas más altas
    this.highestBids.set(bid.coffeeLotId, bid.amount);

    // Actualizar el historial de pujas
    this.updateBidHistory(bid);
  }

  // En buyer-auction.component.ts - modifica el método handleAuctionExtension
handleAuctionExtension(extensionData: any) {
  // Actualizar la fecha de fin de la subasta en los datos locales
  if (this.auctionData.length > 0 && this.auctionData[0].id === extensionData.auctionId) {
    this.auctionData[0].endDate = extensionData.newEndDate;
    console.log(`¡Subasta extendida! Nueva hora de cierre: ${new Date(extensionData.newEndDate).toLocaleTimeString()}`);
    
    // Mostrar notificación
    this.showExtensionNotification = true;
    this.extensionMessage = `¡Subasta extendida! Nueva hora de cierre: ${new Date(extensionData.newEndDate).toLocaleTimeString()}`;
    
    // Ocultar notificación después de 5 segundos
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationTimeout = setTimeout(() => {
      this.showExtensionNotification = false;
    }, 5000);

    // Forzar actualización del timer inmediatamente
    this.currentTime = new Date();
    
    console.log('🔄 Subasta extendida - Nuevo endDate:', extensionData.newEndDate);
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
        console.error('Error loading bid history for lot', lot.coffeeLot.id, error);
        this.lastBids.set(lot.coffeeLot.id, []);
      }
    }
  }

  updateBidHistory(newBid: any) {
    const currentBids = this.lastBids.get(newBid.coffeeLotId) || [];
    const updatedBids = [newBid, ...currentBids].slice(0, 5);
    this.lastBids.set(newBid.coffeeLotId, updatedBids);
  }

  openBidModal(lot: AuctionDetail) {
    this.selectedLot = lot;
    this.bidAmount = this.calculateMinBidAmount(lot);
    this.bidError = '';
    this.showBidModal = true;
  }

  closeBidModal() {
    this.showBidModal = false;
    this.selectedLot = null;
    this.bidAmount = 0;
    this.bidError = '';
  }

  calculateMinBidAmount(lot: AuctionDetail): number {
    const currentHighest = this.highestBids.get(lot.coffeeLot.id) || lot.currentPrice;
    const auction = this.auctionData[0];
    return currentHighest + auction.minIncrement;
  }

  async placeBid() {
    if (!this.selectedLot || this.isLoading) return;

    this.isLoading = true;
    this.bidError = '';

    try {
      const bidData = {
        amount: this.bidAmount,
        auctionId: this.selectedLot.auctionId,
        coffeeLotId: this.selectedLot.coffeeLot.id,
        userId: this.userId
      };

      const response = await this.buyerService.placeBid(bidData).toPromise();

      this.userBidAmounts.set(this.selectedLot.coffeeLot.id, this.bidAmount);

      if (response.data && response.lastBids) {
        this.lastBids.set(this.selectedLot.coffeeLot.id, response.lastBids);
      }

      // Verificar si la subasta fue extendida
      if (response.auctionExtended) {
        this.showExtensionNotification = true;
        this.extensionMessage = '¡Subasta extendida por 3 minutos!';
        
        if (this.notificationTimeout) {
          clearTimeout(this.notificationTimeout);
        }
        this.notificationTimeout = setTimeout(() => {
          this.showExtensionNotification = false;
        }, 5000);
      }

      this.closeBidModal();
    } catch (error: any) {
      this.bidError = error.message || 'Error al realizar la puja';
    } finally {
      this.isLoading = false;
    }
  }

  // Filtrar lotes según término de búsqueda
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

  // Ordenar lotes
  // Ordenar lotes
sortLots() {
  this.filteredLots.sort((a, b) => {
    let valueA, valueB;
    
    switch (this.sortBy) {
      case 'position': // ✅ NUEVA OPCIÓN DE ORDENAMIENTO
        valueA = a.position;
        valueB = b.position;
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
        valueA = a.position; // ✅ POR DEFECTO ORDENAR POR POSICIÓN
        valueB = b.position;
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

  // Cambiar criterio de ordenamiento
  changeSort(criteria: string) {
    if (this.sortBy === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criteria;
      this.sortDirection = 'asc';
    }
    this.sortLots();
  }

  // Calcular el tiempo restante para el inicio o fin de la subasta
  calculateTimeRemaining(auction: Auction): { days: number, hours: number, minutes: number, seconds: number, hasStarted: boolean, hasEnded: boolean } {
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

  // Formatear el tiempo restante para mostrar
  formatTimeRemaining(time: { days: number, hours: number, minutes: number, seconds: number }): string {
    if (time.days > 0) {
      return `${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s`;
    } else {
      return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
    }
  }

  // Cerrar notificación de extensión manualmente
  closeExtensionNotification() {
    this.showExtensionNotification = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    if (this.bidSubscription) {
      this.bidSubscription.unsubscribe();
      this.bidSubscription = undefined!;
    }

    if (this.auctionExtendedSubscription) {
      this.auctionExtendedSubscription.unsubscribe();
      this.auctionExtendedSubscription = undefined!;
    }

       // NUEVO: Desuscribirse del cierre de subasta
    if (this.auctionClosedSubscription) {
      this.auctionClosedSubscription.unsubscribe();
      this.auctionClosedSubscription = undefined!;
    }

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    if (this.auctionData.length > 0) {
      this.buyerService.leaveAuctionRoom(this.auctionData[0].id);
    }
  }
}