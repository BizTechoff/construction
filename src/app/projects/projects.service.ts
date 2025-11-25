import { Injectable } from '@angular/core'
import { ProjectsController, GetProjectsRequest, GetProjectsResponse } from '../../shared/controllers/ProjectsController'
import { Project } from './project'
import { remult } from 'remult'

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  async getProjects(request: GetProjectsRequest): Promise<GetProjectsResponse> {
    return await ProjectsController.getProjects(request)
  }

  getProjectsLive(request: GetProjectsRequest) {
    const where: any = request.filter ? { name: { $contains: request.filter } } : {}

    const queryOptions: any = { where }

    if (request.sortField) {
      queryOptions.orderBy = { [request.sortField]: request.sortDirection || 'asc' }
    }

    if (request.page && request.pageSize) {
      queryOptions.page = request.page
      queryOptions.limit = request.pageSize
    }

    return remult.repo(Project).liveQuery(queryOptions)
  }

  async deleteProject(projectId: string): Promise<void> {
    return await ProjectsController.deleteProject(projectId)
  }
}
