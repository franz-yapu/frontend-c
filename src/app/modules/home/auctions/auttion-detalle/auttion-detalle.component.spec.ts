import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuttionDetalleComponent } from './auttion-detalle.component';

describe('AuttionDetalleComponent', () => {
  let component: AuttionDetalleComponent;
  let fixture: ComponentFixture<AuttionDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuttionDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuttionDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
