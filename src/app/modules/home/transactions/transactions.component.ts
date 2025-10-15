import { Component, OnInit } from '@angular/core';
import { HomeService } from '../home.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
  selector: 'app-transactions',
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
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
    private router: Router,
  ) { }

  async ngOnInit() {
    const auctions: any = await this.service.getAuctionsClose()
    console.log(auctions);
    
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
    this.router.navigate([`/home/transactions/${id}`]);


  }



 


}