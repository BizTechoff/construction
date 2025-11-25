// import { CommonUIElementsModule } from 'common-ui-elements'
import { ErrorHandler, NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'

import { ShowDialogOnErrorErrorHandler } from './common/showDialogOnErrorErrorHandler'
import { ProjectListComponent } from './projects/project-list/project-list.component'
import { CustomerListComponent } from './customers/customer-list/customer-list.component'
import { ServiceCallListComponent } from './service-calls/service-call-list/service-call-list.component'
import { WhatsAppDashboardComponent } from './whatsapp/whatsapp-dashboard/whatsapp-dashboard.component'
import { terms } from './terms'
import { AdminGuard, AuthenticatedGuard, NotAuthenticatedGuard } from './users/authGuard'
import { SilentRedirectComponent } from './users/silent-redirect.component'
import { UserListComponent } from './users/user-list/user-list.component'

const defaultRoute = 'home'
const routes: Routes = [
  { path: defaultRoute, component: HomeComponent, canActivate: [NotAuthenticatedGuard], data: { name: terms.home } },
  // { path: 'projects', component: ProjectListComponent, canActivate: [AuthenticatedGuard], data: { name: terms.projects } },
  { path: 'service-calls', component: ServiceCallListComponent, canActivate: [AuthenticatedGuard], data: { name: terms.serviceCalls } },
  { path: 'customers', component: CustomerListComponent, canActivate: [AuthenticatedGuard], data: { name: terms.customers } },
  { path: 'whatsapp', component: WhatsAppDashboardComponent, canActivate: [AuthenticatedGuard], data: { name: terms.whatsapp } },
  { path: 'accounts', component: UserListComponent, canActivate: [AdminGuard], data: { name: terms.userAccounts } },
  { path: '', component: SilentRedirectComponent, pathMatch: 'full' },
  { path: '**', component: SilentRedirectComponent }
]
@NgModule({
  imports: [RouterModule.forRoot(routes)],//, CommonUIElementsModule],
  providers: [
    AdminGuard,
    { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler },
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
