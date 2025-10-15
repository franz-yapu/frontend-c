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
  auctions: Auction[] = [
    // Tus datos aquí...
  ];

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

  editAddModal(event: any) {
    this.ref = this.dialogService.open(NewAuctionComponent, {
      data: { data: event },
      header: 'Nueva subasta',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {

      this.ngOnInit()



    });
  }

}
