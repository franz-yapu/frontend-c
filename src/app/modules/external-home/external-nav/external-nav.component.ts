import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
interface NavItem {
  name: string;
  route: string;
  isActive: boolean;
}

@Component({
  selector: 'app-external-nav',
  imports: [CommonModule, RouterModule],
  templateUrl: './external-nav.component.html',
  styleUrl: './external-nav.component.scss'
})
export class ExternalNavComponent {   
  navItems: NavItem[] = [
   
    { name: 'Inicio', route: '/Coffee/index', isActive: false },
    { name: 'Ganadores', route: '/Coffee/winners', isActive: false },
    { name: 'Subasta Activa', route: '/Coffee/auction', isActive: false },
    { name: 'Reglamento', route: '/Coffee/regulation', isActive: false },
    { name: 'Acerca de nosotros', route: '/Coffee/about', isActive: false },
   
  ];

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

}