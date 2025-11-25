import {
  Entity,
  Fields,
  IdEntity,
  Validators
} from 'remult'
import { terms } from '../terms'

@Entity<Customer>('customers', {
  allowApiCrud: true,
  defaultOrderBy: { name: 'asc' }
})
export class Customer extends IdEntity {

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: terms.customerName
  })
  name = ''

  @Fields.string({
    caption: terms.mobile
  })
  mobile = ''

  @Fields.string({
    caption: terms.email
  })
  email = ''

  @Fields.string({
    caption: terms.address
  })
  address = ''

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()
}
