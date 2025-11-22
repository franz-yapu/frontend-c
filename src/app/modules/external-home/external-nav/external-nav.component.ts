import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslationService } from '../../../project/services/translate.service';
import { TranslateDirective } from '../../../project/directive/translate.directive';
import { Language } from '../../../project/services/translate.service'; // Asegúrate de importar la interfaz

interface NavItem {
  name: string;
  route: string;
  isActive: boolean;
  translateKey: string;
}

@Component({
  selector: 'app-external-nav',
  imports: [CommonModule, RouterModule, TranslateDirective],
  templateUrl: './external-nav.component.html',
  styleUrl: './external-nav.component.scss'
})
export class ExternalNavComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  
  // Effect para reaccionar a cambios de idioma
  private languageEffect = effect(() => {
    this.translationService.currentLanguage();
    this.currentLanguageInfo.set(this.translationService.getCurrentLanguageInfo());
  });

  navItems: NavItem[] = [
    { name: 'Inicio', route: '/Coffee/index', isActive: false, translateKey: 'NAV.HOME' },
    { name: 'Ganadores', route: '/Coffee/winners', isActive: false, translateKey: 'NAV.WINNERS' },
    { name: 'Subasta Activa', route: '/Coffee/auction', isActive: false, translateKey: 'NAV.AUCTION' },
    { name: 'Reglamento', route: '/Coffee/regulation', isActive: false, translateKey: 'NAV.REGULATION' },
    { name: 'Acerca de nosotros', route: '/Coffee/about', isActive: false, translateKey: 'NAV.ABOUT' },
  ];

  // Usar los Signals directamente del servicio
  availableLanguages = this.translationService.languages;
  currentLanguage = this.translationService.currentLanguage;
  
  // Crear un signal para currentLanguageInfo
  currentLanguageInfo = signal<Language>(this.translationService.getCurrentLanguageInfo());
  
  isMobileMenuOpen: boolean = false;
  isLanguageDropdownOpen: boolean = false;

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

  ngOnDestroy(): void {
    this.languageEffect.destroy();
  }
}