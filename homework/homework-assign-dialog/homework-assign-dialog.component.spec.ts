import { TestBed, inject } from '@angular/core/testing';

import { HomeworkAssignDialogComponent } from './homework-assign-dialog.component';

describe('a homework-assign-dialog component', () => {
	let component: HomeworkAssignDialogComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				HomeworkAssignDialogComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([HomeworkAssignDialogComponent], (HomeworkAssignDialogComponent) => {
		component = HomeworkAssignDialogComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});