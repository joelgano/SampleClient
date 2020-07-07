import { TestBed, inject } from '@angular/core/testing';

import { HomeworkListComponent } from './homework-list.component';

describe('a homework-list component', () => {
	let component: HomeworkListComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				HomeworkListComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([HomeworkListComponent], (HomeworkListComponent) => {
		component = HomeworkListComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});