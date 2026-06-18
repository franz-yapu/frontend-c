import { Component, OnInit } from '@angular/core';
import { CoffeeLotDetailComponent } from '../../../../project/components/coffee-lot-detail/coffee-lot-detail.component';
import { ActivatedRoute } from '@angular/router';
import { BreadCrumbComponent } from '../../../../project/components/bread-crumb/bread-crumb.component';

@Component({
  selector: 'app-aution-lot',
  imports: [CoffeeLotDetailComponent,BreadCrumbComponent],
  templateUrl: './aution-lot.component.html',
  styleUrl: './aution-lot.component.scss'
})
export class AutionLotComponent implements OnInit {
   public breadcrumbItems:any = [];
  public coffeeLotId: any ;
    public auctionId: any ;
  constructor( private activeRouter: ActivatedRoute,) { }
 ngOnInit(): void {
   this.coffeeLotId = this.activeRouter.snapshot.paramMap.get('coffeeLotId');
   this.auctionId = this.activeRouter.snapshot.paramMap.get('id');
this.breadcrumbItems = [
    { label: 'Subastas', icon: 'gavel', routerLink: '/home/auctions' },
    { label: 'Lotes', icon: 'dataset', routerLink: '/home/auctions/'+this.auctionId },
    { label: 'Cafe', icon: 'coffee' }
  ];

 }
}
