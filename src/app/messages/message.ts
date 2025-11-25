import {
  Entity,
  Fields,
  IdEntity
} from 'remult'
import { terms } from '../terms'

@Entity<Message>('messages', {
  allowApiCrud: true,
  defaultOrderBy: { createDate: 'desc' }
})
export class Message extends IdEntity {

  @Fields.string({
    caption: terms.messageText
  })
  text = ''

  @Fields.string({
    caption: terms.attachedFiles
  })
  attachedFiles = '' // JSON array of file paths

  @Fields.string({
    caption: terms.recipientIds
  })
  recipientIds = '' // JSON array of tenant IDs

  @Fields.string({
    caption: terms.sendStatus
  })
  sendStatus = '' // sent/failed/pending

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()

  @Fields.date({
    caption: terms.sentDate
  })
  sentDate?: Date
}
