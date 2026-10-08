import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { driver, type DriveStep, type Driver } from 'driver.js';
import { environment } from '../../../environments/environment';
import { GeneralService } from '../gerneral.service';
import { TranslationService } from '../../project/services/translate.service';

import { nombrePila } from '../nombre-usuario';
/**
 * Tour guiado del comprador.
 *
 * Sale las TRES primeras veces que inicia sesión y deja de salir si pulsa
 * "No volver a mostrar". La cuenta la lleva el servidor (`tourSeenCount` y
 * `tourDismissed` del usuario), no el navegador: si fuera local, saldría tres
 * veces en el móvil y otras tres en el PC, y se reiniciaría al limpiar el
 * navegador. `localStorage` queda solo de respaldo por si la petición falla.
 */
@Injectable({ providedIn: 'root' })
export class TourService {
  private http = inject(HttpClient);
  private general = inject(GeneralService);
  private traducciones = inject(TranslationService);

  /** Veces que se enseña a un comprador nuevo. */
  private static readonly VECES = 3;
  /** Si falta menos que esto para el cierre, NO se interrumpe a nadie. */
  private static readonly MINUTOS_DE_RESPETO = 5;

  /** Extensión de la subasta en pantalla (la pone la sala de subasta). */
  extension = { activa: true, minutos: 3 };

  private recorrido: Driver | null = null;
  private yaContado = false;
  /** El usuario llegó al último paso: ya lo vio entero. */
  private llegoAlFinal = false;

  /** Lanza el tour si toca (comprador, con veces pendientes y sin prisa). */
  async arrancarSiToca(opciones: { subastaActiva: boolean; cierra?: Date | null }) {
    const usuario = this.general.getUser();
    if (!usuario || this.rol(usuario) !== 'BUYER') return;
    if (this.apagadoEnEsteNavegador()) return;
    if (this.quedaPoco(opciones.cierra)) return;
    // Una vez por inicio de sesión: antes salía cada vez que se volvía a la
    // sala de subasta, y la cuenta de "tres veces" se gastaba en una sola visita.
    if (this.yaSalioEnEstaSesion()) return;

    const estado = await this.estadoDelServidor();
    if (estado.tourDismissed) return;
    if (estado.tourSeenCount >= TourService.VECES) return;

    this.recuerdaEstaSesion();
    this.arrancar(opciones);
  }

  /** Lanza el tour a petición del usuario ("Ver tutorial"), pase lo que pase. */
  arrancar(opciones: { subastaActiva: boolean; cierra?: Date | null }) {
    if (typeof document === 'undefined') return;   // SSR

    // De cada selector se coge el primer elemento VISIBLE: la misma marca la
    // llevan la barra de escritorio y el botón de menú del móvil, y resaltar el
    // que está oculto dejaría el globo señalando a la nada. Los pasos cuyo
    // elemento no está en pantalla (p. ej. "vas ganando" si no gana ninguno) se
    // caen solos.
    const pasos = this.pasos(opciones.subastaActiva)
      .map((paso) => {
        if (!paso.element) return paso;
        const nodo = this.primeroVisible(paso.element as string);
        return nodo ? { ...paso, element: nodo } : null;
      })
      .filter((paso): paso is DriveStep => paso !== null);
    if (!pasos.length) return;

    this.yaContado = false;
    this.llegoAlFinal = false;
    this.recorrido = driver({
      showProgress: true,
      allowClose: true,
      overlayColor: 'rgba(0,0,0,0.55)',
      popoverClass: 'tour-cafe',
      nextBtnText: this.t('TOUR.NEXT'),
      prevBtnText: this.t('TOUR.PREV'),
      doneBtnText: this.t('TOUR.DONE'),
      progressText: this.t('TOUR.PROGRESS'),
      steps: pasos,
      onHighlighted: () => {
        if (this.recorrido?.isLastStep()) this.llegoAlFinal = true;
      },
      // Cerrar con el aspa o con Esc cuenta como una vez; terminarlo entero
      // lo da por visto y no vuelve a salir solo ("Ver tutorial" sigue).
      onDestroyed: () => {
        if (!this.llegoAlFinal) return this.contarUnaVez();
        this.recorrido = null;                   // ya está cerrado: no repetir destroy()
        void this.apagar();
      },
    });
    this.recorrido.drive();
    this.pintarBotonDeApagar();
  }

  /** "No volver a mostrar": lo apaga en el servidor y cierra el tour. */
  async apagar() {
    this.yaContado = true;                       // no sumar además una vista
    this.recuerdaApagadoEnEsteNavegador();
    this.recorrido?.destroy();
    try {
      await firstValueFrom(
        this.http.post(`${environment.backend}/users/me/tour`, { noMostrarMas: true }),
      );
    } catch {
      /* Queda apagado en este navegador; se reintentará la próxima vez. */
    }
  }

  // ---------------------------------------------------------------- interno

  private async estadoDelServidor(): Promise<{ tourSeenCount: number; tourDismissed: boolean }> {
    try {
      const yo: any = await firstValueFrom(
        this.http.get(`${environment.backend}/users/me`),
      );
      return {
        tourSeenCount: Number(yo?.tourSeenCount ?? 0),
        tourDismissed: !!yo?.tourDismissed,
      };
    } catch {
      // Sin respuesta del servidor no se molesta al usuario.
      return { tourSeenCount: TourService.VECES, tourDismissed: true };
    }
  }

  private contarUnaVez() {
    if (this.yaContado) return;
    this.yaContado = true;
    firstValueFrom(
      this.http.post(`${environment.backend}/users/me/tour`, { visto: true }),
    ).catch(() => {
      /* Si falla, la próxima vez el servidor sigue con la cuenta correcta. */
    });
  }

  /** Primer elemento del selector que de verdad se ve en pantalla. */
  private primeroVisible(selector: string): HTMLElement | null {
    const nodos = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return (
      nodos.find((nodo) => {
        const caja = nodo.getBoundingClientRect();
        return caja.width > 0 && caja.height > 0;
      }) ?? null
    );
  }

  /** Los últimos minutos son para pujar, no para tutoriales. */
  private quedaPoco(cierra?: Date | null): boolean {
    if (!cierra) return false;
    const faltan = new Date(cierra).getTime() - Date.now();
    return faltan > 0 && faltan < TourService.MINUTOS_DE_RESPETO * 60 * 1000;
  }

  private rol(usuario: any): string {
    return String(usuario?.role?.name ?? usuario?.roleName ?? '').toUpperCase();
  }

  private t(clave: string): string {
    return this.traducciones.translate(clave);
  }

  /**
   * Respaldo local del "no volver a mostrar": si el servidor no contestó, al
   * menos en este navegador ya no vuelve a salir.
   */
  private apagadoEnEsteNavegador(): boolean {
    try {
      return localStorage.getItem(this.claveLocal()) === '1';
    } catch {
      return false;
    }
  }

  private recuerdaApagadoEnEsteNavegador() {
    try {
      localStorage.setItem(this.claveLocal(), '1');
    } catch {
      /* modo incógnito o almacenamiento bloqueado: da igual */
    }
  }

  /** ¿Ya salió solo con el token de esta sesión? (cambia en cada login) */
  private yaSalioEnEstaSesion(): boolean {
    try {
      const token = localStorage.getItem(`${environment.appCode}.token`) || '';
      return !!token && localStorage.getItem(this.claveSesion()) === token.slice(-24);
    } catch {
      return false;
    }
  }

  private recuerdaEstaSesion() {
    try {
      const token = localStorage.getItem(`${environment.appCode}.token`) || '';
      localStorage.setItem(this.claveSesion(), token.slice(-24));
    } catch {
      /* almacenamiento bloqueado: como mucho vuelve a salir */
    }
  }

  private claveSesion(): string {
    return `${environment.appCode}.tourSesion`;
  }

  private claveLocal(): string {
    return `${environment.appCode}.tourApagado`;
  }

  /**
   * driver.js no trae un tercer botón, así que se añade "No volver a mostrar"
   * al pie del globo. Se vuelve a colocar en cada paso porque el globo se
   * vuelve a pintar entero.
   */
  private pintarBotonDeApagar() {
    const poner = () => {
      const pie = document.querySelector('.driver-popover-footer');
      if (!pie || pie.querySelector('.tour-apagar')) return;
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'tour-apagar';
      boton.textContent = this.t('TOUR.DISMISS');
      boton.addEventListener('click', () => this.apagar());
      pie.prepend(boton);
    };
    poner();
    // El globo se recrea al cambiar de paso: se vigila mientras dure el tour.
    const observador = new MutationObserver(() => {
      if (!document.querySelector('.driver-popover')) {
        observador.disconnect();
        return;
      }
      poner();
    });
    observador.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Los pasos apuntan a `data-tour="..."`, no a clases de Tailwind: así un
   * cambio de maquetación no rompe el tour en silencio.
   */
  private pasos(subastaActiva: boolean): DriveStep[] {
    const usuario = this.general.getUser();
    const nombre = nombrePila(usuario);
    const bienvenida: DriveStep = {
      popover: {
        title: this.t('TOUR.WELCOME.TITLE').replace('{{nombre}}', nombre),
        description: this.t('TOUR.WELCOME.TEXT'),
      },
    };
    const menu: DriveStep = {
      element: '[data-tour="menu"]',
      popover: {
        title: this.t('TOUR.MENU.TITLE'),
        description: this.t('TOUR.MENU.TEXT'),
      },
    };

    if (!subastaActiva) {
      return [bienvenida, { element: '[data-tour="lotes"]', popover: {
        title: this.t('TOUR.LOTS.TITLE'),
        description: this.t('TOUR.LOTS.TEXT'),
      } }, menu];
    }

    return [
      bienvenida,
      {
        element: '[data-tour="reloj"]',
        popover: {
          title: this.t('TOUR.CLOCK.TITLE'),
          description: this.extension.activa
            ? this.t('TOUR.CLOCK.TEXT').replace(/\{\{minutos\}\}/g, String(this.extension.minutos))
            : this.t('TOUR.CLOCK.TEXT_NO_EXTENSION'),
        },
      },
      {
        element: '[data-tour="lotes"]',
        popover: {
          title: this.t('TOUR.LOTS.TITLE'),
          description: this.t('TOUR.LOTS.TEXT'),
        },
      },
      {
        element: '[data-tour="ficha"]',
        popover: {
          title: this.t('TOUR.DETAIL.TITLE'),
          description: this.t('TOUR.DETAIL.TEXT'),
        },
      },
      {
        element: '[data-tour="pujar"]',
        popover: {
          title: this.t('TOUR.BID.TITLE'),
          description: this.t('TOUR.BID.TEXT'),
        },
      },
      {
        element: '[data-tour="ganando"]',
        popover: {
          title: this.t('TOUR.WINNING.TITLE'),
          description: this.t('TOUR.WINNING.TEXT'),
        },
      },
      menu,
    ];
  }
}
