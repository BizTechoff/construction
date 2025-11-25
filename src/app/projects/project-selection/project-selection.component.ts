import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { Project } from '../project'
import { ProjectsService } from '../projects.service'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'
import { DialogConfig } from '../../common/dialogConfig'

@DialogConfig({
  maxHeight: '85vh',
  maxWidth: '800px',
  panelClass: 'project-selection-dialog'
})
@Component({
  selector: 'app-project-selection',
  templateUrl: './project-selection.component.html',
  styleUrl: './project-selection.component.scss'
})
export class ProjectSelectionComponent implements OnInit {
  args = {
    selectedIds: [] as string[],
    multiSelect: false,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true
  }
  projects: Project[] = []
  filteredProjects: Project[] = []
  selectedProjects: Set<string> = new Set()
  searchText = ''
  terms = terms
  loading = false
  projectEntity = Project

  constructor(
    private dialogRef: MatDialogRef<ProjectSelectionComponent>,
    private projectsService: ProjectsService,
    private ui: UIToolsService
  ) {}

  async ngOnInit() {
    if (!this.args) this.args = {
      selectedIds: [],
      multiSelect: false,
      allowAdd: true,
      allowEdit: true,
      allowDelete: true
    }

    this.selectedProjects = new Set(this.args.selectedIds)
    await this.loadProjects()
  }

  async loadProjects() {
    this.loading = true
    try {
      const response = await this.projectsService.getProjects({
        filter: '',
        page: 1,
        pageSize: 1000 // Load all projects for selection
      })

      // Sort: selected items first, then by name
      this.projects = response.projects.sort((a, b) => {
        const aSelected = this.selectedProjects.has(a.id)
        const bSelected = this.selectedProjects.has(b.id)

        if (aSelected && !bSelected) return -1
        if (!aSelected && bSelected) return 1

        // Both selected or both not selected - sort by name
        return (a.name || '').localeCompare(b.name || '', 'he')
      })
      this.applyFilter()
    } finally {
      this.loading = false
    }
  }

  applyFilter() {
    if (!this.searchText.trim()) {
      this.filteredProjects = this.projects
    } else {
      const search = this.searchText.toLowerCase()
      this.filteredProjects = this.projects.filter(p =>
        p.name?.toLowerCase().includes(search) ||
        p.location?.toLowerCase().includes(search)
      )
    }
  }

  onSearchChange() {
    this.applyFilter()
  }

  toggleSelection(project: Project) {
    if (this.args.multiSelect) {
      if (this.selectedProjects.has(project.id)) {
        this.selectedProjects.delete(project.id)
      } else {
        this.selectedProjects.add(project.id)
      }
    } else {
      this.selectedProjects.clear()
      this.selectedProjects.add(project.id)
    }
  }

  isSelected(project: Project): boolean {
    return this.selectedProjects.has(project.id)
  }

  confirm() {
    const selected = this.projects.filter(p => this.selectedProjects.has(p.id))

    if (this.args.multiSelect) {
      this.dialogRef.close(selected)
    } else {
      this.dialogRef.close(selected[0] || null)
    }
  }

  cancel() {
    this.dialogRef.close(null)
  }

  async addNew() {
    const changed = await this.ui.openProjectDetails()
    if (changed) {
      await this.loadProjects()
    }
  }

  async editProject(project: Project, event: Event) {
    event.stopPropagation()
    const changed = await this.ui.openProjectDetails(project.id)
    if (changed) {
      await this.loadProjects()
    }
  }

  async deleteProject(project: Project, event: Event) {
    event.stopPropagation()
    const confirmed = await this.ui.yesNoQuestion(
      `${terms.areYouSureYouWouldLikeToDelete} ${project.name}?`,
      true
    )
    if (confirmed) {
      await this.projectsService.deleteProject(project.id)
      this.selectedProjects.delete(project.id)
      await this.loadProjects()
    }
  }
}
