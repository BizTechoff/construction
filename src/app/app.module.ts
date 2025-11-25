import { APP_INITIALIZER, ErrorHandler, LOCALE_ID, NgModule } from '@angular/core'
import { registerLocaleData } from '@angular/common'
import localeHe from '@angular/common/locales/he'
import { FormsModule } from '@angular/forms'

// Register Hebrew locale
registerLocaleData(localeHe)
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatToolbarModule } from '@angular/material/toolbar'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
// import { CommonUIElementsModule } from 'common-ui-elements'
import { HomeComponent } from './home/home.component'
import { BaseInputFieldComponent } from './common/components/base-input-field/base-input-field.component'
import { YesNoQuestionComponent } from './common/components/yes-no-question/yes-no-question.component'
import { BaseTableComponent } from './common/components/base-table/base-table.component'
import { TableColumnDirective } from './common/components/base-table/table-column.directive'
// import { DataAreaDialogComponent } from './common/data-area-dialog/data-area-dialog.component'
import { remult } from 'remult'
// import { TextAreaDataControlComponent } from './common/textarea-data-control/textarea-data-control.component'
import { UIToolsService } from './common/UIToolsService'
import { AdminGuard, AuthenticatedGuard, NotAuthenticatedGuard } from './users/authGuard'
import { Remult } from 'remult'
import { RouteHelperService } from './common/routeHelperService'
import { ShowDialogOnErrorErrorHandler } from './common/showDialogOnErrorErrorHandler'
import { setMatDialog } from './common/openDialog'
import { MatDialog } from '@angular/material/dialog'
import { SignInController } from './users/SignInController'
import { UserDetailsModalComponent } from './users/user-details-modal/user-details-modal.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { ProjectListComponent } from './projects/project-list/project-list.component';
import { ProjectDetailsComponent } from './projects/project-details/project-details.component';
import { BusyService } from './common/components/wait/busyService';
import { ProjectSelectionFieldComponent } from './projects/project-selection-field/project-selection-field.component';
import { ProjectSelectionComponent } from './projects/project-selection/project-selection.component';

@NgModule({
  declarations: [
    AppComponent,
    UserListComponent,
    HomeComponent,
    BaseInputFieldComponent,
    YesNoQuestionComponent,
    BaseTableComponent,
    TableColumnDirective,
    UserDetailsModalComponent,
    UserListComponent,
    ProjectListComponent,
    ProjectDetailsComponent,
    ProjectSelectionFieldComponent,
    ProjectSelectionComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    // CommonUIElementsModule,
  ],
  providers: [
    UIToolsService,
    BusyService,
    NotAuthenticatedGuard,
    AuthenticatedGuard,
    AdminGuard,
    RouteHelperService,
    { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler },
    { provide: APP_INITIALIZER, useFactory: initApp, multi: true },
    { provide: APP_INITIALIZER, useFactory: initMatDialog, deps: [MatDialog], multi: true },
    { provide: LOCALE_ID, useValue: 'he' },
    { provide: Remult, useValue: remult }
  ],  
  bootstrap: [AppComponent],
})
export class AppModule {}

export function initMatDialog(dialog: MatDialog) {
  return () => {
    setMatDialog(dialog)
  }
}

export function initApp() {
  const loadCurrentUserBeforeAppStarts = async () => {
    await remult.initUser()
  }
  return loadCurrentUserBeforeAppStarts
}
