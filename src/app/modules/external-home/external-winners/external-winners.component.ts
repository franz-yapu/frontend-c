import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HomeService } from '../../home/home.service';
import { TranslateDirective } from '../../../project/directive/translate.directive';
import { CoffeeLoaderComponent } from '../../../project/components/coffee-loader/coffee-loader.component';
import {
  LotColumn,
  LotRow,
  LotsTableComponent,
} from '../../../project/components/lots-view/lots-table.component';
import { TranslatePipe } from '../../../project/pipe/translate.pipe';
import { LotDetailComponent } from '../../../project/components/auction-view/lot-detail/lot-detail.component';

@Component({
  selector: 'app-external-winners',
  imports: [
    CommonModule,
    TranslateDirective,
    TranslatePipe,
    CoffeeLoaderComponent,
    LotsTableComponent,
    LotDetailComponent,
  ],
  templateUrl: './external-winners.component.html',
  styleUrl: './external-winners.component.scss'
})
export class ExternalWinnersComponent implements OnInit {
  public transactions: any = [];
  public auction: any = null;
  /** Lotes de la subasta cerrada con su ficha completa, por id de lote. */
  private lotesPorId = new Map<string, any>();
  /** Historial de pujas por lote, para la ficha. */
  public lastBids = new Map<string, any[]>();
  /** Lote cuya ficha está abierta (misma ficha que durante la subasta). */
  public selectedLot: any = null;
  /** Primera carga: sin esto se veía "Subasta en Preparación" mientras llegaban
   *  los datos, que con conexión lenta parece que no hay nada que mostrar. */
  public loading = true;

  constructor(private homeService: HomeService) {}

  async ngOnInit() {
    try {
      this.auction = await this.homeService.getLastAutionTransactions();
      console.log(this.auction);
      
      if (this.auction) {
     this.transactions = await this.homeService.getAutionTransactions(this.auction.id);
     this.transactions = (this.transactions  || []).sort((a:any, b:any) => (a.position ?? 0) - (b.position ?? 0));

      // Ficha de cada lote y su historial de pujas: sin esto la página de
      // resultados es una tabla plana y no se puede ver cómo fue la subasta.
      await this.cargarDetalleDeLosLotes();
      }
      
    } catch (error) {

    } finally {
      this.loading = false;
    }
  }

  /** Las mismas columnas que la tabla de la subasta; "quien va ganando" pasa a
   *  ser "quien ganó" y el precio, el de adjudicación. */
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
    'bids',
  ];

  readonly etiquetasTabla: Partial<Record<LotColumn, string>> = {
    leader: 'WINNERS.TABLE.WINNER',
    price: 'WINNERS.TABLE.FINAL_PRICE',
    // Aquí nada es "actual": la subasta terminó y estos son los importes con
    // los que se cerró cada lote.
    value: 'WINNERS.TABLE.TOTAL',
  };

  /** Traduce cada venta a la fila que entiende la tabla compartida. */
  get filasTabla(): LotRow[] {
    return (this.transactions || []).map((t: any) => {
      const precio = Number(t.pricing?.finalPrice) || null;
      const libras = Number(t.quantityLbs) || null;
      return {
        id: t.transactionId,
        lotId: t.lotId,
        position: t.position,
        name: t.lotName,
        subtitle: [t.variety, t.seller].filter((x: any) => !!x).join(' • '),
        score: t.cupScore ?? null,
        process: t.process ?? null,
        altitude: t.altitude ?? null,
        origin: [t.community, t.region].filter((x: any) => !!x).join(', '),
        quantity: libras,
        price: precio,
        value: precio && libras ? precio * libras : null,
        bidsCount: this.pujasDe(t.lotId),
        leaderName: t.buyer?.company || t.buyer?.name || null,
        raw: t,
      };
    });
  }

  /**
   * Trae los lotes de la subasta cerrada (con toda la información del café) y,
   * en segundo plano, el historial de pujas de cada uno. Si algo falla la
   * tabla sigue funcionando: solo se queda sin ficha.
   */
  private async cargarDetalleDeLosLotes() {
    try {
      const cerrada: any = await this.homeService.getClosedAuctionLots(this.auction.id);
      for (const detalle of cerrada?.auctionDetails || []) {
        this.lotesPorId.set(detalle.coffeeLotId, detalle);
      }
      // En paralelo, no en fila india: son una petición por lote.
      await Promise.all(
        [...this.lotesPorId.keys()].map(async (lotId) => {
          try {
            const pujas: any = await this.homeService.getLastBids(this.auction.id, lotId);
            this.lastBids.set(lotId, pujas || []);
          } catch {
            this.lastBids.set(lotId, []);
          }
        }),
      );
    } catch (error) {
      console.error('No se pudo cargar el detalle de los lotes:', error);
    }
  }

  /** ¿Hay ficha para este lote? (si el backend aún no tiene la ruta, no). */
  tieneDetalle(lotId: string): boolean {
    return this.lotesPorId.has(lotId);
  }

  /** Cuántas pujas recibió el lote, para la columna de la tabla. */
  private pujasDe(lotId: string): number | null {
    const pujas = this.lastBids.get(lotId);
    return pujas ? pujas.length : null;
  }

  abrirFicha(row: any) {
    const lotId = row?.lotId || row?.raw?.lotId;
    const detalle = this.lotesPorId.get(lotId);
    if (!detalle) return;
    this.selectedLot = detalle;
    document.body.style.overflow = 'hidden';
  }

  cerrarFicha() {
    this.selectedLot = null;
    document.body.style.overflow = 'auto';
  }

  // Métodos para calcular estadísticas
  getTotalRevenue(): number {
    return this.transactions.reduce((total: number, transaction: any) => 
      total + transaction.pricing.finalPrice, 0);
  }

  getAveragePrice(): number {
    if (this.transactions.length === 0) return 0;
    return this.getTotalRevenue() / this.transactions.length;
  }

  getTotalQuantity(): number {
    return this.transactions.reduce((total: number, transaction: any) => 
      total + transaction.quantityLbs, 0);
  }
}