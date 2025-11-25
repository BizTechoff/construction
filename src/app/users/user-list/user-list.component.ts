import { Component, OnInit, NgZone } from '@angular/core'
import { remult, Repository } from 'remult'
import { UIToolsService } from '../../common/UIToolsService'
import { LiveQueryListComponent } from '../../common/liveQueryListComponent'
import { terms } from '../../terms'
import { Roles } from '../roles'
import { User } from '../user'
import { UsersService } from '../users.service'

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent extends LiveQueryListComponent<User> implements OnInit {
  users: User[] = []
  userEntity = User

  constructor(
    ngZone: NgZone,
    ui: UIToolsService,
    private usersService: UsersService
  ) {
    super(ngZone, ui)
  }

  isAdmin() {
    return remult.isAllowed(Roles.admin)
  }

  async ngOnInit() {
    await this.reload()
  }

  protected getRepository(): Repository<User> {
    return remult.repo(User)
  }

  protected override buildWhereClause(): any {
    return this.currentFilter ? { name: { $contains: this.currentFilter } } : {}
  }

  protected async loadData() {
    this.loading = true
    try {
      const response = await this.usersService.getUsers({
        filter: this.currentFilter,
        sortField: this.currentSort?.field,
        sortDirection: this.currentSort?.direction,
        page: this.currentPage,
        pageSize: this.pageSize
      })

      this.users = response.users
      this.totalRecords = response.totalRecords
    } catch (error) {
      this.ui.error(error?.toString())
    } finally {
      this.loading = false
    }
  }

  protected loadDataLive() {
    this.loading = true
    this.liveQueryUnsubscribe?.()

    const liveQuery = this.usersService.getUsersLive({
      filter: this.currentFilter,
      sortField: this.currentSort?.field,
      sortDirection: this.currentSort?.direction,
      page: this.currentPage,
      pageSize: this.pageSize
    })

    this.liveQueryUnsubscribe = liveQuery.subscribe((info) => {
      this.ngZone.run(() => {
        this.users = info.items
        this.loading = false
        this.loadTotalCount()
      })
    })
  }

  async addUser() {
    const changed = await this.ui.openUserDetailsModal()
    if (changed) {
      this.ui.info('המשתמש נוסף בהצלחה')
      if (!this.useLiveQuery) {
        await this.loadData()
      }
    }
  }

  async editUser(user: User) {
    const changed = await this.ui.openUserDetailsModal(user.id)
    if (changed) {
      this.ui.info('המשתמש עודכן בהצלחה')
      if (!this.useLiveQuery) {
        await this.loadData()
      }
    }
  }

  async deleteUser(user: User) {
    const confirmed = await this.ui.yesNoQuestion(
      `${terms.areYouSureYouWouldLikeToDelete} ${user.name}?`,
      true
    )

    if (confirmed) {
      try {
        await this.usersService.deleteUser(user.id)
        this.ui.info('המשתמש נמחק בהצלחה')
        await this.loadData()
      } catch (error) {
        this.ui.error(error)
      }
    }
  }

  async resetPassword(user: User) {
    const confirmed = await this.ui.yesNoQuestion(
      `${terms.passwordDeleteConfirmOf} ${user.name}?`,
      true
    )

    if (confirmed) {
      try {
        await this.usersService.resetUserPassword(user.id)
        this.ui.info(terms.passwordDeletedSuccessful)
      } catch (error) {
        this.ui.error(error)
      }
    }
  }
}
