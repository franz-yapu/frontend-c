import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { GeneralService } from '../../core/gerneral.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private generalService: GeneralService,
    private router: Router
  ) { }

  private get url(): string {
    return environment.backend;
  }

  //  Método de login
  login(credentials: { email: string, password: string }) {
    return this.http.post(`${environment.backend}/auth/login`, credentials, {
    }).pipe(
      tap((response: any) => {
        if (response.access_token) {
          this.generalService.setSaveToken(response);

        }
      })
    );
  }

  register(data: any) {
    return firstValueFrom(this.http.post(`${environment.backend}/auth/register`, data));
  }

  updateUser(id: string, data: any) {
    return firstValueFrom(this.http.patch(`${environment.backend}/dynamic/user/${id}`, data));
  }

  changePassword( data: any) {
    return firstValueFrom(this.http.post(`${environment.backend}/auth/change-password`, data));
  }

   verifyRegistrationToken(token: any) {
    return firstValueFrom(this.http.post(`${environment.backend}/auth/confirm`, {token:token}));
  }


  
  getUser(id:string) {
    const where =  {id:{equals:id}};
    const include = {"role":true}
    const params = new HttpParams()
      .set('where', JSON.stringify(where))
      .set('include', JSON.stringify(include));
    return firstValueFrom(this.http.get(`${environment.backend}/dynamic/user/all/paginate`, { params }));
  }

  //  Método de logout
  logout() {
    this.generalService.logout();
    this.router.navigate(['/']);
  }
  // dms

  postDms(data: any) {
    return firstValueFrom(this.http.post(`${environment.backend}/dms/upload`, data));
  }

  getDmsById(id: string) {
    return firstValueFrom(this.http.get(`${environment.backend}/dms/${id}`));
  }

  getDmsByImgD(id: string) {
    return firstValueFrom(this.http.get(`${environment.backend}/dms/${id}`));
  }
  getRoles() {
    return firstValueFrom(this.http.get(`${environment.backend}/dynamic/role`));
  }
 //users seller
  getUserSellers() {
    const where =  {roleId:{equals:'58005159-2d57-4db9-aa4a-34bf3f5b20ff'}};
    const params = new HttpParams()
      .set('where', JSON.stringify(where))
    return firstValueFrom(this.http.get(`${environment.backend}/dynamic/user/all/paginate`, { params }));
  }










}