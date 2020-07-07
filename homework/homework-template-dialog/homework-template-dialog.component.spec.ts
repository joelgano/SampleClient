import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeworkTemplateDialogComponent } from './homework-template-dialog.component';

describe('HomeworkTemplateDialogComponent', () => {
  let component: HomeworkTemplateDialogComponent;
  let fixture: ComponentFixture<HomeworkTemplateDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeworkTemplateDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeworkTemplateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
