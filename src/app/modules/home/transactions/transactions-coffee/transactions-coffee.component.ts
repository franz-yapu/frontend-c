import { Component, OnInit } from '@angular/core';
import { HomeService } from '../../home.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-transactions-coffee',
  imports: [CommonModule],
  templateUrl: './transactions-coffee.component.html',
  styleUrl: './transactions-coffee.component.scss'
})
export class TransactionsCoffeeComponent implements OnInit {
  public transactions: any = [];
  public auction: any = null;
  private auctionId: any ;

  constructor(private homeService: HomeService, private activeRouter:ActivatedRoute) {}

  async ngOnInit() {
    try {
      this.auctionId = this.activeRouter.snapshot.paramMap.get('id');
        this.auction = await this.homeService.getAution( this.auctionId);
      if (this.auction) {
     this.transactions = await this.homeService.getAutionTransactions(this.auctionId );
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