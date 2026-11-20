import type { Contact, ContactStatus, ContactType } from '../types/domain';
import { services } from './repositories';

interface LegacyContactFields {
  type?: ContactType;
  status?: ContactStatus;
}

function normalizeContact(contact: Contact): Contact {
  const legacyContact = contact as Contact & LegacyContactFields;
  return {
    ...contact,
    type: legacyContact.type ?? 'customer',
    status: legacyContact.status ?? 'active',
  };
}

async function getAll(): Promise<Contact[]> {
  const storedContacts = await services.contacts.getAll();
  const normalizedContacts = storedContacts.map(normalizeContact);
  for (let index = 0; index < storedContacts.length; index += 1) {
    const storedContact = storedContacts[index] as Contact & LegacyContactFields;
    const normalizedContact = normalizedContacts[index];
    if (normalizedContact && (storedContact.type === undefined || storedContact.status === undefined)) {
      await services.contacts.update(normalizedContact.id, { type: normalizedContact.type, status: normalizedContact.status });
    }
  }
  return normalizedContacts.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export const contactService = {
  getAll,
  async getById(id: string): Promise<Contact | null> {
    const contact = await services.contacts.getById(id);
    return contact ? normalizeContact(contact) : null;
  },
  async create(values: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact> {
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `contact-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const contact: Contact = { ...values, id, createdAt: new Date().toISOString() };
    return services.contacts.create(normalizeContact(contact));
  },
  async update(id: string, changes: Partial<Omit<Contact, 'id'>>): Promise<Contact> {
    return normalizeContact(await services.contacts.update(id, changes));
  },
  delete(id: string): Promise<void> {
    return services.contacts.delete(id);
  },
};
