// src/app/components/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { DashboardFilters, DashboardService } from '../../../project/services/dashboard.service';


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

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboard();
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
    
    const backgroundColors = [
      '#10B981', // verde para activas
      '#EF4444', // rojo para cerradas  
      '#6B7280', // gris para borrador
      '#F59E0B', // amber para otras
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

    return {
      labels,
      datasets: [
        {
          label: 'Número de Lotes',
          data,
          backgroundColor: '#8B5CF6',
          borderColor: '#7C3AED',
          borderWidth: 1,
        },
      ],
    };
  }

  getRevenueChartData() {
    if (!this.dashboardData?.transactionAnalytics?.revenueByMonth) return { labels: [], datasets: [] };

    const labels = this.dashboardData.transactionAnalytics.revenueByMonth.map((item: any) => item.month);
    const data = this.dashboardData.transactionAnalytics.revenueByMonth.map((item: any) => item.revenue);

    return {
      labels,
      datasets: [
        {
          label: 'Ingresos ($)',
          data,
          fill: true,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10B981',
          tension: 0.4,
        },
      ],
    };
  }

  getUserRoleChartData() {
    if (!this.dashboardData?.userActivity?.byRole) return { labels: [], datasets: [] };

    const labels = this.dashboardData.userActivity.byRole.map((item: any) => item.role);
    const data = this.dashboardData.userActivity.byRole.map((item: any) => item.count);

    const backgroundColors = [
      '#3B82F6', // azul
      '#10B981', // verde
      '#F59E0B', // amber
      '#EF4444', // rojo
      '#8B5CF6', // violeta
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
      'ACTIVE': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-red-100 text-red-800', 
      'DRAFT': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-orange-100 text-orange-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}