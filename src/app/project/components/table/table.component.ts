import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-data-table',
  templateUrl: './table.component.html',
  imports: [CommonModule,FormsModule],
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
  
  // Nuevos inputs para controlar la visibilidad de los botones por fila
  @Input() showRowActions = true;
  @Input() showToggleButton = true;
  @Input() showDeleteButton = true;
  
  @Output() reload = new EventEmitter<void>();
  @Output() action = new EventEmitter<{action: string, item?: any}>();
  @Output() sortChange = new EventEmitter<{field: string, direction: SortDirection}>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<T>();
  
  // Nuevos outputs para las acciones por fila
  @Output() toggleStatus = new EventEmitter<{item: T, newStatus: boolean}>();
  @Output() deleteItem = new EventEmitter<T>();

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
    this.sortDirection = this.sortField === field && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortField = field;

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

  // Nuevos métodos para las acciones por fila
  onToggleStatus(item: any) {
    const newStatus = !item.isVerified;
    this.toggleStatus.emit({item, newStatus});
  }

  onDelete(item: T) {
    this.deleteItem.emit(item);
  }

  getToggleButtonClasses(item:any): string {
    const baseClasses = 'inline-flex items-center px-3 py-1 border rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (item.isVerified) {
      return `${baseClasses} border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 focus:ring-amber-500`;
    } else {
      return `${baseClasses} border-green-300 text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-500`;
    }
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