import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';


export const routes: Routes = [
    { path: '', redirectTo: 'Coffee', pathMatch: 'full' },
    {
        path: 'Coffee',
        loadChildren: () => import('./modules/external-home/external.routes').then(m => m.routes),
        title: 'Home'
    },
    {
        path: 'login',
        loadChildren: () => import('./modules/login/login.routes').then(m => m.routes),
        title: 'Login'
    },
    {
        path: 'register',
        loadChildren: () => import('./modules/register/register.routes').then(m => m.routes),
    },
    {
        path: 'home',
        loadChildren: () => import('./modules/home/home.routes').then(m => m.routes),
        canActivate: [authGuard] ,
        title: 'home'
    },
     {
        path: 'buyer',
        loadChildren: () => import('./modules/buyer/buyer.routes').then(m => m.routes),
        canActivate: [authGuard] ,
        title: 'buyer'
    },
];