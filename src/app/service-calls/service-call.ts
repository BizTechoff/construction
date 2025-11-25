import {
  Entity,
  Fields,
  IdEntity,
  Validators
} from 'remult'
import { terms } from '../terms'
import { ServiceCallStatus } from './service-call.status'

@Entity<ServiceCall>('serviceCalls', {
  allowApiCrud: true,
  defaultOrderBy: { createDate: 'desc' }
})
export class ServiceCall extends IdEntity {
  
  @Fields.autoIncrement({ caption: 'מס.קריאה', allowApiUpdate: false, dbReadOnly: true })
  callNumber = 0;

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: terms.customerId
  })
  customerId = ''

  @Fields.string({
    caption: terms.address
  })
  address = ''

  @Fields.string({
    caption: terms.site
  })
  site = ''

  @Fields.string({
    caption: terms.description
  })
  description = ''

  @Fields.string({
    caption: terms.contactName
  })
  contactName = ''

  @Fields.string({
    caption: terms.contactMobile
  })
  contactMobile = ''

  @Fields.object<ServiceCall, ServiceCallStatus>({
    caption: terms.status
  })
  status = ServiceCallStatus.open

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()
}
