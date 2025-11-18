import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HomeService } from '../home.service';
import { NewAuctionComponent } from './new-auction/new-auction.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Auction {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  minIncrement: number;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  adminId: string;
  sellerId: string | null;
}

interface StatusFilter {
  value: string;
  label: string;
}

@Component({
  selector: 'app-auctions',
  imports: [CommonModule, FormsModule],
  templateUrl: './auctions.component.html',
  styleUrl: './auctions.component.scss',
  providers: [DialogService],
})
export class AuctionsComponent implements OnInit {
  ref!: DynamicDialogRef;
  auctions: Auction[] = [];
  filteredAuctions: Auction[] = [];
  public searchTerm: string = '';
  activeFilter: string = 'ALL';

  statusFilters: StatusFilter[] = [
    { value: 'ALL', label: 'Todas' },
    { value: 'ACTIVE', label: 'Activas' },
    { value: 'DRAFT', label: 'Borrador' },
    { value: 'CLOSED', label: 'Cerradas' }
  ];

  constructor(
    private service: HomeService,
    private dialogService: DialogService,
    private router: Router,
  ) { }

  async ngOnInit() {
    const auctions: any = await this.service.getAuctions()
    console.log(auctions,'sssss');
    
    this.auctions = auctions.data;
    this.filteredAuctions = [...this.auctions];
  }

  filterAuctions(): void {
    this.filteredAuctions = this.auctions.filter(auction => {
      const matchesSearch = auction.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (auction.description && auction.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchesFilter = this.activeFilter === 'ALL' || auction.status === this.activeFilter;
      return matchesSearch && matchesFilter;
    });
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.filterAuctions();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'ACTIVE': return 'Activa';
      case 'CLOSED': return 'Cerrada';
      default: return status;
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterAuctions();
  }

  viewDetails(id: string) {
    this.router.navigate([`/home/auctions/${id}`]);
  }

  openAddModal() {
    this.ref = this.dialogService.open(NewAuctionComponent, {
      header: 'Nueva subasta',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.ngOnInit()
      }
    });
  }

  editAddModal(auction: any) {
    // Preparar datos para edición - separar fecha y hora
    const auctionForEdit = this.prepareAuctionForEdit(auction);
    
    this.ref = this.dialogService.open(NewAuctionComponent, {
      data: { data: auctionForEdit },
      header: 'Editar subasta',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
      this.ngOnInit()
    });
  }

  // ✅ NUEVO: Preparar subasta para edición (separar fecha y hora)
 private prepareAuctionForEdit(auction: any): any {
  const startDate = new Date(auction.startDate);
  const endDate = new Date(auction.endDate);

  return {
    ...auction,
    startDate: this.formatDateToYMD(startDate),
    startTime: this.formatTime(startDate),
    endDate: this.formatDateToYMD(endDate),
    endTime: this.formatTime(endDate)
  };
}

// ✅ NUEVO: Formatear fecha UTC a YYYY-MM-DD
private formatDateToYMDUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ✅ NUEVO: Formatear hora UTC a HH:MM
private formatTimeUTC(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

  // ✅ NUEVO: Formatear fecha a YYYY-MM-DD
private formatDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

  // ✅ NUEVO: Formatear hora a HH:MM
private formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

  // ✅ NUEVO: Procesar datos antes de enviar al backend

  // ... todo el código anterior igual hasta los métodos de fecha

  // ✅ SOLUCIÓN DEFINITIVA: Procesar datos sin complicaciones
processAuctionData(formData: any): any {
  const processedData = { ...formData };

  if (processedData.startDate && processedData.startTime) {
    processedData.startDate = this.combineDateAndTime(processedData.startDate, processedData.startTime);
    delete processedData.startTime;
  }

  if (processedData.endDate && processedData.endTime) {
    processedData.endDate = this.combineDateAndTime(processedData.endDate, processedData.endTime);
    delete processedData.endTime;
  }

  // Convertir a string ISO local (sin cambiar zona)
  processedData.startDate = processedData.startDate.toISOString();
  processedData.endDate = processedData.endDate.toISOString();

  return processedData;
}
private combineDateAndTime(dateString: string, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date(dateString);
  date.setHours(hours, minutes, 0, 0);
  return date;
}


// ✅ Convertir a UTC (mantener igual)
private convertToUTCDate(dateInput: any): string {
  const date = new Date(dateInput);
  return date.toISOString();
}
  // ✅ NUEVO: Convertir a UTC


  // ✅ NUEVO: Métodos para crear y actualizar subastas
  async createAuction(formData: any) {
    const processedData = this.processAuctionData(formData);
    return await this.service.createAuctions(processedData);
  }

  async updateAuction(auctionId: string, formData: any) {
    const processedData = this.processAuctionData(formData);
    return await this.service.updateAuctions(auctionId, processedData);
  }
}