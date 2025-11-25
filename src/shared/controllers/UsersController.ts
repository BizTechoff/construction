import { BackendMethod, Controller, ControllerBase, remult } from 'remult'
import { Roles } from '../../app/users/roles'
import { User } from '../../app/users/user'

export interface GetUsersRequest {
  filter?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface GetUsersResponse {
  users: User[]
  totalRecords: number
}

@Controller('user')
export class UsersController extends ControllerBase {

  @BackendMethod({ allowed: true })
  static async getUsers(request: GetUsersRequest): Promise<GetUsersResponse> {
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

    // Query users with filters and sorting
    const users = await remult.repo(User).find(queryOptions)

    // Get total count for pagination
    const totalRecords = await remult.repo(User).count(where)

    return {
      users,
      totalRecords
    }
  }

  @BackendMethod({ allowed: Roles.admin })
  static async deleteUser(userId: string): Promise<void> {
    await remult.repo(User).delete(userId)
  }

  @BackendMethod({ allowed: Roles.admin })
  static async resetUserPassword(userId: string): Promise<void> {
    const user = await remult.repo(User).findId(userId)
    if (user) {
      await user.resetPassword()
    }
  }

  @BackendMethod({ allowed: Roles.admin })
  static async createUser(userData: {
    name: string
    password: string
    admin: boolean
    manager: boolean
    disabled: boolean
  }): Promise<User> {
    const user = remult.repo(User).create()
    user.name = userData.name
    user.admin = userData.admin
    user.manager = userData.manager
    user.disabled = userData.disabled
    // Use the User entity method which properly hashes on backend
    await user.hashAndSetPassword(userData.password)
    await user.save()
    return user
  }

  @BackendMethod({ allowed: Roles.admin })
  static async updateUser(
    userId: string,
    userData: {
      name: string
      admin: boolean
      manager: boolean
      disabled: boolean
    }
  ): Promise<User> {
    const user = await remult.repo(User).findId(userId)
    if (!user) {
      throw new Error('משתמש לא נמצא')
    }
    user.name = userData.name
    user.admin = userData.admin
    user.manager = userData.manager
    user.disabled = userData.disabled
    await user.save()
    return user
  }

}
