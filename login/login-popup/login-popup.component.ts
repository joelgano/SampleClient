import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { MatSnackBar, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl, Validators } from '@angular/forms';
import { samevalueValidator } from 'src/app/shared/validators/samevalue-validator.directive';

import { UserService } from '../../shared/services/user.service';
import { CountryCodeHelper } from '../../shared/helpers/countryCode.helper';

import { UserRequest } from '../../shared/requests/user-request.model';
import { CountryCode } from '../../shared/model/countryCode.model';
import { LoginPopupDialogData } from 'src/app/shared/model/loginPopupDialogData.model';

@Component({
	selector: 'app-login-popup',
	templateUrl: './login-popup.component.html',
	styleUrls: ['./login-popup.component.scss'],
})
export class LoginPopupComponent implements OnInit, OnDestroy {
	public ConfirmPasswordFormControl = new FormControl('', []);
	public EmailFormControl = new FormControl('', [Validators.required, Validators.email]);
	public PasswordFormControl = new FormControl('', [Validators.required, Validators.minLength(8)]);
	public PhoneFormControl = new FormControl('', [Validators.required, Validators.minLength(5)]);

	public countryCode: CountryCode;

	get validFormControls(): boolean {
		return this.PasswordFormControl.valid && this.ConfirmPasswordFormControl.valid && this.PhoneFormControl.valid && this.EmailFormControl.valid;
	}

	private subscriptions: Array<Subscription> = new Array<Subscription>();
	private userRequest: UserRequest;

	constructor(
		public countryCodeHelper: CountryCodeHelper,
		public dialogRef: MatDialogRef<LoginPopupComponent>,
		private snackBar: MatSnackBar,
		private userService: UserService,
		@Inject(MAT_DIALOG_DATA) public data: LoginPopupDialogData
	) {
		this.dialogRef.disableClose = true;
	}

	ngOnInit() {
		this.countryCodeHelper.GetCountryCode();
		this.countryCode = this.countryCodeHelper.CountryCodeList.find(cc => cc.name === 'United Kingdom');
		this.EmailFormControl.setValue(this.data.email);
		this.AttachedValidationToConfirmPassword();
	}

	ngOnDestroy() {
		for (const subscription of this.subscriptions) {
			subscription.unsubscribe();
		}
	}

	public async Save(userId: string) {
		if (this.validateFormControl()) {
			this.userRequest = new UserRequest('', '', '', '');

			this.userRequest.id = userId;
			this.userRequest.password = this.PasswordFormControl.value;
			this.userRequest.preferredEmail = this.EmailFormControl.value;
			this.userRequest.preferredPhone = this.countryCode.code + ' ' + this.PhoneFormControl.value;

			const user = await this.userService.UpdateUser(this.userRequest);
			if (user !== null || user !== undefined) {
				this.dialogRef.close('Save');
			}
		}
	}

	private AttachedValidationToConfirmPassword() {
		this.subscriptions.push(
			this.PasswordFormControl.valueChanges.subscribe(newPassword => {
				this.ConfirmPasswordFormControl.setValidators([Validators.required, samevalueValidator(newPassword)]);
				this.ConfirmPasswordFormControl.updateValueAndValidity();
			})
		);
	}

	private validateFormControl(): boolean {
		if (!this.validFormControls) {
			const snackBarRef = this.snackBar.open('Change password details invalid', 'Dismiss');
			snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
			return false;
		}
		return true;
	}
}
