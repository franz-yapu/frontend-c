import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translate.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, params?: Record<string, string>): string {
    if (!key) return '';
    
    let translation = this.translationService.translate(key);
    
    // Si no se encuentra la traducción, devolver la clave. Igual que en la
    // directiva, solo se avisa una vez cargado el JSON de idioma.
    if (translation === key && this.translationService.cargado()) {
      console.warn(`Translation key not found: ${key}`);
    }
    
    // Reemplazar parámetros si existen
    if (params && translation) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{{${param}}}`, params[param]);
      });
    }
    
    return translation;
  }
}