import { Injectable } from '@angular/core'
import { remult, LiveQuery } from 'remult'
import { User } from './user'
import { UsersController, GetUsersRequest, GetUsersResponse } from '../../shared/controllers/UsersController'

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  // Regular query - קריאה חד פעמית דרך Controller
  async getUsers(request: GetUsersRequest): Promise<GetUsersResponse> {
    return await UsersController.getUsers(request)
  }

  // LiveQuery - עדכונים בזמן אמת (לא דרך Controller!)
  getUsersLive(request: GetUsersRequest): LiveQuery<User> {
    const {
      filter = '',
      sortField = 'name',
      sortDirection = 'asc',
      page = 1,
      pageSize = 30
    } = request

    // Build where clause
    const where = filter ? { name: { $contains: filter } } : {}

    // LiveQuery - מתעדכן אוטומטית כשיש שינויים ב-DB
    return remult.repo(User).liveQuery({
      where,
      orderBy: { [sortField]: sortDirection },
      page,
      limit: pageSize
    })
  }

  async deleteUser(userId: string): Promise<void> {
    return await UsersController.deleteUser(userId)
  }

  async resetUserPassword(userId: string): Promise<void> {
    return await UsersController.resetUserPassword(userId)
  }
  
}
