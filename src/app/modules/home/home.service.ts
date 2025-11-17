import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { GeneralService } from '../../core/gerneral.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  constructor(
    private http: HttpClient,
    private generalService: GeneralService,
    private router: Router
  ) {}

  private get url(): string {
    return environment.backend;
  }

     
      postDms(data:any) {
         return firstValueFrom(this.http.post(`${environment.backend}/users`, data));
      }

      getUsers() {
        return firstValueFrom(this.http.get(`${environment.backend}/users`));
      }

      getUser() {
        return firstValueFrom(this.http.get(`${environment.backend}/user`));
      }

      getUserLog(id:string, params:any) {
        return firstValueFrom(this.http.get(`${environment.backend}/user-logs/user/${id}`,{params}));
      }

      

      getDmsByImgD(id: string) {
        return firstValueFrom(this.http.get(`${environment.backend}/dms/${id}`));
      }

       getAuctions() {
        const orderBy ={"createdAt":"asc"}
        const params = new HttpParams()
      .set('orderBy', JSON.stringify(orderBy))
      .set('perPage', JSON.stringify(1000))
     
        return firstValueFrom(this.http.get(`${environment.backend}/dynamic/auction/all/paginate`,{params}));
      }

       createAuctions(data: any) {
        return firstValueFrom(this.http.post(`${environment.backend}/dynamic/auction/`, data));
      }

       updateAuctions(id: string, data: any) {
        return firstValueFrom(this.http.put(`${environment.backend}/auctions/${id}`, data));
      }

      getSellers() {
        const orderBy ={"createdAt":"desc"}
        const where = {"roleId":{"equals":"58005159-2d57-4db9-aa4a-34bf3f5b20ff"}}
        const include ={"coffeeLots": true}

        const params = new HttpParams()
      .set('orderBy', JSON.stringify(orderBy))
      .set('where', JSON.stringify(where))
      .set('include', JSON.stringify(include))
      .set('perPage', JSON.stringify(1000))
        return firstValueFrom(this.http.get(`${environment.backend}/dynamic/user/all/paginate`,{params}));
      }
     getAuctionCoofeeLot(auctionId: string) {
        const orderBy ={"createdAt":"desc"}
        const where = {"auctionId":{"equals":auctionId}}
        const include ={"coffeeLots": true}

        const params = new HttpParams()
       .set('orderBy', JSON.stringify(orderBy))
       .set('where', JSON.stringify(where))
       .set('perPage', JSON.stringify(1000))
      /* .set('include', JSON.stringify(include)) */
        return firstValueFrom(this.http.get(`${environment.backend}/dynamic/CoffeeLot/all/paginate`,{params}));
      }

      getCoofeeLot(sellerId: string) {
        const orderBy ={"createdAt":"desc"}
        const where = {"sellerId":{"equals":sellerId}}
        const include ={"auction": true}

        const params = new HttpParams()
      .set('orderBy', JSON.stringify(orderBy))
      .set('where', JSON.stringify(where))
      .set('include', JSON.stringify(include))
      .set('perPage', JSON.stringify(1000))
        return firstValueFrom(this.http.get(`${environment.backend}/dynamic/CoffeeLot/all/paginate`,{params}));
      }

      createLot(data: any) {
        return firstValueFrom(this.http.post(`${environment.backend}/coffee-lots`, data));
      }

       updateLot(id:any,data: any) {
        delete data.startingPrice;
        return firstValueFrom(this.http.put(`${environment.backend}/coffee-lots/${id}`, data));
      }

      getCofeeLot(id : any) {
        return firstValueFrom(this.http.get(`${environment.backend}/coffee-lots/${id}`, ));
      }

      
     
       getAutionCurrent() {
        return firstValueFrom(this.http.get(`${environment.backend}/auctions/active-current/`, ));
      }

       addLotAution(data: any) {
        return firstValueFrom(this.http.post(`${environment.backend}/coffee-lots/add-to-auction`, data));
      }

       editLotAution(id:string,data: any) {
        return firstValueFrom(this.http.patch(`${environment.backend}/dynamic/AuctionCoffeeLot/${id}`, data));
      }

       removeLotAution(data: any) {
        return firstValueFrom(this.http.delete(`${environment.backend}/coffee-lots/auction/${data.auctionId}/lot/${data.coffeeLotId}`));
      }


       getAutionsLots(auctionId: string) {
        const orderBy ={"createdAt":"desc"}
        const where = {id:{equals:auctionId}}
        const include ={"coffeeLots":true}

        const params = new HttpParams()
      .set('orderBy', JSON.stringify(orderBy))
      .set('where', JSON.stringify(where))
      .set('include', JSON.stringify(include))
      .set('perPage', JSON.stringify(1000))
        return firstValueFrom(this.http.get(`${environment.backend}/dynamic/Auction/all/paginate`,{params}));
      }

      getAution(id: string) {
        return firstValueFrom(this.http.get(`${environment.backend}/auctions/${id}`, ));
       }

      getAutionTransactions(id: string) {
        return firstValueFrom(this.http.get(`${environment.backend}/transactions/auction/${id}/sales`, ));
       } 

       getLastAutionTransactions() {
        return firstValueFrom(this.http.get(`${environment.backend}/auctions/auction/find-last`, ));
       } 

       getAuctionsClose() {
        const orderBy ={"createdAt":"asc"}
        const where = {"status":{"equals":"CLOSED"}}
        const params = new HttpParams()
      .set('orderBy', JSON.stringify(orderBy))
      .set('where', JSON.stringify(where))
      .set('perPage', JSON.stringify(1000))
     
        return firstValueFrom(this.http.get(`${environment.backend}/dynamic/auction/all/paginate`,{params}));
      }


       updateStatusUser(data: any) {
        return firstValueFrom(this.http.put(`${environment.backend}/users/updateStatus/${data.id}`, data ));
       } 

        deleteUser(id: string) {
        return firstValueFrom(this.http.delete(`${environment.backend}/users/${id}`));
       } 
 




}