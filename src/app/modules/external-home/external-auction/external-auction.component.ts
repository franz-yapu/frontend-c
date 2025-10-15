import { Component } from '@angular/core';
import { AuctionViewComponent } from "../../../project/components/auction-view/auction-view.component";

@Component({
  selector: 'app-external-auction',
  imports: [AuctionViewComponent,AuctionViewComponent],
  templateUrl: './external-auction.component.html',
  styleUrl: './external-auction.component.scss'
})
export class ExternalAuctionComponent {

}
