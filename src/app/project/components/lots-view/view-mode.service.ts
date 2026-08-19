import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

export type ViewMode = 'cards' | 'table';

/**
 * Recuerda si cada pantalla enseña los lotes como tarjetas o como tabla.
 *
 * Las tres pantallas (`public`, `buyer`, `admin`) arrancan en **tabla**, pero
 * la preferencia se guarda por separado: quien cambie a tarjetas en una las
 * sigue viendo asi sin afectar a las demas. Vale en cualquier tamaño: en el
 * movil la tabla se reduce a lo esencial en vez de esconderse.
 */
@Injectable({ providedIn: 'root' })
export class ViewModeService {
  private platformId = inject(PLATFORM_ID);

  private clave(vista: string): string {
    return `${environment.appCode}.viewmode.${vista}`;
  }

  leer(vista: string, porDefecto: ViewMode): ViewMode {
    if (!isPlatformBrowser(this.platformId)) return porDefecto;
    const guardado = localStorage.getItem(this.clave(vista));
    return guardado === 'cards' || guardado === 'table' ? guardado : porDefecto;
  }

  guardar(vista: string, modo: ViewMode): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.clave(vista), modo);
  }
}
