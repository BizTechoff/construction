import { BackendMethod, Controller, ControllerBase, remult } from 'remult'
import { Project } from '../../app/projects/project'

export interface GetProjectsRequest {
  filter?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface GetProjectsResponse {
  projects: Project[]
  totalRecords: number
}

@Controller('projects')
export class ProjectsController extends ControllerBase {

  @BackendMethod({ allowed: true })
  static async getProjects(request: GetProjectsRequest): Promise<GetProjectsResponse> {
    const {
      filter = '',
      sortField,
      sortDirection = 'asc',
      page = 1,
      pageSize = 30
    } = request

    // Build where clause for filter
    const where = filter
      ? { name: { $contains: filter } }
      : {}

    // Build query options
    const queryOptions: any = {
      where,
      page,
      limit: pageSize,
    }

    // Only add orderBy if sortField is provided, otherwise use Entity's defaultOrderBy
    if (sortField) {
      queryOptions.orderBy = { [sortField]: sortDirection }
    }

    // Query projects
    const projects = await remult.repo(Project).find(queryOptions)

    // Get total count for pagination
    const totalRecords = await remult.repo(Project).count(where)

    return {
      projects,
      totalRecords
    }
  }

  @BackendMethod({ allowed: true })
  static async deleteProject(projectId: string): Promise<void> {
    await remult.repo(Project).delete(projectId)
  }

  @BackendMethod({ allowed: true })
  static async createProject(projectData: {
    name: string
    description: string
    location: string
  }): Promise<Project> {
    const project = remult.repo(Project).create()
    project.name = projectData.name
    project.description = projectData.description
    project.location = projectData.location
    await project.save()
    return project
  }

  @BackendMethod({ allowed: true })
  static async updateProject(
    projectId: string,
    projectData: {
      name: string
      description: string
      location: string
    }
  ): Promise<Project> {
    const project = await remult.repo(Project).findId(projectId)
    if (!project) {
      throw new Error('פרויקט לא נמצא')
    }
    project.name = projectData.name
    project.description = projectData.description
    project.location = projectData.location
    await project.save()
    return project
  }
}
