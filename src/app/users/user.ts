import {
  BackendMethod,
  Entity,
  Fields,
  IdEntity,
  Validators,
  isBackend
} from 'remult'
import { terms } from '../terms'
import { Roles } from './roles'

@Entity<User>('users', {
  allowApiCrud: true,
  // allowApiRead: Allow.authenticated,
  // allowApiUpdate: Allow.authenticated,
  // allowApiDelete: false,
  // allowApiInsert: Roles.admin,
  // apiPrefilter: () =>
  //   !remult.isAllowed(Roles.admin) ? { id: [remult.user?.id!] } : {},
  defaultOrderBy: { admin: 'desc', manager: 'desc', name: 'asc', createDate: 'asc' },
  saving: async (user) => {
    if (isBackend()) {
      if (user._.isNew()) {
        user.createDate = new Date()
      }
    }
  },
})
export class User extends IdEntity {

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled), Validators.uniqueOnBackend(terms.uniqueFiled)],
    caption: terms.username
  })
  name = ''

  @Fields.string({ includeInApi: false })
  password = ''

  @Fields.boolean({
    allowApiUpdate: Roles.admin,
    caption: terms.admin
  })
  admin = false

  @Fields.boolean({
    allowApiUpdate: Roles.admin,
    caption: terms.manager
  })
  manager = false

  @Fields.boolean({
    allowApiUpdate: Roles.admin,
    caption: terms.disabled
  })
  disabled = false

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate,
  })
  createDate = new Date()

  @BackendMethod({ allowed: true })
  async hashAndSetPassword(password: string) {
    this.password = (await import('password-hash')).generate(password)
  }

  @BackendMethod({ allowed: true })
  async passwordMatches(password: string) {
    return (
      !this.password ||
      (await import('password-hash')).verify(password, this.password)
    )
  }

  @BackendMethod({ allowed: Roles.admin })
  async resetPassword() {
    this.password = ''
    await this.save()
  }
}
