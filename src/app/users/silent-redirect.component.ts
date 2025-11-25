// silent-redirect.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { remult } from 'remult';
import { terms } from '../terms';

@Component({
  template: '' // אין צורך בתצוגה
})
export class SilentRedirectComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    // בדוק אם המשתמש מחובר
    if (remult.user) {
      console.log('routeTo 1: ', this.router.url)

      if (!this.router.url || this.router.url === '/' || this.router.url === terms.home) {// משתמש מחובר - הפנה לרשימת תורמים
        this.router.navigate([`/tenants`]);
      }
      else if (this.router.url) {
        // if (this.i18n.currentLanguage === 'he') {
        //   if (this.router.url.endsWith('Donations%20List')) {
        //     this.router.navigate([`/${this.router.url.replace('Donations%20List', 'רשימת תרומות')}`]);
        //   }
        // }
        // else {
        //   this.router.navigate([`/${this.i18n.currentTerms.donationsList}`]);
        // }
      }
    } else {
      console.log('routeTo 2: HOME')
      // משתמש לא מחובר - הפנה לדף הבית
      this.router.navigate([`/${'home'}`]);
    }
  }
}

