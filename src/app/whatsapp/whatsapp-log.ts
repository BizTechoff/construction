import {
  Entity,
  Fields,
  IdEntity
} from 'remult'
import { terms } from '../terms'
import { WhatsAppLogType } from './whatsapp-log.type'

@Entity<WhatsAppLog>('whatsappLogs', {
  allowApiCrud: true,
  defaultOrderBy: { createDate: 'desc' }
})
export class WhatsAppLog extends IdEntity {

  @Fields.string({
    caption: terms.whatsappPhone
  })
  phone = ''

  @Fields.string({
    caption: terms.whatsappCustomerId
  })
  customerId = ''

  @Fields.object<WhatsAppLog, WhatsAppLogType>({
    caption: terms.whatsappLogType
  })
  logType = WhatsAppLogType.message_received

  @Fields.string({
    caption: terms.whatsappLogDetails
  })
  details = ''

  @Fields.string({
    caption: terms.whatsappRelatedMessageId
  })
  relatedMessageId = ''

  @Fields.string({
    caption: terms.whatsappRelatedServiceCallId
  })
  relatedServiceCallId = ''

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()
}
