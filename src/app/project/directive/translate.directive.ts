import { Directive, ElementRef, inject, Input, OnDestroy, OnInit, effect, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslationService } from '../services/translate.service';

@Directive({
  selector: '[appTranslate]',
  standalone: true
})
export class TranslateDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private translationService = inject(TranslationService);
  private sanitizer = inject(DomSanitizer);
  
  private updateEffect = effect(() => {
    // Se ejecuta cuando currentLanguage cambia
    this.translationService.currentLanguage();
    this.updateTranslation();
  });

  @Input('appTranslate') key!: string;
  @Input() translateParams?: Record<string, string>;
  @Input() translateHtml: boolean = false;

  ngOnInit(): void {
    this.updateTranslation();
  }

  private updateTranslation(): void {
    if (!this.key) {
      console.warn('Translation key is required for appTranslate directive');
      return;
    }

    let translation = this.translationService.translate(this.key);
    
    // Si no se encuentra la traducción, mostrar la clave
    if (translation === this.key) {
      console.warn(`Translation key not found: ${this.key}`);
    }
    
    // Reemplazar parámetros si existen
    if (this.translateParams && translation) {
      Object.keys(this.translateParams).forEach(param => {
        translation = translation.replace(`{{${param}}}`, this.translateParams![param]);
      });
    }
    
    if (this.translateHtml) {
      // Para HTML, usar innerHTML con sanitización
      const safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, translation);
      this.elementRef.nativeElement.innerHTML = safeHtml || translation;
    } else {
      // Para texto plano
      this.elementRef.nativeElement.textContent = translation;
    }
  }

  ngOnDestroy(): void {
    this.updateEffect.destroy();
  }
}