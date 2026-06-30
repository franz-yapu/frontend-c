// main.ts — bootstrap del navegador. DEBE usar appConfig (igual que la config
// del servidor en app.config.server.ts), que incluye el AuthInterceptor
// (token JWT en cada request), ngx-translate (textos) y el APP_INITIALIZER de
// branding. Antes arrancaba con una config mínima propia SIN esas piezas, por
// lo que en el cliente NINGUNA petición llevaba token (401 en todo), ni
// cargaban los textos ni el branding.
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
