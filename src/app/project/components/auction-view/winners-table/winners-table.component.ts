import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateDirective } from '../../../directive/translate.directive';


@Component({
  selector: 'app-winners-table',
  standalone: true,
  imports: [CommonModule, TranslateDirective],
  templateUrl: './winners-table.component.html',
  styleUrls: ['./winners-table.component.scss']
})
export class WinnersTableComponent implements OnInit {
  @Input() winners: any[] = [];
  @Input() auctionData: any = null;
  
  loading = true;
  error: string | null = null;

  ngOnInit() {
    if (this.winners && this.winners.length > 0) {
      this.loading = false;
    }
  }

  getTotalPrice(winner: any): number {
    return winner.quantityLbs * winner.winningBid;
  }
}