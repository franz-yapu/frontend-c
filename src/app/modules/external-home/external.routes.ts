import { Routes } from '@angular/router';

import { ExternalWinnersComponent } from './external-winners/external-winners.component';
import { ExternalAuctionComponent } from './external-auction/external-auction.component';
import { ExternalDocumentsComponent } from './external-documents/external-documents.component';
import { ExternalHomeComponent } from './external-home.component';
import { ExternalIndexComponent } from './external-index/external-index.component';
import { AboutComponent } from './about/about.component';
import { RegulationComponent } from './regulation/regulation.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';




export const routes: Routes = [
  
  {
    
    path: '',
    component: ExternalHomeComponent,
    children: [
        {
        path: '',
        redirectTo: 'index',
        pathMatch: 'full' // importante
      },
        {
        path: 'index',
        component: ExternalIndexComponent,
      },
        {
        path: 'winners',
        component: ExternalWinnersComponent,
      },
      {
        path: 'auction',
        component: ExternalAuctionComponent,
         data: { preload: true }
      },
       {
        path: 'login',
        component: LoginComponent,
      },
       {
        path: 'register',
        component: RegisterComponent,
      },
      {
        path: 'documents',
        component: ExternalDocumentsComponent,
      },
      {
        path: 'about',
        component: AboutComponent,
      },
      {
        path: 'regulation',
        component: RegulationComponent
      }
    ]
  },
  

 
 
];
