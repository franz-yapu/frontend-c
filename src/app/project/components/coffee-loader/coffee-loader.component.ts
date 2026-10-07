import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateDirective } from '../../directive/translate.directive';

/**
 * Loader de marca: una tacita de café con el contenido girando y un anillo
 * exterior en movimiento. Se usa en dos modos:
 *
 *  - `overlay` (por defecto false): ocupa toda la pantalla, para la carga
 *    inicial y las esperas de red largas (ver `LoadingOverlayComponent`).
 *  - en línea: dentro de una tarjeta o sección mientras llegan sus datos.
 *
 * Todo es CSS/SVG (sin imágenes ni librerías) para que funcione con SSR y sin
 * pedir un solo byte más a la red, que es justo cuando hace falta mostrarlo.
 * Los colores salen de las variables de branding, así que el loader cambia de
 * color junto con el tema.
 */
@Component({
  selector: 'app-coffee-loader',
  standalone: true,
  imports: [CommonModule, TranslateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="coffee-loader"
      [class.coffee-loader--overlay]="overlay"
      role="status"
      aria-live="polite"
    >
      <div class="coffee-loader__box">
        <svg
          class="coffee-loader__svg"
          [style.width.px]="size"
          [style.height.px]="size"
          viewBox="0 0 100 100"
          aria-hidden="true"
          focusable="false"
        >
          <!-- Anillo exterior: el giro que indica "estamos trabajando" -->
          <circle class="ring-track" cx="50" cy="50" r="45" />
          <circle class="ring-arc" cx="50" cy="50" r="45" />

          <!-- Vapor -->
          <g class="steam">
            <path class="steam__wisp steam__wisp--1" d="M42 35 q-4 -5 0 -9 q4 -5 0 -9" />
            <path class="steam__wisp steam__wisp--2" d="M50 33 q-4 -5 0 -9 q4 -5 0 -9" />
            <path class="steam__wisp steam__wisp--3" d="M58 35 q-4 -5 0 -9 q4 -5 0 -9" />
          </g>

          <!-- Taza -->
          <g class="cup">
            <!-- Asa -->
            <path class="cup__handle" d="M71 47 c12 0 12 17 0 17" />
            <!-- Cuerpo -->
            <path class="cup__body" d="M28 40 h44 l-4 27 q-1 7 -8 7 H40 q-7 0 -8 -7 Z" />
            <!-- Superficie del café: gira dentro de la taza -->
            <g class="cup__surface">
              <ellipse class="cup__coffee" cx="0" cy="0" rx="22" ry="22" />
              <g class="cup__swirl">
                <path d="M-13 0 a13 13 0 0 1 26 0" />
                <path d="M7 0 a7 7 0 0 1 -14 0" />
              </g>
            </g>
            <!-- Platillo -->
            <ellipse class="cup__saucer" cx="50" cy="79" rx="30" ry="5" />
          </g>
        </svg>
      </div>

      @if (showMessage) {
        <p class="coffee-loader__text" [appTranslate]="messageKey">Cargando...</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .coffee-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.85rem;
      }

      /* Modo pantalla completa: velo difuminado por encima de todo */
      .coffee-loader--overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        /* Velo opaco y liso a propósito: difuminar el fondo (backdrop-filter)
           obliga al móvil a recomponer toda la pantalla en cada cuadro, y en un
           equipo de gama baja eso se nota más que el propio loader. */
        background: rgba(var(--surface-color-rgb, 255, 255, 255), 0.92);
        animation: loader-fade-in 0.25s ease-out both;
      }

      .coffee-loader__box {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .coffee-loader__svg {
        overflow: visible;
      }

      .coffee-loader__text {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.02em;
        color: rgb(var(--text-color-rgb, 31, 41, 55));
        animation: loader-pulse 1.8s ease-in-out infinite;
      }

      /* ---------- Anillo ---------- */
      .ring-track {
        fill: none;
        stroke: rgba(var(--primary-color-rgb, 111, 78, 55), 0.15);
        stroke-width: 4;
      }

      .ring-arc {
        fill: none;
        stroke: var(--primary-color, #6f4e37);
        stroke-width: 4;
        stroke-linecap: round;
        /* Arco de ~1/4 de circunferencia (2πr ≈ 283) que además "respira" */
        stroke-dasharray: 70 213;
        transform-origin: 50% 50%;
        animation:
          loader-spin 1.4s linear infinite,
          loader-dash 2.8s ease-in-out infinite;
      }

      /* ---------- Taza ---------- */
      .cup__body {
        fill: var(--surface-color, #ffffff);
        stroke: var(--primary-color, #6f4e37);
        stroke-width: 3.5;
        stroke-linejoin: round;
      }

      .cup__handle {
        fill: none;
        stroke: var(--primary-color, #6f4e37);
        stroke-width: 3.5;
        stroke-linecap: round;
      }

      .cup__saucer {
        fill: none;
        stroke: var(--primary-color, #6f4e37);
        stroke-width: 3.5;
        stroke-linecap: round;
        opacity: 0.9;
      }

      /*
       * El café se dibuja en un grupo centrado en la boca de la taza y aplastado
       * en vertical: así, al girar sus hijos, se ve como un remolino en
       * perspectiva y no como un círculo dando vueltas de frente.
       */
      .cup__surface {
        transform: translate(50px, 40px) scaleY(0.22);
      }

      .cup__coffee {
        fill: var(--primary-color, #6f4e37);
      }

      .cup__swirl {
        transform-origin: 0 0;
        animation: loader-spin 1.9s linear infinite;
      }

      .cup__swirl path {
        fill: none;
        stroke: rgba(var(--surface-color-rgb, 255, 255, 255), 0.55);
        stroke-width: 6;
        stroke-linecap: round;
      }

      /* ---------- Vapor ---------- */
      .steam__wisp {
        fill: none;
        stroke: rgba(var(--primary-color-rgb, 111, 78, 55), 0.45);
        stroke-width: 3;
        stroke-linecap: round;
        opacity: 0;
        /* fill-box: el escalado del vapor se hace sobre sí mismo, no sobre el
           origen del lienzo (si no, la voluta se va de la taza al animarse). */
        transform-box: fill-box;
        transform-origin: center;
        animation: loader-steam 2.6s ease-in-out infinite;
      }

      .steam__wisp--2 {
        animation-delay: 0.45s;
      }

      .steam__wisp--3 {
        animation-delay: 0.9s;
      }

      @keyframes loader-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes loader-dash {
        0%,
        100% {
          stroke-dasharray: 40 243;
        }
        50% {
          stroke-dasharray: 150 133;
        }
      }

      @keyframes loader-steam {
        0% {
          opacity: 0;
          transform: translateY(6px) scale(0.9);
        }
        35% {
          opacity: 1;
        }
        100% {
          opacity: 0;
          transform: translateY(-10px) scale(1.05);
        }
      }

      @keyframes loader-pulse {
        0%,
        100% {
          opacity: 0.7; /* más bajo deja el texto ilegible a ratos */
        }
        50% {
          opacity: 1;
        }
      }

      @keyframes loader-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      /* Accesibilidad: sin animación para quien la tiene desactivada */
      @media (prefers-reduced-motion: reduce) {
        .ring-arc,
        .cup__swirl,
        .steam__wisp,
        .coffee-loader__text,
        .coffee-loader--overlay {
          animation: none;
        }
        .steam__wisp {
          opacity: 0.6;
        }
      }
    `,
  ],
})
export class CoffeeLoaderComponent {
  /** Lado del dibujo en píxeles. */
  @Input() size = 72;
  /** Si ocupa toda la pantalla por encima del contenido. */
  @Input() overlay = false;
  /** Muestra el texto bajo la taza. */
  @Input() showMessage = true;
  /** Clave i18n del texto (por defecto "Cargando..."). */
  @Input() messageKey = 'COMMON.LOADING';
}
