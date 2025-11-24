import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { ProductComponent } from '../product/product.component';
import { ExampleCssComponent } from '../example-css/example-css.component';
import { CategoriesComponent } from '../categories/categories.component';
import { UsersComponent } from './users/users.component';
import { UserDetailComponent } from './users/user-detail/user-detail.component';
import { SellersComponent } from './sellers/sellers.component';
import { AuctionsComponent } from './auctions/auctions.component';
import { SellerLotComponent } from './sellers/seller-lot/seller-lot.component';
import { SellerLotsComponent } from './sellers/seller-lots/seller-lots.component';
import { AuttionDetalleComponent } from './auctions/auttion-detalle/auttion-detalle.component';
import { AutionLotComponent } from './auctions/aution-lot/aution-lot.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { TransactionsCoffeeComponent } from './transactions/transactions-coffee/transactions-coffee.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';



export const routes: Routes = [
  
  {
    
    path: '',
    component: HomeComponent,
    children: [
   {
        path: '',
        redirectTo: 'auctions',
        pathMatch: 'full' // importante
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'user/:id',
        component: UserDetailComponent,
      },
      {
        path: 'sellers',
        component: SellersComponent,
      },
      {
        path: 'sellers/:id',
        component: SellerLotsComponent,
      },
     
      {
        path: 'auctions',
        component: AuctionsComponent,
      },
      {
        path: 'auctions/:id',
        component: AuttionDetalleComponent,
      },
      {
        path: 'auction/:id/coffee-lot/:coffeeLotId',
        component: AutionLotComponent,
      },
     /*  {
        path: 'sellers/:id/coffee-lot/:coffeeLotId',
        component: SellerLotComponent,
      }, */
      {
        path: 'transactions',
        component: TransactionsComponent,
      },
      {
        path: 'transactions/:id',
        component: TransactionsCoffeeComponent,
      },
      {
     path: 'dashboard',
     component: AdminDashboardComponent
    },

    ]
  },
  

 
 
];
