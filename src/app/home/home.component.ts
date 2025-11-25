import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { remult } from 'remult'
import { UIToolsService } from '../common/UIToolsService'
import { terms } from '../terms'
import { SignInController } from '../users/SignInController'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  signer = new SignInController()

  constructor(private router: Router, private ui: UIToolsService) { }

  ngOnInit() { }

  async signIn() {
    try {
      remult.user = await this.signer.signIn()
      if (remult.user) {
        this.router.navigate([`/${'tenants'}`]);
      }
    }
    catch (error: any) { this.ui.yesNoQuestion(error?.message + '') }
  }

}
