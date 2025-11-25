import {
  Entity,
  Fields,
  IdEntity,
  Validators
} from 'remult'
import { terms } from '../terms'

@Entity<Contact>('contacts', {
  allowApiCrud: true,
  defaultOrderBy: { name: 'asc' }
})
export class Contact extends IdEntity {

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: terms.customerId
  })
  customerId = ''

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: terms.contactName
  })
  name = ''

  @Fields.string({
    caption: terms.mobile
  })
  mobile = ''

  @Fields.boolean({
    caption: terms.isDefaultContact
  })
  isDefault = false

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()
}
