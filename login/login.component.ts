import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatSnackBar, MatDialog } from '@angular/material';

import { AuthorizationService } from '../shared/services/authorization.service';
import { UserService } from '../shared/services/user.service';

import { AppComponent } from '../app.component';
import { LoginPopupComponent } from '../login/login-popup/login-popup.component';
import { LoginPopupDialogData } from '../shared/model/loginPopupDialogData.model';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
	public LoggingIn = false;

	public UsernameFormControl = new FormControl('', [Validators.required]);
	public PasswordFormControl = new FormControl('', [Validators.required, Validators.minLength(8)]);
	public Message = '';

	constructor(
		private router: Router,
		private authorizationService: AuthorizationService,
		private userService: UserService,
		private snackBar: MatSnackBar,
		private appComponent: AppComponent,
		private dialog: MatDialog
	) {
		this.authorizationService.Logout();
	}

	public async Login() {
		if (this.UsernameFormControl.invalid || this.PasswordFormControl.invalid) {
			const snackBarRef = this.snackBar.open('Login details invalid', 'Dismiss');
			snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
			return;
		}

		this.LoggingIn = true;
		await this.authorizationService.Login(this.UsernameFormControl.value, this.PasswordFormControl.value);

		if (!this.authorizationService.IsLoggedIn()) {
			const snackBarRef = this.snackBar.open('Login details invalid', 'Dismiss');
			snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
		} else {
			await this.userService.GetUserSession(this.UsernameFormControl.value);

			if (this.authorizationService.token.firstLogin === true) {
				const loginPopupDialogRef = this.dialog.open(LoginPopupComponent, {
					width: '75vh',
					data: new LoginPopupDialogData(
						this.userService.UserSession.userId,
						'Change Password',
						this.userService.UserSession.username,
						'Change your password and provide your preferred email and phone number.'
					),
				});

				loginPopupDialogRef.afterClosed().subscribe(result => {
					if (result === 'Save') {
						this.Navigate();
					}
				});
			} else {
				this.Navigate();
			}
		}
		this.LoggingIn = false;
	}

	private Navigate() {
		if (!this.userService.HasActiveSchool() && this.userService.ReturnUserSession().userSchools.length > 1) {
			this.appComponent.GetMenuLinks();
			this.router.navigate(['/schoolSelection']);
		} else if (this.userService.ReturnUserSession().userSchools.length === 0) {
			this.authorizationService.Logout();
			const snackBarRef = this.snackBar.open('No school found for the user', 'Dismiss');
			snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
		} else {
			this.appComponent.GetMenuLinks();
			this.router.navigate(['/timetable']);
		}
	}
}
