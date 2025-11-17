import { Routes } from '@angular/router';


import { BuyerDataComponent } from './buyer-data/buyer-data.component';
import { BuyerAuctionComponent } from './buyer-auction/buyer-auction.component';
import { BuyerComponent } from './buyer.component';
import { BuyerOrdersComponent } from './buyer-orders/buyer-orders.component';
import { BuyerDashboardComponent } from './buyer-dashboard/buyer-dashboard.component';



export const routes: Routes = [
 /*  {
    path: '',
    redirectTo: 'buyer',
    pathMatch: 'full' // importante
  }, */
  {
    path: '',
    component: BuyerComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full' // importante
      },
      {
        path: 'auction',
        component: BuyerAuctionComponent
      },
      {
        path: 'user-data',
        component: BuyerDataComponent
      },
      {
        path: 'auction-winner',
        component: BuyerOrdersComponent
      },
      {
      path: 'dashboard',
      component: BuyerDashboardComponent
     },



    ]
  },




];
