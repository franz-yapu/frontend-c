import { Component, inject, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { GeneralService } from '../../core/gerneral.service';
import { ApiService } from '../../project/services/api.service';
import { TranslationService } from '../../project/services/translate.service';

import { Language } from '../../project/services/translate.service';
import { TranslateDirective } from '../../project/directive/translate.directive';

interface NavItem {
  name: string;
  route: string;
  isActive: boolean;
  translateKey: string;
}

@Component({
  selector: 'app-buyer',
  imports: [CommonModule, RouterLink, RouterModule, TranslateDirective],
  templateUrl: './buyer.component.html',
  styleUrl: './buyer.component.scss'
})
export class BuyerComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  private generalService = inject(GeneralService);
  private service = inject(ApiService);
  
  // Effect para reaccionar a cambios de idioma
  private languageEffect = effect(() => {
    this.translationService.currentLanguage();
    this.currentLanguageInfo.set(this.translationService.getCurrentLanguageInfo());
  });

  public user: any;

  navItems: NavItem[] = [
    { name: 'Dashboard', route: '/buyer/dashboard', isActive: true, translateKey: 'NAV.DASHBOARD' },
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

  logout() {
    this.service.logout();
  }

  ngOnDestroy(): void {
    this.languageEffect.destroy();
  }
}