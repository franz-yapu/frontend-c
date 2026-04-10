// src/app/components/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { DashboardFilters, DashboardService } from '../../../project/services/dashboard.service';
import { BrandingService } from '../../../core/branding/branding.service';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  loading = false;
  dashboardData: any = null;
  filters: DashboardFilters = {};
  
  // Opciones de filtro
  regions: string[] = ['La Paz', 'Santa Cruz', 'Cochabamba'];
  varieties: string[] = ['geisha', 'castillo', 'Pacamara', 'catuai rojo'];
  processes: string[] = ['lavado', 'natural', 'honey'];

  // Opciones de gráficos
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  constructor(
    private dashboardService: DashboardService,
    private brandingService: BrandingService
  ) {}

  ngOnInit() {
    this.loadDashboard();
    // Suscribirse a cambios de branding para actualizar gráficos si es necesario
    this.brandingService.config$.subscribe(() => {
       // Los gráficos se repintarán si sus métodos de data se llaman de nuevo
    });
  }

  loadDashboard() {
    this.loading = true;
    this.dashboardService.getAdminDashboard(this.filters).subscribe({
      next: (data:any) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (error:any) => {
        console.error('Error loading dashboard:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.loadDashboard();
  }

  clearFilters() {
    this.filters = {};
    this.loadDashboard();
  }

  // Métodos para preparar datos de gráficos
  getAuctionStatusChartData() {
    if (!this.dashboardData?.auctionSummary?.byStatus) return { labels: [], datasets: [] };

    const labels = this.dashboardData.auctionSummary.byStatus.map((item: any) => 
      item.status === 'ACTIVE' ? 'Activas' : 
      item.status === 'CLOSED' ? 'Cerradas' : 
      item.status === 'DRAFT' ? 'Borrador' : item.status
    );
    
    const data = this.dashboardData.auctionSummary.byStatus.map((item: any) => item.count);
    
    const config = this.brandingService.currentConfig;
    const backgroundColors = [
      config.successColor, // verde para activas
      config.dangerColor,  // rojo para cerradas  
      '#6B7280',           // gris para borrador (puedes usar surface-400 si quieres)
      config.warningColor, // primary para otras
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  }

  getLotScoreChartData() {
    if (!this.dashboardData?.lotPerformance?.byScore) return { labels: [], datasets: [] };

    const labels = this.dashboardData.lotPerformance.byScore.map((item: any) => item.range);
    const data = this.dashboardData.lotPerformance.byScore.map((item: any) => item.count);

    const config = this.brandingService.currentConfig;
    return {
      labels,
      datasets: [
        {
          label: 'Número de Lotes',
          data,
          backgroundColor: config.secondaryColor,
          borderColor: config.secondaryColor,
          borderWidth: 1,
        },
      ],
    };
  }

  getRevenueChartData() {
    if (!this.dashboardData?.transactionAnalytics?.revenueByMonth) return { labels: [], datasets: [] };

    const labels = this.dashboardData.transactionAnalytics.revenueByMonth.map((item: any) => item.month);
    const data = this.dashboardData.transactionAnalytics.revenueByMonth.map((item: any) => item.revenue);

    const config = this.brandingService.currentConfig;
    return {
      labels,
      datasets: [
        {
          label: 'Ingresos ($)',
          data,
          fill: true,
          backgroundColor: `rgba(var(--primary-color-rgb), 0.2)`,
          borderColor: config.primaryColor,
          tension: 0.4,
        },
      ],
    };
  }

  getUserRoleChartData() {
    if (!this.dashboardData?.userActivity?.byRole) return { labels: [], datasets: [] };

    const labels = this.dashboardData.userActivity.byRole.map((item: any) => item.role);
    const data = this.dashboardData.userActivity.byRole.map((item: any) => item.count);

    const config = this.brandingService.currentConfig;
    const backgroundColors = [
      config.infoColor,      // azul
      config.successColor,   // verde
      config.warningColor,   // primary
      config.dangerColor,    // rojo
      config.secondaryColor, // violeta/secundario
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'ACTIVE': 'bg-success-100 text-success-700',
      'CLOSED': 'bg-danger-100 text-danger-700', 
      'DRAFT': 'bg-surface-100 text-content/60',
      'CANCELLED': 'bg-warning-100 text-warning-700',
    };
    return classes[status] || 'bg-surface-100 text-content/50';
  }
}