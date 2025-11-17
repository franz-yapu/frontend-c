// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  region?: string;
  variety?: string;
  process?: string;
}

export interface DashboardData {
  auctionSummary: any;
  lotPerformance: any;
  transactionAnalytics: any;
  userActivity: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {


  constructor(private http: HttpClient) {}

  getAdminDashboard(filters: DashboardFilters): Observable<DashboardData> {
    let params = new HttpParams();
    
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.region) params = params.set('region', filters.region);
    if (filters.variety) params = params.set('variety', filters.variety);
    if (filters.process) params = params.set('process', filters.process);
   

    return this.http.get<DashboardData>(`${environment.backend}/dashboard/admin/summary`, { params });
  }
}