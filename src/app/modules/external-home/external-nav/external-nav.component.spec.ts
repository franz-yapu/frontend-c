import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalNavComponent } from './external-nav.component';

describe('ExternalNavComponent', () => {
  let component: ExternalNavComponent;
  let fixture: ComponentFixture<ExternalNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalNavComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
