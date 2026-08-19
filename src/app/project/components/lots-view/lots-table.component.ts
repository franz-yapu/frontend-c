import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipe/translate.pipe';

/** Columnas que sabe pintar la tabla. Cada pantalla pide las suyas. */
export type LotColumn =
  | 'position'
  | 'name'
  | 'score'
  | 'process'
  | 'altitude'
  | 'origin'
  | 'quantity'
  | 'price'
  | 'value'
  | 'bids'
  | 'leader'
  | 'status';

/**
 * Fila normalizada. La pública y la del comprador manejan `AuctionDetail`
 * (con `coffeeLot` dentro) y el admin maneja `CoffeeLot` a secas, con nombres
 * de campo distintos; en vez de que la tabla adivine, cada pantalla traduce lo
 * suyo a esta forma y la tabla se queda tonta.
 */
export interface LotRow {
  id: string;
  /** id del CoffeeLot: es el que usan las pujas y el detalle. */
  lotId: string;
  position: number | string | null;
  name: string;
  subtitle: string;
  score: number | null;
  process: string | null;
  altitude: number | null;
  origin: string;
  quantity: number | null;
  /** Precio por libra: la oferta actual, o el sugerido en admin. */
  price: number | null;
  /** price × quantity. */
  value: number | null;
  bidsCount: number | null;
  status?: string | null;
  /** Quien va ganando el lote: la empresa del mejor postor y, si no tiene,
   *  su nombre y apellido. Null si todavia no hay pujas. */
  leaderName?: string | null;
  /** El mejor postor es el propio usuario (se enseña "Vas ganando"). */
  destacada?: boolean;
  destacadaTexto?: string | null;
  /** El objeto original, que es lo que reciben las acciones. */
  raw: any;
}

@Component({
  selector: 'app-lots-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './lots-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotsTableComponent {
  @Input() rows: LotRow[] = [];
  @Input() columns: LotColumn[] = [
    'position',
    'name',
    'score',
    'process',
    'origin',
    'quantity',
    'price',
    'value',
    'bids',
  ];
  @Input() sortBy: string = 'position';
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  /** Fila a resaltar un instante porque acaba de llegar una puja suya. */
  @Input() pulsoLotId: string | null = null;
  /** Botones de la última columna; recibe la fila original en `$implicit`. */
  @Input() acciones: TemplateRef<any> | null = null;
  @Input() textoVacio: string = '';
  /** Claves de traduccion para renombrar columnas por pantalla: en admin la
   *  columna de precio no es una oferta sino el precio sugerido del lote. */
  @Input() etiquetasPersonalizadas: Partial<Record<LotColumn, string>> = {};
  /** Pantallas sin criterio de orden (admin) apagan las cabeceras pulsables:
   *  un encabezado que parece un boton y no hace nada engaña. */
  @Input() ordenable: boolean = true;

  @Output() sortChange = new EventEmitter<string>();
  @Output() rowClick = new EventEmitter<any>();

  /** Solo estas columnas ordenan: las demás no tienen un criterio en los
   *  componentes que ya existen y un encabezado que no hace nada engaña. */
  private readonly ordenables = new Set<LotColumn>([
    'position',
    'name',
    'score',
    'price',
    'quantity',
  ]);

  /** A qué ancho aparece cada columna. Las imprescindibles para comparar
   *  (lote, cantidad, precio y acciones) no se esconden nunca. */
  private readonly visibilidad: Record<LotColumn, string> = {
    position: '',
    name: '',
    // En un movil de 390 px solo caben el numero, el lote y las acciones. El
    // puntaje y el precio no se pierden: se resumen dentro de la celda del lote
    // (ver la plantilla), asi no hace falta scroll horizontal para ver lo que
    // decide una puja.
    score: 'hidden sm:table-cell',
    process: 'hidden lg:table-cell',
    altitude: 'hidden xl:table-cell',
    origin: 'hidden lg:table-cell',
    quantity: 'hidden sm:table-cell',
    price: 'hidden sm:table-cell',
    leader: 'hidden sm:table-cell',
    value: 'hidden xl:table-cell',
    bids: 'hidden lg:table-cell',
    status: 'hidden lg:table-cell',
  };

  private readonly etiquetas: Record<LotColumn, string> = {
    position: 'AUCTION-BUYER.COL_POSITION',
    name: 'AUCTION-BUYER.COL_LOT',
    score: 'AUCTION-BUYER.COL_SCORE',
    process: 'AUCTION-BUYER.COL_PROCESS',
    altitude: 'AUCTION-BUYER.COL_ALTITUDE',
    origin: 'AUCTION-BUYER.COL_ORIGIN',
    quantity: 'AUCTION-BUYER.COL_QUANTITY',
    price: 'AUCTION-BUYER.COL_CURRENT_BID',
    value: 'AUCTION-BUYER.COL_VALUE',
    bids: 'AUCTION-BUYER.COL_BIDS',
    leader: 'AUCTION-BUYER.COL_LEADER',
    status: 'AUCTION-BUYER.COL_STATUS',
  };

  /** Los números van a la derecha: si no, las columnas de dinero no se pueden
   *  comparar de una pasada de ojos. */
  private readonly numericas = new Set<LotColumn>([
    'score',
    'altitude',
    'quantity',
    'price',
    'value',
    'bids',
  ]);

  /** ¿Pidió esta pantalla esa columna? Lo usa el resumen de movil. */
  pide(col: LotColumn): boolean {
    return this.columns.includes(col);
  }

  etiqueta(col: LotColumn): string {
    return this.etiquetasPersonalizadas[col] || this.etiquetas[col];
  }

  claseColumna(col: LotColumn): string {
    return this.visibilidad[col] || '';
  }

  esNumerica(col: LotColumn): boolean {
    return this.numericas.has(col);
  }

  esOrdenable(col: LotColumn): boolean {
    return this.ordenable && this.ordenables.has(col);
  }

  /** El criterio de orden que entienden los componentes: coincide con la
   *  columna salvo el nombre, que allí se llama 'name'. */
  criterio(col: LotColumn): string {
    return col;
  }

  ordenarPor(col: LotColumn): void {
    if (this.esOrdenable(col)) this.sortChange.emit(this.criterio(col));
  }

  flecha(col: LotColumn): string {
    if (this.sortBy !== this.criterio(col)) return '';
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  pulsa(row: LotRow): boolean {
    return !!this.pulsoLotId && this.pulsoLotId === row.lotId;
  }
}
