import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translate.service';

/**
 * Muestra el proceso del café traducido. En el admin el campo "Proceso" es texto
 * libre, así que en la base hay códigos (WASHED) y también textos ("Lavado",
 * "washed", "Anaerobico"...). Antes se armaba la clave 'COFFEE_PROCESS.' + valor
 * y con "Lavado" la pantalla mostraba "COFFEE_PROCESS.Lavado".
 * Ahora se reconoce el código o el nombre en español/inglés (sin importar
 * mayúsculas ni tildes) y, si es un proceso desconocido, se muestra tal cual.
 */
const PROCESOS: Record<string, string> = {
  washed: 'WASHED', lavado: 'WASHED',
  natural: 'NATURAL',
  honey: 'HONEY', miel: 'HONEY',
  anaerobic: 'ANAEROBIC', anaerobico: 'ANAEROBIC',
  pulped: 'PULPED', despulpado: 'PULPED',
  other: 'OTHER', otro: 'OTHER',
};

const normalizar = (v: string) =>
  v.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

@Pipe({
  name: 'procesoCafe',
  standalone: true,
  pure: false, // cambia con el idioma, igual que el pipe translate
})
export class ProcesoCafePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(valor: string | null | undefined): string {
    if (!valor) return '—';
    const codigo = PROCESOS[normalizar(valor)];
    if (!codigo) return valor;
    const clave = `COFFEE_PROCESS.${codigo}`;
    const texto = this.translationService.translate(clave);
    return texto === clave ? valor : texto;
  }
}
