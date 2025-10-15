import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}



  setSaveToken(data: any) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(environment.appCode + '.token', data.token);
      localStorage.setItem(environment.appCode + '.userData',  JSON.stringify(data.user));
    }
  }

  getToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(environment.appCode + '.token');
    }
    return null; 
  }

  logout(){
    if (isPlatformBrowser(this.platformId)) {
       localStorage.removeItem(environment.appCode + '.token');
       localStorage.removeItem(environment.appCode + '.userData');
    }
    return null; 
  }
  

   getUser() {
    if (isPlatformBrowser(this.platformId)) {
       const user = localStorage.getItem(environment.appCode + '.userData');
      if (user) {
       return JSON.parse(user);
       } else {
        // Maneja el caso cuando no hay datos en localStorage
       return null; // o un objeto vacío {}, según convenga
     }
    }
    return null; 
  }



  show() {
    this.loadingSubject.next(true);
  }

  hide() {
    this.loadingSubject.next(false);
  }


}