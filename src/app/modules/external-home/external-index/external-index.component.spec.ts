import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalIndexComponent } from './external-index.component';

describe('ExternalIndexComponent', () => {
  let component: ExternalIndexComponent;
  let fixture: ComponentFixture<ExternalIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalIndexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
