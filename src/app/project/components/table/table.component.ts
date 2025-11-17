import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-data-table',
  templateUrl: './table.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T extends Record<string, any>> implements OnInit {
  @Input() columns: TableColumn[] = [];
  @Input() data: T[] = [];
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  @Input() currentPage = 1;
  @Input() loading = false;
  
  @Input() showReload = true;
  @Input() actionButtons: ActionButton[] = [];
  
  @Output() reload = new EventEmitter<void>();
  @Output() action = new EventEmitter<{action: string, item?: any}>();
  @Output() statusChange = new EventEmitter<{item: T, newStatus: boolean}>();

  @Output() sortChange = new EventEmitter<{field: string, direction: SortDirection}>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<T>();

  filteredData: T[] = [];
  searchTerm = '';
  sortField = '';
  sortDirection: SortDirection = 'none';
  pages: number[] = [];

  ngOnInit() {
    this.filteredData = [...this.data];
    this.calculatePages();
  }

  ngOnChanges() {
    this.filteredData = [...this.data];
    this.calculatePages();
  }

  calculatePages() {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  onSort(field: string) {
    // Cambiar dirección
    this.sortDirection = this.sortField === field && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortField = field;

    // Ordenar
    this.filteredData = [...this.filteredData].sort((a, b) => {
      const valA = a[field]?.toString().toLowerCase() || '';
      const valB = b[field]?.toString().toLowerCase() || '';
      return valA.localeCompare(valB) * (this.sortDirection === 'asc' ? 1 : -1);
    });
  }

  onSearch() {
    if (!this.searchTerm) {
      this.filteredData = [...this.data];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredData = this.data.filter(item => 
      Object.values(item).some(val => 
        val?.toString().toLowerCase().includes(term))
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.pageChange.emit(page);
  }

  onRowClick(item: T) {
    this.rowClick.emit(item);
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '⇅';
    switch (this.sortDirection) {
      case 'asc': return '↑';
      case 'desc': return '↓';
      default: return '⇅';
    }
  }

  getDisplayValue(item: T, key: string): any {
    const column = this.columns.find(c => c.key === key);
    if (column && column.format) {
      return column.format(item[key]);
    }
    return item[key];
  }

  onReload() {
    this.searchTerm = '';
    this.sortDirection = 'none';
    this.reload.emit();
  }

  onAction(action: string, item?: any) {
    this.action.emit({action, item});
  }

  // Método para obtener las clases CSS del estado
  getEstadoClasses(item: any): string {
    const isVerified = item.isVerified || item.verified || item.estado;
    return isVerified 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  // Método para mostrar el texto del estado
  getEstadoDisplay(item: any): string {
    const isVerified:any = item.isVerified || item.verified || item.estado;
    return isVerified ? 'Activo' : 'Desactivado';
  }

  // Método para cambiar el estado (opcional)
  toggleEstado(item: any) {
    const currentStatus = item.isVerified || item.verified || item.estado;
    const newStatus = !currentStatus;
    
    // Emitir el cambio de estado
    this.statusChange.emit({ item, newStatus });
  }

  getButtonClasses(btn: ActionButton): string {
    const baseClasses = 'inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
    const colorClasses = {
      primary: 'border-transparent bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500',
      secondary: 'border-transparent bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      danger: 'border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success: 'border-transparent bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
    };
    return `${baseClasses} ${colorClasses[btn.color || 'primary']}`;
  }

  getSmallButtonClasses(btn: ActionButton): string {
    const baseClasses = 'inline-flex items-center p-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
    const colorClasses = {
      primary: 'border-transparent bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500',
      secondary: 'border-transparent bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      danger: 'border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success: 'border-transparent bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
    };
    return `${baseClasses} ${colorClasses[btn.color || 'primary']}`;
  }
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  format?: (value: any) => string;
}

export type SortDirection = 'asc' | 'desc' | 'none';

export interface ActionButton {
  label: string;
  icon?: string;
  action: string;
  color?: 'primary' | 'secondary' | 'danger' | 'success';
  showCondition?: (item?: any) => boolean;
}