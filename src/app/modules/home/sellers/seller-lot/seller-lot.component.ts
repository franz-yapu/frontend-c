import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CoffeeLotDetailComponent } from '../../../../project/components/coffee-lot-detail/coffee-lot-detail.component';

@Component({
  selector: 'app-seller-lot',
  imports: [CoffeeLotDetailComponent],
  templateUrl: './seller-lot.component.html',
  styleUrl: './seller-lot.component.scss'
})
export class SellerLotComponent implements OnInit {
  public coffeeLotId: any ;
  constructor( private activeRouter: ActivatedRoute,) { }
 ngOnInit(): void {
  console.log('ssssss');
  
   this.coffeeLotId = this.activeRouter.snapshot.paramMap.get('coffeeLotId');
 }
}
