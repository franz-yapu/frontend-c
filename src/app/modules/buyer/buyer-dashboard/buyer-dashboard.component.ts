// src/app/components/buyer-dashboard/buyer-dashboard.component.ts (corregido)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { BuyerDashboardFilters, BuyerDashboardService } from '../../../project/services/buyer-dashboard.service';
import { GeneralService } from '../../../core/gerneral.service';

@Component({
  selector: 'app-buyer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './buyer-dashboard.component.html',
  styleUrls: ['./buyer-dashboard.component.scss']
})
export class BuyerDashboardComponent implements OnInit {
  userId: any;
  loading = false;
  dashboardData: any = null;
  filters: BuyerDashboardFilters = {
    userId: ''
  };
  
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
        display: true,
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
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };

  constructor(
    private dashboardService: BuyerDashboardService, 
    private generalService: GeneralService
  ) {}

  ngOnInit() {
    const dataUser: any = this.generalService.getUser();
    this.userId = dataUser.id;
    
    // Establecer fechas por defecto (últimos 30 días)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    this.filters.startDate = startDate.toISOString().split('T')[0];
    this.filters.endDate = endDate.toISOString().split('T')[0];
    
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.filters.userId = this.userId;
    
    this.dashboardService.getBuyerDashboard(this.filters).subscribe({
      next: (data: any) => {
        this.dashboardData = data;
        console.log('Dashboard data loaded:', data);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading buyer dashboard:', error);
        this.loading = false;
        alert('Error al cargar el dashboard: ' + error.message);
      }
    });
  }

  applyFilters() {
    this.loadDashboard();
  }

  clearFilters() {
    // Resetear filtros pero mantener fechas y usuario
    const startDate = this.filters.startDate;
    const endDate = this.filters.endDate;
    this.filters = {
      userId: this.userId,
      startDate: startDate,
      endDate: endDate
    };
    this.loadDashboard();
  }

  // Métodos para preparar datos de gráficos CORREGIDOS
  getBidEvolutionChartData() {
    if (!this.dashboardData?.bidHistory?.bidEvolution) {
      return { labels: [], datasets: [] };
    }

    const evolution = this.dashboardData.bidHistory.bidEvolution;
    const labels = evolution.map((item: any) => {
      // Formatear fecha para mostrar mejor
      const date = new Date(item.date);
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });
    
    const bidCounts = evolution.map((item: any) => item.bid_count);
    const averageBids = evolution.map((item: any) => item.average_bid);

    return {
      labels,
      datasets: [
        {
          label: 'Número de Pujas',
          data: bidCounts,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Puja Promedio ($)',
          data: averageBids,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ],
    };
  }

  getPriceTrendsChartData() {
    // CORREGIDO: Usar priceTrends en lugar de pricesByVariety
    if (!this.dashboardData?.priceTrends?.pricesByVariety) {
      return { labels: ['No data'], datasets: [{ data: [0], label: 'Sin datos' }] };
    }

    const prices = this.dashboardData.priceTrends.pricesByVariety;
    const labels = prices.map((item: any) => item.variety);
    const currentPrices = prices.map((item: any) => item.averageCurrentPrice || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Precio Actual Promedio',
          data: currentPrices,
          backgroundColor: '#EF4444',
        }
      ],
    };
  }

  getLotComparisonRadarData() {
    if (!this.dashboardData?.lotComparison?.radarData || 
        this.dashboardData.lotComparison.radarData.length === 0) {
      return { 
        labels: ['Puntaje', 'Altitud', 'Precio', 'Actividad', 'Valor'],
        datasets: [{ 
          label: 'Sin datos', 
          data: [0, 0, 0, 0, 0],
          backgroundColor: 'rgba(200, 200, 200, 0.2)',
          borderColor: 'gray'
        }]
      };
    }

    const radarData = this.dashboardData.lotComparison.radarData.slice(0, 5);
    const labels = ['Puntaje', 'Altitud', 'Precio', 'Actividad', 'Valor'];

    return {
      labels,
      datasets: radarData.map((lot: any, index: number) => {
        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
        return {
          label: lot.name,
          data: [
            lot.score || 0,
            (lot.altitude || 0) / 100, // Normalizar altitud
            (lot.price || 0) * 10, // Normalizar precio
            (lot.bidActivity || 0) * 5, // Normalizar actividad
            (lot.valueRatio || 0) * 100 // Normalizar ratio de valor
          ],
          backgroundColor: `rgba(${this.hexToRgb(colors[index])}, 0.2)`,
          borderColor: colors[index],
          pointBackgroundColor: colors[index],
        };
      })
    };
  }

  getWatchedLotsChartData() {
    // CORREGIDO: Usar watchedLots en lugar de priceTrends
    if (!this.dashboardData?.watchedLots) {
      return { 
        labels: ['Activos', 'Ganados', 'Perdidos'], 
        datasets: [{ data: [0, 0, 0], label: 'Sin datos' }] 
      };
    }

    const watched = this.dashboardData.watchedLots;
    const labels = ['Activos', 'Ganados', 'Perdidos'];
    const data = [
      watched.activeLots?.length || 0,
      watched.wonLots?.length || 0,
      watched.lostLots?.length || 0
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Lotes Seguidos',
          data,
          backgroundColor: [
            '#10B981', // Verde para activos
            '#3B82F6', // Azul para ganados  
            '#EF4444'  // Rojo para perdidos
          ],
        }
      ],
    };
  }

  // Método auxiliar para convertir hex a rgb
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
      : '59, 130, 246';
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'WON': 'bg-blue-100 text-blue-800',
      'LOST': 'bg-red-100 text-red-800',
      'CLOSED': 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getTimeRemainingClass(time: string): string {
    if (time.includes('Finalizado')) return 'text-red-600';
    if (time.includes('d') && parseInt(time) < 1) return 'text-orange-600';
    return 'text-green-600';
  }
}