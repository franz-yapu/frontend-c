import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { GeneralService } from '../../core/gerneral.service';
import { ApiService } from '../../project/services/api.service';
import { filter } from 'rxjs';

interface MenuItem {
  title: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public user: any;
  public isMenuOpen = false;
  
  // Schema de rutas
  public menuItems: MenuItem[] = [
  /*   {
      title: 'Productos',
      path: 'products',
      icon: 'groups'
    },
    {
      title: 'Style',
      path: 'style',
      icon: 'category'
    }, */
    {
      title: 'Proveedores', 
      path: 'sellers',
      icon: 'two_pager_store'
    },
    {
      title: 'Subastas', 
      path: 'auctions',
      icon: 'gavel'
    },
    {
      title: 'Ganadores',
      path: 'transactions',
      icon: 'social_leaderboard'
    }, 
     {
      title: 'Usuarios', 
      path: 'users',
      icon: 'group'
    },
   
  
  ];

  constructor(
    private generalService: GeneralService, 
    private service: ApiService,
     private router: Router
  ) {}

  ngOnInit(): void {
   this.user = this.generalService.getUser();
    this.checkScreenSize();

    // Cerrar el menú al cambiar de ruta (solo en móvil)
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (window.innerWidth < 768) {
          this.isMenuOpen = false;
        }
      });

  }

   @HostListener('window:resize', ['$event'])
  checkScreenSize() {
    if (window.innerWidth < 768) {
      this.isMenuOpen = false;
    } else {
      this.isMenuOpen = true;
    }
  }

  getUserInitials(): string {
    if (!this.user) return 'US';
    const first = this.user.firstName?.charAt(0) || 'U';
    const last = this.user.lastName?.charAt(0) || 'S';
    return `${first}${last}`;
  }

  logout() {
    this.service.logout();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}