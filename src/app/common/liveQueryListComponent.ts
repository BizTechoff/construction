import { OnDestroy, NgZone, Directive } from '@angular/core'
import { remult, EntityBase, Repository } from 'remult'
import { UIToolsService } from './UIToolsService'
import { SortEvent, PageEvent } from './components/base-table/table.interfaces'

/**
 * Base class for list components that support both Regular Query and LiveQuery modes.
 *
 * Usage:
 * 1. Extend this class in your list component
 * 2. Implement the abstract methods: loadData(), loadDataLive(), getRepository()
 * 3. Call super() in constructor with NgZone and UIToolsService
 * 4. Add toggle button in template: (click)="toggleQueryMode()"
 *
 * @example
 * ```typescript
 * export class UserListComponent extends LiveQueryListComponent<User> {
 *   constructor(ngZone: NgZone, ui: UIToolsService) {
 *     super(ngZone, ui)
 *   }
 *
 *   getRepository() { return remult.repo(User) }
 *   async loadData() { ... }
 *   loadDataLive() { ... }
 * }
 * ```
 */
@Directive() // Required for Angular to recognize lifecycle hooks in base class
export abstract class LiveQueryListComponent<T extends EntityBase> implements OnDestroy {
  // Data
  data: T[] = []
  loading = false
  totalRecords = 0

  // Pagination
  currentPage = 1
  pageSize = 30

  // Filters & Sorting
  currentFilter = ''
  currentSort: SortEvent | null = null

  // LiveQuery
  useLiveQuery = false
  protected liveQueryUnsubscribe?: VoidFunction

  constructor(
    protected ngZone: NgZone,
    protected ui: UIToolsService
  ) {}

  /**
   * Get the repository for counting records (used by LiveQuery mode)
   */
  protected abstract getRepository(): Repository<T>

  /**
   * Load data using regular query (via Controller)
   */
  protected abstract loadData(): Promise<void>

  /**
   * Load data using LiveQuery (real-time updates)
   */
  protected abstract loadDataLive(): void

  /**
   * Build the where clause for counting (override if needed)
   */
  protected buildWhereClause(): any {
    return {}
  }

  ngOnDestroy() {
    this.liveQueryUnsubscribe?.()
  }

  /**
   * Toggle between Regular Query and LiveQuery modes
   */
  toggleQueryMode() {
    this.useLiveQuery = !this.useLiveQuery

    if (this.useLiveQuery) {
      this.ui.info('מצב LiveQuery הופעל - עדכונים בזמן אמת')
      this.loadDataLive()
    } else {
      this.ui.info('מצב Regular Query הופעל - קריאות ידניות')
      this.liveQueryUnsubscribe?.()
      this.loadData()
    }
  }

  /**
   * Helper method to load total count (for LiveQuery mode)
   */
  protected async loadTotalCount() {
    try {
      const where = this.buildWhereClause()
      this.totalRecords = await this.getRepository().count(where)
    } catch (error) {
      console.error('Failed to load total count:', error)
    }
  }

  /**
   * Reload data based on current mode
   */
  async reload() {
    if (this.useLiveQuery) {
      this.loadDataLive()
    } else {
      await this.loadData()
    }
  }

  /**
   * Handle sort event
   */
  async onSort(event: SortEvent) {
    this.currentSort = event
    this.currentPage = 1
    await this.reload()
  }

  /**
   * Handle filter event
   */
  async onFilter(searchText: string) {
    this.currentFilter = searchText
    this.currentPage = 1
    await this.reload()
  }

  /**
   * Handle page change event
   */
  async onPageChange(event: PageEvent) {
    this.currentPage = event.page
    this.pageSize = event.pageSize
    await this.reload()
  }

  /**
   * Handle refresh event
   */
  async onRefresh() {
    await this.reload()
  }

  /**
   * Get the mode button label
   */
  get modeLabel(): string {
    return this.useLiveQuery ? '🔴 Live Mode' : '⚪ Regular Mode'
  }
}
