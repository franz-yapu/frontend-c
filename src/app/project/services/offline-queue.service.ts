import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface QueuedBid {
  id: string;
  data: any;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private queue: QueuedBid[] = [];
  private queueSubject = new BehaviorSubject<QueuedBid[]>([]);
  
  queue$ = this.queueSubject.asObservable();
  
  addBid(bidData: any): string {
    const id = `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedBid: QueuedBid = {
      id,
      data: bidData,
      timestamp: Date.now()
    };
    
    this.queue.push(queuedBid);
    this.saveToStorage();
    this.queueSubject.next([...this.queue]);
    
    return id;
  }
  
  removeBid(id: string): void {
    this.queue = this.queue.filter(bid => bid.id !== id);
    this.saveToStorage();
    this.queueSubject.next([...this.queue]);
  }
  
  getPendingBids(): QueuedBid[] {
    return this.queue;
  }
  
  clearQueue(): void {
    this.queue = [];
    localStorage.removeItem('auction_bid_queue');
    this.queueSubject.next([]);
  }
  
  private saveToStorage(): void {
    try {
      localStorage.setItem('auction_bid_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving bid queue:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('auction_bid_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
        this.queueSubject.next([...this.queue]);
      }
    } catch (error) {
      console.error('Error loading bid queue:', error);
    }
  }
}