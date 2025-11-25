import { Injectable, Injector } from "@angular/core"
import { Route, CanActivate, Router } from "@angular/router"
import { dummyRoute } from "../users/authGuard"

@Injectable()
export class RouteHelperService {
  constructor(private router: Router, private injector: Injector) {}

  navigateToComponent(toComponent: { new (...args: any[]): any }) {
    let done = false
    this.router.config.forEach((path) => {
      if (done) return
      if (path.component == toComponent) {
        done = true
        this.router.navigate(['/' + path.path])
      }
    })
    if (!done)
      console.warn("couldn't find path for ", toComponent, this.router.config)
  }
  canNavigateToRoute(route: Route) {
    if (!route.canActivate) return true
    for (let guard of route.canActivate) {
      try {
        let g = this.injector.get(guard) as CanActivate
        if (g && g.canActivate) {
          var r = new dummyRoute()
          r.routeConfig = route
          let canActivate = g.canActivate(r, undefined!)
          if (!canActivate) return false
        }
      } catch (e) {
        // Ignore circular dependency during initial load
        console.warn('Could not check guard', guard, e)
        return true
      }
    }
    return true
  }
}