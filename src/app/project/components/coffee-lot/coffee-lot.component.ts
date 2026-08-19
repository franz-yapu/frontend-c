import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HomeService } from '../../../modules/home/home.service';
import { NewCoffeelotComponent } from '../new-coffeelot/new-coffeelot.component';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '../../pipe/translate.pipe';
import {
  LotsTableComponent,
  LotColumn,
  LotRow,
} from '../lots-view/lots-table.component';
import { ViewModeToggleComponent } from '../lots-view/view-mode-toggle.component';
import { ViewMode, ViewModeService } from '../lots-view/view-mode.service';


interface CoffeeLot {
  id: string;
  name: string;
  description: string | null;
  origin: string;
  harvestDate: string;
  quality: string | null;
  process: string | null;
  altitude: number | null;
  quantity: number;
  cupScore: number | null;
  moistureContent: number | null;
  status: string;
  suggestedPrice: number | null;
  isInAuction: boolean;
  images: string | null;
  documents: string | null;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  harvestYear: string;
  country: string | null;
  auctionId: string | null;
}

interface StatusFilter {
  value: string;
  label: string;
}

@Component({
  selector: 'app-coffee-lot',
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    LotsTableComponent,
    ViewModeToggleComponent,
  ],
  templateUrl: './coffee-lot.component.html',
  styleUrl: './coffee-lot.component.scss',
  providers: [DialogService],
})
export class CoffeeLotComponent implements OnInit {
 // ---------------------------------------------------------- vista tabla --
 private viewModeService = inject(ViewModeService);
 readonly viewMode = signal<ViewMode>(this.viewModeService.leer('admin', 'table'));
 /** El lote de admin no tiene posicion ni puja: se enseñan calidad, origen,
  *  cantidad, precio sugerido y estado. */
 readonly columnasTabla: LotColumn[] = [
   'name',
   'score',
   'process',
   'origin',
   'quantity',
   'price',
   'status',
 ];

 /** En admin la columna de precio es el sugerido del lote, no una puja. */
 readonly etiquetasTabla = { price: 'AUCTION-BUYER.COL_SUGGESTED_PRICE' };

 cambiarVista(modo: ViewMode): void {
   this.viewMode.set(modo);
   this.viewModeService.guardar('admin', modo);
 }

 get filasTabla(): LotRow[] {
   return this.filteredCoffeeLots.map((lot) => ({
     id: lot.id,
     lotId: lot.id,
     position: null,
     name: lot.name,
     subtitle: [lot.harvestYear, lot.quality].filter((x) => !!x).join(' • '),
     score: lot.cupScore ?? null,
     process: lot.process ?? null,
     altitude: lot.altitude ?? null,
     origin: [lot.origin, lot.country].filter((x) => !!x).join(', '),
     quantity: lot.quantity ?? null,
     price: lot.suggestedPrice ?? null,
     value: lot.suggestedPrice ? lot.suggestedPrice * (lot.quantity || 0) : null,
     bidsCount: null,
     status: this.getStatusLabel(lot),
     raw: lot,
   })) as LotRow[];
 }

 @Input()sellerId: any ;
 @Output()coffeeLotDetails = new EventEmitter<any>();
 
  ref!: DynamicDialogRef;
  coffeeLots: CoffeeLot[] = [];
  filteredCoffeeLots: CoffeeLot[] = [];
  public searchTerm: string = '';
  activeFilter: string = 'ALL';

  statusFilters: StatusFilter[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'AVAILABLE', label: 'Disponibles' },
    { value: 'IN_AUCTION', label: 'En subasta' },
    { value: 'SOLD', label: 'Vendidos' }
  ];

  constructor(
    private service: HomeService,
    private dialogService: DialogService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  async ngOnInit() {

    /* this.sellerId = this.activatedRoute.snapshot.paramMap.get('id'); */
    console.log(this.sellerId);
    
    const response: any = await this.service.getCoofeeLot(this.sellerId);
    this.coffeeLots = response.data;
    this.filteredCoffeeLots = [...this.coffeeLots];
  }

 filterCoffeeLots(): void {
  const search = this.searchTerm?.toLowerCase().trim() || "";

  this.filteredCoffeeLots = this.coffeeLots.filter(lot => {
    // 🔎 Búsqueda flexible
    const matchesSearch = !search || [
      lot.name,
      lot.country,
      lot.harvestYear,
      lot.cupScore,
      lot.quantity
    ]
      .filter(Boolean) // elimina null/undefined
      .some(field => field!.toString().toLowerCase().includes(search));

    // 🎯 Filtro por estado
    let matchesFilter = true;
    switch (this.activeFilter) {
      case "IN_AUCTION":
        matchesFilter = !!lot.isInAuction;
        break;
      case "ALL":
        matchesFilter = true;
        break;
      default:
        matchesFilter = lot.status === this.activeFilter;
    }

    return matchesSearch && matchesFilter;
  });
}

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.filterCoffeeLots();
  }

  getStatusLabel(lot: CoffeeLot): string {
    if (lot.isInAuction) return 'En subasta';
    return lot.status === 'AVAILABLE' ? 'Disponible' : 'Vendido';
  }

  getStatusClass(lot: CoffeeLot): string {
    if (lot.isInAuction) return 'bg-info-100 text-info-800 border-info-200';
    return lot.status === 'AVAILABLE' ? 'bg-success-100 text-success-800 border-success-200' : 'bg-gray-100 text-gray-800 border-gray-200';
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterCoffeeLots();
  }
  viewCoffeeLotDetails(lotId: any) {
    this.coffeeLotDetails.emit({lotId});
   /* this.router.navigate([`/home/sellers/${this.sellerId}/coffee-lot/${lotId}`]); */
  }

  openAddModal() {
    this.ref = this.dialogService.open(NewCoffeelotComponent, {
      header: 'Nuevo Lote de Café',
      data: { sellerId: this.sellerId },
      width: 'auto',
      closable: true
    });
    
    this.ref.onClose.subscribe((newLot: CoffeeLot) => {
      if (newLot) {
        this.coffeeLots.unshift(newLot);
        this.filterCoffeeLots();
      }
    });
  }
}

