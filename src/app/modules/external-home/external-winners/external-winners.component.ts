import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HomeService } from '../../home/home.service';

@Component({
  selector: 'app-external-winners',
  imports: [CommonModule],
  templateUrl: './external-winners.component.html',
  styleUrl: './external-winners.component.scss'
})
export class ExternalWinnersComponent implements OnInit {
  public transactions: any = [];
  public auction: any = null;

  constructor(private homeService: HomeService) {}

  async ngOnInit() {
    try {
      this.auction = await this.homeService.getLastAutionTransactions();
      console.log(this.auction);
      
      if (this.auction) {
     this.transactions = await this.homeService.getAutionTransactions(this.auction.id);
     this.transactions = (this.transactions  || []).sort((a:any, b:any) => (a.position ?? 0) - (b.position ?? 0));

      console.log('Transacciones:', this.transactions);
      console.log('Subasta:', this.auction);
      }
      
    } catch (error) {
      
    }
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