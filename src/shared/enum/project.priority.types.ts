import { ValueListFieldType } from "remult"

@ValueListFieldType({ caption: 'סוג עדיפות' })
export class ProjectPriorityType {

    static low = new ProjectPriorityType()
    static normal = new ProjectPriorityType()
    static high = new ProjectPriorityType()

    constructor(public caption = '') { }
    id = ''
}
