import {
  HttpContextToken,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { GeneralService } from './gerneral.service';

/**
 * Marca una petición para que NO encienda el loader global.
 * Uso: `this.http.get(url, { context: new HttpContext().set(SKIP_LOADER, true) })`
 */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

/**
 * Rutas que nunca deben mostrar el loader: son llamadas de fondo, repetitivas o
 * del flujo de pujas en vivo. Tapar la pantalla mientras alguien puja sería lo
 * peor que podríamos hacer.
 */
const SILENT_URLS = [
  '/time/server', // sincronización de reloj (se llama cada pocos segundos)
  '/bids', // pujas y su historial: la subasta en vivo nunca se bloquea
  '/version', // badge de versión
];

/**
 * Enciende el loader global mientras hay peticiones en vuelo. El retardo y el
 * conteo viven en `GeneralService`: aquí solo se avisa de inicio y fin.
 */
export const LoadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const general = inject(GeneralService);

  const silent =
    req.context.get(SKIP_LOADER) ||
    SILENT_URLS.some((fragment) => req.url.includes(fragment));

  if (silent) return next(req);

  general.trackRequestStart();
  return next(req).pipe(finalize(() => general.trackRequestEnd()));
};
