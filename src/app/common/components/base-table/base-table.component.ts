import { Component, ContentChildren, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, TemplateRef } from '@angular/core'
import { remult } from 'remult'
import { TableColumnDirective } from './table-column.directive'
import { PageEvent, SortEvent, TableColumn } from './table.interfaces'

@Component({
  selector: 'app-base-table',
  templateUrl: './base-table.component.html',
  styleUrls: ['./base-table.component.scss']
})
export class BaseTableComponent implements OnInit, OnChanges {
  // Data inputs
  @Input() data: any[] | null = []
  @Input() columns?: TableColumn[]
  @Input() entityType?: any  // Remult Entity class for metadata
  @Input() loading = false
  @Input() totalRecords = 0
  @Input() currentPage = 1
  @Input() pageSize = 30

  // Feature toggles
  @Input() sortable = true
  @Input() selectable = false
  @Input() showPagination = true
  @Input() showFilter = true
  @Input() readonly = false
  @Input() showActions = true
  @Input() showAdd = true  // Show Add button
  @Input() hiddenColumns: string[] = []
  @Input() emptyMessage = 'אין נתונים להצגה'
  @Input() addButtonText = 'הוסף'  // Add button text
  @Input() showCustomAction = false  // Show custom action button
  @Input() customActionIcon = 'apartment'  // Custom action icon
  @Input() customActionTitle = ''  // Custom action tooltip

  // Events
  @Output() onSort = new EventEmitter<SortEvent>()
  @Output() onFilter = new EventEmitter<string>()
  @Output() onPageChange = new EventEmitter<PageEvent>()
  @Output() onRefresh = new EventEmitter<void>()
  @Output() onRowClick = new EventEmitter<any>()
  @Output() onSelectionChange = new EventEmitter<any[]>()
  @Output() onEdit = new EventEmitter<any>()
  @Output() onDelete = new EventEmitter<any>()
  @Output() onAdd = new EventEmitter<void>()  // Add event
  @Output() onCustomAction = new EventEmitter<any>()  // Custom action event
  @Output() onColumnsChange = new EventEmitter<string[]>()

  // Custom column templates
  @ContentChildren(TableColumnDirective) columnTemplates!: QueryList<TableColumnDirective>

  // Internal state
  visibleColumns: TableColumn[] = []
  allColumns: TableColumn[] = []
  currentSort: SortEvent | null = null
  filterText = ''
  selectedRows: Set<any> = new Set()
  selectAll = false

  // Pagination
  totalPages = 0
  displayedPages: number[] = []
  Math = Math  // Expose Math to template

  ngOnInit() {
    this.initializeColumns()
    this.calculatePagination()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['columns'] || changes['hiddenColumns']) {
      this.initializeColumns()
    }
    if (changes['totalRecords'] || changes['pageSize']) {
      this.calculatePagination()
    }
  }

  private initializeColumns() {
    const dataArray = Array.isArray(this.data) ? this.data : (this.data || [])

    if (this.columns) {
      // Use provided columns
      this.allColumns = [...this.columns]
    } else if (this.entityType) {
      // Use entity metadata to get fields in order
      try {
        const repo = remult.repo(this.entityType)
        const fields = repo.metadata.fields as any
        this.allColumns = Object.keys(fields)
          .filter(key => {
            // Filter out methods and internal properties
            const field = fields[key]
            return field && typeof field !== 'function' && field.caption !== undefined
          })
          .map(key => ({
            field: key,
            header: fields[key].caption || key,
            sortable: true
          }))
      } catch (e) {
        console.warn('Could not get entity metadata, falling back to data keys', e)
        if (dataArray.length > 0) {
          const firstRow = dataArray[0]
          this.allColumns = Object.keys(firstRow).map(key => ({
            field: key,
            header: this.getFieldCaption(key, firstRow),
            sortable: true
          }))
        }
      }
    } else if (dataArray.length > 0) {
      // Auto-detect columns from data
      const firstRow = dataArray[0]
      this.allColumns = Object.keys(firstRow).map(key => ({
        field: key,
        header: this.getFieldCaption(key, firstRow),
        sortable: true
      }))
    }

    // Filter out hidden columns with validation
    const validHiddenColumns = this.hiddenColumns.filter(col =>
      this.allColumns.some(c => c.field === col)
    )

    // Warn about invalid hidden columns
    if (this.hiddenColumns.length !== validHiddenColumns.length) {
      const invalid = this.hiddenColumns.filter(col =>
        !this.allColumns.some(c => c.field === col)
      )
      console.warn('Some hidden columns do not exist:', invalid)
    }

    // Set visible columns
    this.visibleColumns = this.allColumns.filter(col =>
      !col.hidden && !validHiddenColumns.includes(col.field)
    )
  }

  private getFieldCaption(field: string, row: any): string {
    try {
      // Option 1: Try to get from entityType input
      if (this.entityType) {
        const repo = remult.repo(this.entityType)
        const fields = repo.metadata.fields as any
        const fieldMetadata = fields[field]
        if (fieldMetadata?.caption) {
          console.log('Found caption from entityType:', field, fieldMetadata.caption)
          return fieldMetadata.caption
        }
      }

      // Option 2: Try to get field metadata from entity reference on row
      const entityRef = (row as any)._
      if (entityRef?.fields) {
        const fieldRef = entityRef.fields[field]
        if (fieldRef?.caption) {
          console.log('Found caption from row._:', field, fieldRef.caption)
          return fieldRef.caption
        }
      }
    } catch (e) {
      console.log('Error getting caption for field:', field, e)
    }

    // Fallback: capitalize first letter
    return field.charAt(0).toUpperCase() + field.slice(1)
  }

  // Sorting
  sortColumn(column: TableColumn) {
    if (!this.sortable || column.sortable === false) return

    const direction: 'asc' | 'desc' =
      this.currentSort?.field === column.field && this.currentSort.direction === 'asc'
        ? 'desc'
        : 'asc'

    this.currentSort = { field: column.field, direction }
    this.onSort.emit(this.currentSort)
  }

  getSortIcon(column: TableColumn): string {
    if (!this.currentSort || this.currentSort.field !== column.field) {
      return ''
    }
    return this.currentSort.direction === 'asc' ? '▲' : '▼'
  }

  // Filtering
  onFilterChange(event: Event) {
    const input = event.target as HTMLInputElement
    this.filterText = input.value
    this.onFilter.emit(this.filterText)
  }

  clearFilter() {
    this.filterText = ''
    this.onFilter.emit('')
  }

  // Pagination
  private calculatePagination() {
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize)
    this.updateDisplayedPages()
  }

  private updateDisplayedPages() {
    const maxPages = 5
    const pages: number[] = []

    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2))
    let end = Math.min(this.totalPages, start + maxPages - 1)

    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    this.displayedPages = pages
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return
    this.onPageChange.emit({ page, pageSize: this.pageSize })
  }

  nextPage() {
    this.goToPage(this.currentPage + 1)
  }

  previousPage() {
    this.goToPage(this.currentPage - 1)
  }

  // Selection
  toggleSelectAll() {
    const dataArray = Array.isArray(this.data) ? this.data : []

    if (this.selectAll) {
      dataArray.forEach(row => this.selectedRows.add(row))
    } else {
      this.selectedRows.clear()
    }

    this.onSelectionChange.emit(Array.from(this.selectedRows))
  }

  toggleRowSelection(row: any) {
    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row)
    } else {
      this.selectedRows.add(row)
    }

    const dataArray = Array.isArray(this.data) ? this.data : []
    this.selectAll = dataArray.length > 0 && this.selectedRows.size === dataArray.length

    this.onSelectionChange.emit(Array.from(this.selectedRows))
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows.has(row)
  }

  // Row actions
  handleRowClick(row: any) {
    this.onRowClick.emit(row)
  }

  handleEdit(row: any, event: Event) {
    event.stopPropagation()
    this.onEdit.emit(row)
  }

  handleDelete(row: any, event: Event) {
    event.stopPropagation()
    this.onDelete.emit(row)
  }

  handleCustomAction(row: any, event: Event) {
    event.stopPropagation()
    this.onCustomAction.emit(row)
  }

  // Custom template
  getColumnTemplate(field: string): TemplateRef<any> | null {
    const columnDir = this.columnTemplates?.find(t => t.field === field)
    return columnDir?.template || null
  }

  // Refresh
  refresh() {
    this.onRefresh.emit()
  }

  // Helper to get cell value
  getCellValue(row: any, column: TableColumn): any {
    // Try to use Remult's field metadata
    try {
      const entityRef = (row as any)._
      if (entityRef?.fields) {
        const fieldRef = entityRef.fields[column.field]
        if (fieldRef) {
          // Check if there's a displayValue function
          if (fieldRef.metadata?.options?.displayValue) {
            const rawValue = fieldRef.getValue()
            const displayValue = fieldRef.metadata.options.displayValue(row, rawValue)
            console.log(`Field ${column.field}:`, {
              hasDisplayValue: true,
              rawValue: rawValue,
              displayValue: displayValue
            })
            return displayValue
          }

          // Otherwise just use getValue()
          const value = fieldRef.getValue()
          console.log(`Field ${column.field}:`, {
            hasDisplayValue: false,
            getValue: value
          })
          return value
        }
      }
    } catch (e) {
      console.log(`Error getting value for ${column.field}:`, e)
    }

    // Fallback to raw value
    const value = row[column.field]

    // If it's a relation object (has an id), try to display a meaningful value
    if (value && typeof value === 'object' && value.id) {
      // Try common name fields
      return value.name || value.title || value.id
    }

    return value
  }

  // Track by for performance
  trackByField(index: number, item: any): any {
    return item.id || index
  }
}
