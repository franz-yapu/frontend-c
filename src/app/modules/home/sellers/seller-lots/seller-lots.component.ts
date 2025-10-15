import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CoffeeLotComponent } from '../../../../project/components/coffee-lot/coffee-lot.component';
import { CommonModule } from '@angular/common';
import { log } from 'console';

@Component({
  selector: 'app-seller-lots',
  imports: [CoffeeLotComponent,CommonModule],
  templateUrl: './seller-lots.component.html',
  styleUrl: './seller-lots.component.scss'
})
export class SellerLotsComponent implements OnInit {
  public sellerId: any ;
  constructor( private activatedRoute:ActivatedRoute, private router: Router ) { } 
   ngOnInit(): void {
  this.sellerId = this.activatedRoute.snapshot.paramMap.get('id'); 
  }

  public cofeeSelect(event:any){
  this.router.navigate([`/home/sellers/${this.sellerId}/coffee-lot/${event.lotId}`]);

  }
}
