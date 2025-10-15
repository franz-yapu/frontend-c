import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionsCoffeeComponent } from './transactions-coffee.component';

describe('TransactionsCoffeeComponent', () => {
  let component: TransactionsCoffeeComponent;
  let fixture: ComponentFixture<TransactionsCoffeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsCoffeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionsCoffeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
