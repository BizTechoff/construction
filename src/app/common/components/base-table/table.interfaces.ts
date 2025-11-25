export interface TableColumn {
  field: string                    // שם השדה (חובה)
  header?: string                  // כותרת (אופציונלי - אוטומטי מ-Remult)
  width?: string                   // רוחב ('200px' | '20%' | 'auto')
  sortable?: boolean               // ניתן למיון (ברירת מחדל true)
  hidden?: boolean                 // מוסתר (ברירת מחדל false)
  cssClass?: string                // CSS class לתא
  headerClass?: string             // CSS class לכותרת
  style?: any                      // inline styles לתא
  headerStyle?: any                // inline styles לכותרת
}

export interface SortEvent {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterEvent {
  searchText: string
}

export interface PageEvent {
  page: number
  pageSize: number
}
