// src/app/services/buyer-dashboard.service.ts (corregido)
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BuyerDashboardFilters {
  userId: string;
  startDate?: string;
  endDate?: string;
  region?: string;
  variety?: string;
  process?: string;
  auctionId?: string;
  onlyMyBids?: boolean;
}

export interface BuyerDashboardData {
  bidHistory: any;
  lotComparison: any;
  priceTrends: any;
  watchedLots: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class BuyerDashboardService {

  constructor(private http: HttpClient) {}

  getBuyerDashboard(filters: BuyerDashboardFilters): Observable<BuyerDashboardData> {
    let params = new HttpParams();
    
    // Parámetros requeridos
    params = params.set('userId', filters.userId);
    
    // Parámetros opcionales
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.region) params = params.set('region', filters.region);
    if (filters.variety) params = params.set('variety', filters.variety);
    if (filters.process) params = params.set('process', filters.process);
    if (filters.auctionId) params = params.set('auctionId', filters.auctionId);
    if (filters.onlyMyBids) params = params.set('onlyMyBids', filters.onlyMyBids.toString());

    return this.http.get<BuyerDashboardData>(`${environment.backend}/dashboard/buyer/summary`, { params });
  }

  // Métodos individuales (opcionales)
  getBidHistory(filters: BuyerDashboardFilters): Observable<any> {
    let params = new HttpParams().set('userId', filters.userId);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.auctionId) params = params.set('auctionId', filters.auctionId);
    
    return this.http.get(`${environment.backend}/dashboard/buyer/bid-history`, { params });
  }

  getLotComparison(filters: BuyerDashboardFilters): Observable<any> {
    let params = new HttpParams().set('userId', filters.userId);
    if (filters.region) params = params.set('region', filters.region);
    if (filters.variety) params = params.set('variety', filters.variety);
    if (filters.process) params = params.set('process', filters.process);
    
    return this.http.get(`${environment.backend}/dashboard/buyer/lot-comparison`, { params });
  }

  getPriceTrends(filters: BuyerDashboardFilters): Observable<any> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.variety) params = params.set('variety', filters.variety);
    
    return this.http.get(`${environment.backend}/dashboard/buyer/price-trends`, { params });
  }

  getWatchedLots(filters: BuyerDashboardFilters): Observable<any> {
    let params = new HttpParams().set('userId', filters.userId);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    
    return this.http.get(`${environment.backend}/dashboard/buyer/watched-lots`, { params });
  }
}