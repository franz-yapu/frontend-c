import { Component, inject, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { GeneralService } from '../../core/gerneral.service';
import { ApiService } from '../../project/services/api.service';
import { TranslationService } from '../../project/services/translate.service';

import { Language } from '../../project/services/translate.service';
import { TranslateDirective } from '../../project/directive/translate.directive';
import { TranslatePipe } from '../../project/pipe/translate.pipe';
import { TourService } from '../../core/tour/tour.service';

import { iniciales, nombreCompleto } from '../../core/nombre-usuario';
interface NavItem {
  name: string;
  route: string;
  isActive: boolean;
  translateKey: string;
}

@Component({
  selector: 'app-buyer',
  imports: [CommonModule, RouterLink, RouterModule, TranslateDirective, TranslatePipe],
  templateUrl: './buyer.component.html',
  styleUrl: './buyer.component.scss'
})
export class BuyerComponent implements OnInit, OnDestroy {
  /** Para la plantilla (ver core/nombre-usuario). */
  readonly iniciales = iniciales;
  readonly nombreCompleto = nombreCompleto;
  private translationService = inject(TranslationService);
  private generalService = inject(GeneralService);
  private service = inject(ApiService);
  private tour = inject(TourService);
  private router = inject(Router);
  
  // Effect para reaccionar a cambios de idioma
  private languageEffect = effect(() => {
    this.translationService.currentLanguage();
    this.currentLanguageInfo.set(this.translationService.getCurrentLanguageInfo());
  });

  public user: any;

  navItems: NavItem[] = [
    /* { name: 'Dashboard', route: '/buyer/dashboard', isActive: true, translateKey: 'NAV.DASHBOARD' }, */
    { name: 'Subasta Activa', route: '/buyer/auction', isActive: false, translateKey: 'NAV.AUCTION' },
    { name: 'Ordenes', route: '/buyer/auction-winner', isActive: false, translateKey: 'NAV.ORDERS' },
    { name: 'Mis datos', route: '/buyer/user-data', isActive: false, translateKey: 'NAV.MY_DATA' },
  ];

  // Usar los Signals directamente del servicio
  availableLanguages = this.translationService.languages;
  currentLanguage = this.translationService.currentLanguage;
  
  // Crear un signal para currentLanguageInfo
  currentLanguageInfo = signal<Language>(this.translationService.getCurrentLanguageInfo());
  
  isMobileMenuOpen: boolean = false;
  isLanguageDropdownOpen: boolean = false;

  constructor() {
    this.user = this.generalService.getUser();
  }

  ngOnInit(): void {
    // Inicializar currentLanguageInfo
    this.currentLanguageInfo.set(this.translationService.getCurrentLanguageInfo());
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Cerrar dropdown de idiomas al abrir menú móvil
    if (this.isMobileMenuOpen) {
      this.isLanguageDropdownOpen = false;
    }
  }

  toggleLanguageDropdown(): void {
    this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen;
  }

  setActiveItem(item: NavItem): void {
    this.navItems.forEach(navItem => {
      navItem.isActive = (navItem === item);
    });
  }

  changeLanguage(langCode: string): void {
    this.translationService.useLanguage(langCode);
    this.isLanguageDropdownOpen = false;
  }

  /**
   * "Ver tutorial": lleva a la sala de subasta y lanza el tour a mano, aunque
   * el usuario lo hubiera apagado con "No volver a mostrar".
   */
  async verTutorial() {
    await this.router.navigate(['/buyer/auction']);
    setTimeout(() => {
      this.tour.arrancar({
        // Si el reloj está en pantalla, hay subasta en curso y el tour enseña
        // también los pasos de pujar.
        subastaActiva: !!document.querySelector('[data-tour="reloj"]'),
      });
    }, 800);
  }

  logout() {
    this.service.logout();
  }

  ngOnDestroy(): void {
    this.languageEffect.destroy();
  }
}