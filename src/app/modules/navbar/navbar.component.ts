import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { GeneralService } from '../../core/gerneral.service';
import { ApiService } from '../../project/services/api.service';
import { filter } from 'rxjs';
import { BrandingService } from '../../core/branding/branding.service';
import { inject } from '@angular/core';

interface MenuItem {
  title: string;
  path: string;
  icon: string;
  translateKey: string;
}

import { TranslateDirective } from '../../project/directive/translate.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateDirective],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  private brandingService = inject(BrandingService);
  public branding$ = this.brandingService.config$;
  
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
   /*   {
      title: 'Dashboard', 
      path: 'dashboard',
      icon: 'analytics'
    }, */
    {
      title: 'Subastas', 
      path: 'auctions',
      icon: 'gavel',
      translateKey: 'NAV.AUCTIONS'
    },
    {
      title: 'Ganadores',
      path: 'transactions',
      icon: 'social_leaderboard',
      translateKey: 'NAV.WINNERS'
    },      {
       title: 'Usuarios', 
       path: 'users',
       icon: 'group',
       translateKey: 'NAV.USERS'
     },
     {
       title: 'Branding',
       path: 'branding',
       icon: 'palette',
       translateKey: 'NAV.BRANDING'
     },
     {
       title: 'Textos',
       path: 'translations',
       icon: 'translate',
       translateKey: 'NAV.TRANSLATIONS'
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

  @HostListener('window:resize')
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