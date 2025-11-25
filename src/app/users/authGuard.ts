import { Injectable } from "@angular/core"
import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router"
import { Remult, Allowed } from "remult"
import { RouteHelperService } from "../common/routeHelperService"
import { Roles } from "./roles"

export declare type AngularComponent = { new (...args: any[]): any }

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(
    protected remult: Remult,
    private router: Router,
    private helper: RouteHelperService
  ) {}
  isAllowed(): Allowed {
    return true
  }
  static componentToNavigateIfNotAllowed: AngularComponent

  canActivate(route: ActivatedRouteSnapshot) {
    if (
      this.remult.authenticated() &&
      this.remult.isAllowed(this.isAllowed())
    ) {
      return true
    }

    if (!(route instanceof dummyRoute)) {
      let x = AuthenticatedGuard.componentToNavigateIfNotAllowed
      if (x != undefined) {
        this.helper.navigateToComponent(x)
      } else this.router.navigate(['/'])
    }
    return false
  }
}

@Injectable()
export class NotAuthenticatedGuard implements CanActivate {
  constructor(private remult: Remult, private router: Router) {}
  canActivate(route: ActivatedRouteSnapshot) {
    if (this.remult.authenticated()) return false
    return true
  }
}

export class dummyRoute extends ActivatedRouteSnapshot {
  constructor() {
    super()
  }
  override routeConfig: any
}


@Injectable()
export class AdminGuard extends AuthenticatedGuard {
  constructor(remult: Remult, router: Router, helper: RouteHelperService) {
    super(remult, router, helper)
  }

  override isAllowed() {
    return Roles.admin
  }
}

@Injectable()
export class ManagerGuard extends AuthenticatedGuard {
  constructor(remult: Remult, router: Router, helper: RouteHelperService) {
    super(remult, router, helper)
  }

  override isAllowed() {
    return Roles.manager
  }
}
