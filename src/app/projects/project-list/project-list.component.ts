import { Component, OnInit, OnDestroy, NgZone } from '@angular/core'
import { Router } from '@angular/router'
import { remult } from 'remult'
import { SortEvent, PageEvent } from '../../common/components/base-table/table.interfaces'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'
import { Project } from '../project'
import { ProjectsService } from '../projects.service'
import { BusyService } from '../../common/components/wait/busyService'

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit, OnDestroy {
  projects: Project[] = []
  loading = false
  totalRecords = 0
  currentPage = 1
  pageSize = 30
  projectEntity = Project

  currentFilter = ''
  currentSort: SortEvent | null = null

  useLiveQuery = false
  private liveQueryUnsubscribe?: VoidFunction

  constructor(
    private ui: UIToolsService,
    private busyService: BusyService,
    private projectsService: ProjectsService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadProjects()
  }

  ngOnDestroy() {
    this.liveQueryUnsubscribe?.()
  }

  async loadProjects() {
    this.loading = true
    try {
      const response = await this.projectsService.getProjects({
        filter: this.currentFilter,
        sortField: this.currentSort?.field,
        sortDirection: this.currentSort?.direction,
        page: this.currentPage,
        pageSize: this.pageSize
      })

      this.projects = response.projects
      this.totalRecords = response.totalRecords
    } catch (error) {
      this.ui.error(error?.toString())
    } finally {
      this.loading = false
    }
  }

  async onSort(event: SortEvent) {
    this.currentSort = event
    this.currentPage = 1
    await this.loadProjects()
  }

  async onFilter(searchText: string) {
    this.currentFilter = searchText
    this.currentPage = 1
    await this.loadProjects()
  }

  async onPageChange(event: PageEvent) {
    this.currentPage = event.page
    this.pageSize = event.pageSize
    await this.loadProjects()
  }

  async onRefresh() {
    await this.loadProjects()
  }

  async addProject() {
    const changed = await this.ui.openProjectDetails()
    if (changed) {
      this.ui.info('הפרויקט נוסף בהצלחה')
      await this.loadProjects()
    }
  }

  async editProject(project: Project) {
    const changed = await this.ui.openProjectDetails(project.id)
    if (changed) {
      this.ui.info('הפרויקט עודכן בהצלחה')
      await this.loadProjects()
    }
  }

  async deleteProject(project: Project) {
    const confirmed = await this.ui.yesNoQuestion(
      `${terms.areYouSureYouWouldLikeToDelete} ${project.name}?`,
      true
    )

    if (confirmed) {
      try {
        await this.projectsService.deleteProject(project.id)
        this.ui.info('הפרויקט נמחק בהצלחה')
        await this.loadProjects()
      } catch (error) {
        this.ui.error(error)
      }
    }
  }

  openBuildings(project: Project) {
    // Navigate to buildings page with project filter
    this.router.navigate(['/buildings'], {
      queryParams: { projectId: project.id, projectName: project.name }
    })
  }
}
