import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from './core/auth.interceptor';
import { HttpBackend, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { DateFnsConfigurationService } from 'ngx-date-fns';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { es } from 'date-fns/locale';
registerLocaleData(localeEs, 'es');

const datefnConfig = new DateFnsConfigurationService();
datefnConfig.setLocale(es); 
export function HttpLoaderFactory(_httpBackend: HttpBackend) {
  return new MultiTranslateHttpLoader(_httpBackend, [
    '/assets/i18n/',
    // '/assets/i18n/zn4-confirm-password/',
    // '/assets/i18n/zn4-anonymization/',
    '/assets/i18n/zn4-core-forms/',
    '/assets/i18n/zn4-core-browser-2/',
    '/assets/i18n/zn4-core-dms/',
    '/assets/i18n/zn4-core-multiple-upload/',
    '/assets/i18n/zn4-core-table/',
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
   /*  MessageService, */
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    importProvidersFrom(TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpBackend],
      },
  })),
  { provide: DateFnsConfigurationService, useValue: datefnConfig },
  ],
};

