import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { remult } from 'remult'
import { ProjectsController } from '../../../shared/controllers/ProjectsController'
import { terms } from '../../terms'
import { Project } from '../project'

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit {
  args = { projectId: '' }
  project = remult.repo(Project).create()
  isNew = true
  terms = terms
  changed = false

  constructor(private dialogRef: MatDialogRef<ProjectDetailsComponent>) { }

  async ngOnInit() {
    if (!this.args) {
      this.args = { projectId: '' }
    }
    if (this.args.projectId) {
      const p = await remult.repo(Project).findId(this.args.projectId, { useCache: false })
      if (!p) {
        throw new Error(`projectId '${this.args.projectId}' NOT-FOUND`, { cause: 'NOT-FOUND' })
      }
      this.project = p
      this.isNew = false
    }
  }

  async save() {
    try {
      if (this.isNew) {
        await ProjectsController.createProject({
          name: this.project.name,
          description: this.project.description,
          location: this.project.location
        })
      } else {
        await ProjectsController.updateProject(this.project.id, {
          name: this.project.name,
          description: this.project.description,
          location: this.project.location
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
