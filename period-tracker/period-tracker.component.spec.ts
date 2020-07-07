import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodTrackerComponent } from './period-tracker.component';

describe('PeriodTrackerComponent', () => {
  let component: PeriodTrackerComponent;
  let fixture: ComponentFixture<PeriodTrackerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PeriodTrackerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeriodTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
