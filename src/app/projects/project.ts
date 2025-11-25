import {
  Entity,
  Fields,
  IdEntity,
  Validators
} from 'remult'
import { terms } from '../terms'

@Entity<Project>('projects', {
  allowApiCrud: true,
  defaultOrderBy: { name: 'asc' }
})
export class Project extends IdEntity {

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: terms.projectName
  })
  name = ''

  @Fields.string({
    caption: terms.projectDescription
  })
  description = ''

  @Fields.string({
    caption: terms.projectLocation
  })
  location = ''

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()
}
