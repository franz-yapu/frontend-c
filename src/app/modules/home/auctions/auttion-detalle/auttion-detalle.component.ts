import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CoffeeLotComponent } from '../../../../project/components/coffee-lot/coffee-lot.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HomeService } from '../../home.service';
import { NewCoffeelotComponent } from '../../../../project/components/new-coffeelot/new-coffeelot.component';
import { FormsModule } from '@angular/forms';
import { ToasterService } from '../../../../project/services/toaster.service';
import { error } from 'console';
import { BreadCrumbComponent } from '../../../../project/components/bread-crumb/bread-crumb.component';
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
  position: number | null;
  seller:string;
  quantityLbs: number;
}

interface StatusFilter {
  value: string;
  label: string;
}
@Component({
  selector: 'app-auttion-detalle',
  imports: [CommonModule, FormsModule, BreadCrumbComponent],
  templateUrl: './auttion-detalle.component.html',
  styleUrl: './auttion-detalle.component.scss',
  providers: [DialogService],
})
export class AuttionDetalleComponent implements OnInit {
   public breadcrumbItems = [
    { label: 'Subastas', icon: 'gavel', routerLink: '/home/auctions' },
    { label: 'Lotes', icon: 'dataset', routerLink: '/students' }
  ];
  public auctionId: any;

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
  public auction: any;

  constructor(
    private service: HomeService,
    private dialogService: DialogService,
    private activatedRoute: ActivatedRoute,
    private toaster: ToasterService,
    private router: Router
  ) { }

  async ngOnInit() {

    this.auctionId = this.activatedRoute.snapshot.paramMap.get('id');


    const response: any = await this.service.getAutionsLots(this.auctionId);
    this.auction = response.data[0]
    console.log(this.auction);

    this.coffeeLots = this.auction.coffeeLots || [];
      this.coffeeLots = (this.auction.coffeeLots || []).sort((a:any, b:any) => (a.position ?? 0) - (b.position ?? 0));

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

   getStatusLabelAuction(status: string): string {
    switch(status) {
      case 'DRAFT': return 'Borrador';
      case 'ACTIVE': return 'Activa';
      case 'CLOSED': return 'Cerrada';
      default: return status;
    }
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

    this.router.navigate([`/home/auction/${this.auctionId}/coffee-lot/${lotId}`]);
  }

  canEdit(aut:any): boolean {
    const now = new Date();
    const startDate = new Date(aut.startDate);
    return now < startDate;
  }

  openAddModal() {
    this.ref = this.dialogService.open(NewCoffeelotComponent, {
      header: 'Nuevo Lote de Café',
      data: { auctionId: this.auctionId },
      width: 'auto',
      closable: true
    });

    this.ref.onClose.subscribe((newLot: CoffeeLot) => {
      if (newLot) {
        this.coffeeLots.unshift(newLot);
        this.ngOnInit()

      }
    });
  }

  activar() {
    delete this.auction.coffeeLots
    if (this.auction.status == "ACTIVE") {
      this.auction.status = "DRAFT"
      this.auction.isActive = false
    } else {
      this.auction.status = "ACTIVE"
      this.auction.isActive = true
    }


    this.service.updateAuctions(this.auction.id, this.auction).then((res:any) => {
      this.toaster.showToast({
             severity: 'success',
             summary: 'Guardado',
             detail: res.status == "ACTIVE" ? 'La subasta esta activa' : 'La subasta esta en borrador',
           });
      this.ngOnInit()
    },error=>{
     this.toaster.showToast({
             severity: 'error',
             summary: 'Cancelado ',
             detail:  'Ya existe una subasta activo ',
           });
      this.ngOnInit()
    });
  }

  getStatusIcon(status: string): string {
  switch(status) {
    case 'DRAFT': return 'edit';
    case 'ACTIVE': return 'play_circle';
    case 'CLOSED': return 'check_circle';
    default: return 'help';
  }
}

getFilterIcon(filterValue: string): string {
  switch(filterValue) {
    case 'ALL': return 'all_inclusive';
    case 'DRAFT': return 'edit';
    case 'ACTIVE': return 'play_circle';
    case 'CLOSED': return 'check_circle';
    default: return 'filter_alt';
  }
}

getStatusClasses(status: string): string {
  const baseClasses = 'px-3 py-1.5 rounded-full text-sm font-medium flex items-center';
  switch(status) {
    case 'DRAFT': return `${baseClasses} bg-primary-50 text-primary-700 border border-primary-200`;
    case 'ACTIVE': return `${baseClasses} bg-success-50 text-success-700 border border-success-200`;
    case 'CLOSED': return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
    default: return baseClasses;
  }
}
}

