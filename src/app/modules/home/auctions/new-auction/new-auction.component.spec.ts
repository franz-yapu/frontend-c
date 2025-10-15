import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAuctionComponent } from './new-auction.component';

describe('NewAuctionComponent', () => {
  let component: NewAuctionComponent;
  let fixture: ComponentFixture<NewAuctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewAuctionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewAuctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
