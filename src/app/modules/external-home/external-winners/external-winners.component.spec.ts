import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalWinnersComponent } from './external-winners.component';

describe('ExternalWinnersComponent', () => {
  let component: ExternalWinnersComponent;
  let fixture: ComponentFixture<ExternalWinnersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalWinnersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalWinnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
