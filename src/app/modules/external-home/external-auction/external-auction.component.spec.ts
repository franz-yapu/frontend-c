import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalAuctionComponent } from './external-auction.component';

describe('ExternalAuctionComponent', () => {
  let component: ExternalAuctionComponent;
  let fixture: ComponentFixture<ExternalAuctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalAuctionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalAuctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
