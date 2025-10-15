import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { GeneralService } from '../../core/gerneral.service';
import { ApiService } from '../../project/services/api.service';

interface NavItem {
  name: string;
  route: string;
  isActive: boolean;
}

@Component({
  selector: 'app-buyer',
  imports: [CommonModule,RouterLink, RouterModule],
  templateUrl: './buyer.component.html',
  styleUrl: './buyer.component.scss'
})
export class BuyerComponent {
  public user: any;
  navItems: NavItem[] = [
    { name: 'Dashboard', route: '/buyer/dashboard', isActive: true },
    { name: 'Subasta Activa', route: '/buyer/auction', isActive: false },
    { name: 'Ordenes', route: '/buyer/auction-winner', isActive: false },
    { name: 'Mis datos', route: '/buyer/user-data', isActive: false },
  ];
constructor(private generalService: GeneralService,private service: ApiService,) { 
this.user = this.generalService.getUser();
}

   
/*   profileItems: NavItem[] = [
    { name: 'Your profile', route: '/profile', isActive: false },
    { name: 'Settings', route: '/settings', isActive: false },
    { name: 'Sign out', route: '/logout', isActive: false }
  ]; */

  isMobileMenuOpen: boolean = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  setActiveItem(item: NavItem): void {
    this.navItems.forEach(navItem => {
      navItem.isActive = (navItem === item);
    });
  }
   logout() {
    this.service.logout();
  }
}