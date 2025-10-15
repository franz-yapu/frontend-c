import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyerAuctionComponent } from './buyer-auction.component';

describe('BuyerAuctionComponent', () => {
  let component: BuyerAuctionComponent;
  let fixture: ComponentFixture<BuyerAuctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyerAuctionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuyerAuctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
