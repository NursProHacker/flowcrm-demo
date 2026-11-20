export type ContactSource =
  | 'website'
  | 'referral'
  | 'advertising'
  | 'social_media'
  | 'cold_call'
  | 'other';

export type ContactType = 'lead' | 'customer' | 'partner';
export type ContactStatus = 'active' | 'inactive';

export type DealSource = ContactSource;

export type DealStage =
  | 'new'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type DealPriority = 'low' | 'medium' | 'high';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type EmployeeRole = 'owner' | 'admin' | 'manager' | 'sales' | 'support';
export type ActivityEntityType = 'contact' | 'deal' | 'task' | 'calendar_event';
export type ActivityType = 'created' | 'updated' | 'completed' | 'commented' | 'status_changed';

export interface Contact {
  id: string;
  fullName: string;
  type: ContactType;
  status: ContactStatus;
  phone: string;
  email: string;
  company: string;
  source: ContactSource;
  assignedEmployeeId: string;
  notes: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  amount: number;
  currency: string;
  stageId: DealStage;
  priority: DealPriority;
  expectedCloseDate: string | null;
  assignedEmployeeId: string;
  source: DealSource;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedEmployeeId: string;
  relatedDealId: string | null;
  relatedContactId: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  relatedContactId: string | null;
  relatedDealId: string | null;
  type?: 'meeting' | 'call' | 'consultation' | 'reminder' | 'other';
  assignedEmployeeId?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: EmployeeRole;
  avatarUrl: string | null;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  entityId: string;
  entityType: ActivityEntityType;
  createdAt: string;
  employeeId: string;
}

export interface Organization {
  id: string;
  name: string;
  businessType: string;
  currency: string;
}

export interface EntityByType {
  contacts: Contact;
  deals: Deal;
  tasks: Task;
  calendarEvents: CalendarEvent;
  employees: Employee;
  activities: Activity;
  organizations: Organization;
}

export type EntityCollection = keyof EntityByType;
