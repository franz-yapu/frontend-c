import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from './core/auth.interceptor';
import { LoadingInterceptor } from './core/loading.interceptor';
import { HttpBackend, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { BrandingService } from './core/branding/branding.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { DateFnsConfigurationService } from 'ngx-date-fns';
import localeEs from '@angular/common/locales/es';
import { es } from 'date-fns/locale';
import { registerLocaleData } from '@angular/common';
registerLocaleData(localeEs, 'es');


const datefnConfig = new DateFnsConfigurationService();
datefnConfig.setLocale(es); 
export function HttpLoaderFactory(_httpBackend: HttpBackend) {
  // Solo /assets/i18n/. Las carpetas zn4-core-* eran restos de la plantilla y no
  // existen: cada arranque pedía seis archivos inexistentes y el servidor, por
  // el `try_files` del SPA, devolvía el index.html entero (10 kB) que
  // ngx-translate intentaba leer como JSON. Seis viajes de red tirados.
  return new MultiTranslateHttpLoader(_httpBackend, ['/assets/i18n/']);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    // Un solo provideHttpClient con todas las features
    provideHttpClient(
      withFetch(),
      withInterceptors([AuthInterceptor, LoadingInterceptor]),
    ),
    importProvidersFrom(TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpBackend],
      },
  })),
  { provide: DateFnsConfigurationService, useValue: datefnConfig },
  {
    provide: APP_INITIALIZER,
    useFactory: (brandingService: BrandingService) => () => brandingService.loadConfig(),
    deps: [BrandingService],
    multi: true,
  },
  ],
};

