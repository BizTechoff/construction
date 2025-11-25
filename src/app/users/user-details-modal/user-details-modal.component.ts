import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { remult } from 'remult'
import { UsersController } from '../../../shared/controllers/UsersController'
import { terms } from '../../terms'
import { Roles } from '../roles'
import { User } from '../user'

@Component({
  selector: 'app-user-details-modal',
  templateUrl: './user-details-modal.component.html',
  styleUrl: './user-details-modal.component.scss'
})
export class UserDetailsModalComponent implements OnInit {
  args = { userId: '' }
  user = remult.repo(User).create()
  isNew = true
  password = ''
  confirmPassword = ''
  terms = terms
  changed = false

  constructor(private dialogRef: MatDialogRef<UserDetailsModalComponent>) { }
  Roles = Roles

  async ngOnInit() {
    if (!this.args) {
      this.args = { userId: '' }
    }
    if (this.args.userId) {
      const u = await remult.repo(User).findId(this.args.userId, { useCache: false })
      if (!u) {
        throw new Error(`userId '${this.args.userId}' NOT-FOUND`, { cause: 'NOT-FOUND' })
      }
      this.user = u
      this.isNew = false
    }
  }

  isAdmin() {
    return remult.isAllowed(Roles.admin)
  }

  onRoleChecked(role = Roles.admin) {
    if (role === Roles.admin && this.user.admin) {
      this.user.manager = false
    }
    else if (role === Roles.manager && this.user.manager) {
      this.user.admin = false
    }
    // console.log('clicked', this.user.admin, this.user.manager)
  }

  async save() {
    try {
      if (this.isNew) {
        // Validate passwords for new users
        if (!this.password) {
          throw new Error('סיסמה נדרשת')
        }
        if (this.password !== this.confirmPassword) {
          throw new Error('הסיסמאות אינן תואמות')
        }

        // Create new user via controller (server-side password hashing)
        await UsersController.createUser({
          name: this.user.name,
          password: this.password,
          admin: this.user.admin,
          manager: this.user.manager,
          disabled: this.user.disabled
        })
      } else {
        // Update existing user via controller
        await UsersController.updateUser(this.user.id, {
          name: this.user.name,
          admin: this.user.admin,
          manager: this.user.manager,
          disabled: this.user.disabled
        })
      }

      this.changed = true
      this.close()
    } catch (error: any) {
      throw error
    }
  }

  close() {
    this.dialogRef.close(this.changed)
  }

  cancel() {
    this.dialogRef.close(false)
  }
}
