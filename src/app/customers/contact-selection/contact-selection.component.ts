import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { Contact } from '../contact'
import { CustomersService } from '../customers.service'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'
import { DialogConfig } from '../../common/dialogConfig'
import { remult } from 'remult'

@DialogConfig({
  maxHeight: '85vh',
  maxWidth: '800px',
  panelClass: 'contact-selection-dialog'
})
@Component({
  selector: 'app-contact-selection',
  templateUrl: './contact-selection.component.html',
  styleUrl: './contact-selection.component.scss'
})
export class ContactSelectionComponent implements OnInit {
  args = {
    customerId: '',
    selectedIds: [] as string[],
    multiSelect: false,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true
  }
  contacts: Contact[] = []
  filteredContacts: Contact[] = []
  selectedContacts: Set<string> = new Set()
  searchText = ''
  terms = terms
  loading = false

  // Inline edit
  editingContact: Contact | null = null
  editForm = { name: '', mobile: '', isDefault: false }

  // Inline add
  isAdding = false
  addForm = { name: '', mobile: '', isDefault: false }

  constructor(
    private dialogRef: MatDialogRef<ContactSelectionComponent>,
    private customersService: CustomersService,
    private ui: UIToolsService
  ) {}

  async ngOnInit() {
    if (!this.args) this.args = {
      customerId: '',
      selectedIds: [],
      multiSelect: false,
      allowAdd: true,
      allowEdit: true,
      allowDelete: true
    }

    this.selectedContacts = new Set(this.args.selectedIds)
    await this.loadContacts()
  }

  async loadContacts() {
    if (!this.args.customerId) return

    this.loading = true
    try {
      const response = await this.customersService.getContacts({
        customerId: this.args.customerId,
        filter: ''
      })

      this.contacts = response.contacts.sort((a, b) => {
        // Default first
        if (a.isDefault && !b.isDefault) return -1
        if (!a.isDefault && b.isDefault) return 1

        const aSelected = this.selectedContacts.has(a.id)
        const bSelected = this.selectedContacts.has(b.id)

        if (aSelected && !bSelected) return -1
        if (!aSelected && bSelected) return 1

        return (a.name || '').localeCompare(b.name || '', 'he')
      })
      this.applyFilter()
    } finally {
      this.loading = false
    }
  }

  applyFilter() {
    if (!this.searchText.trim()) {
      this.filteredContacts = this.contacts
    } else {
      const search = this.searchText.toLowerCase()
      this.filteredContacts = this.contacts.filter(c =>
        c.name?.toLowerCase().includes(search) ||
        c.mobile?.toLowerCase().includes(search)
      )
    }
  }

  onSearchChange() {
    this.applyFilter()
  }

  toggleSelection(contact: Contact) {
    if (this.args.multiSelect) {
      if (this.selectedContacts.has(contact.id)) {
        this.selectedContacts.delete(contact.id)
      } else {
        this.selectedContacts.add(contact.id)
      }
    } else {
      this.selectedContacts.clear()
      this.selectedContacts.add(contact.id)
    }
  }

  isSelected(contact: Contact): boolean {
    return this.selectedContacts.has(contact.id)
  }

  confirm() {
    const selected = this.contacts.filter(c => this.selectedContacts.has(c.id))

    if (this.args.multiSelect) {
      this.dialogRef.close(selected)
    } else {
      this.dialogRef.close(selected[0] || null)
    }
  }

  cancel() {
    this.dialogRef.close(null)
  }

  // Inline Add
  startAdd() {
    this.isAdding = true
    this.addForm = { name: '', mobile: '', isDefault: this.contacts.length === 0 }
    this.editingContact = null
  }

  cancelAdd() {
    this.isAdding = false
    this.addForm = { name: '', mobile: '', isDefault: false }
  }

  async saveAdd() {
    if (!this.addForm.name.trim()) return

    try {
      await this.customersService.createContact({
        customerId: this.args.customerId,
        name: this.addForm.name,
        mobile: this.addForm.mobile,
        isDefault: this.addForm.isDefault
      })
      this.isAdding = false
      this.addForm = { name: '', mobile: '', isDefault: false }
      await this.loadContacts()
    } catch (error) {
      this.ui.error(error)
    }
  }

  // Inline Edit
  startEdit(contact: Contact, event: Event) {
    event.stopPropagation()
    this.editingContact = contact
    this.editForm = {
      name: contact.name,
      mobile: contact.mobile,
      isDefault: contact.isDefault
    }
    this.isAdding = false
  }

  cancelEdit() {
    this.editingContact = null
    this.editForm = { name: '', mobile: '', isDefault: false }
  }

  async saveEdit() {
    if (!this.editingContact || !this.editForm.name.trim()) return

    try {
      await this.customersService.updateContact(this.editingContact.id, {
        name: this.editForm.name,
        mobile: this.editForm.mobile,
        isDefault: this.editForm.isDefault
      })
      this.editingContact = null
      this.editForm = { name: '', mobile: '', isDefault: false }
      await this.loadContacts()
    } catch (error) {
      this.ui.error(error)
    }
  }

  async deleteContact(contact: Contact, event: Event) {
    event.stopPropagation()
    const confirmed = await this.ui.yesNoQuestion(
      `${terms.areYouSureYouWouldLikeToDelete} ${contact.name}?`,
      true
    )
    if (confirmed) {
      await this.customersService.deleteContact(contact.id)
      this.selectedContacts.delete(contact.id)
      await this.loadContacts()
    }
  }

  isEditing(contact: Contact): boolean {
    return this.editingContact?.id === contact.id
  }
}
