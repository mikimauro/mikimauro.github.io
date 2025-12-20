export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  mobile?: string;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  address?: string;
  vatNumber?: string;
  fiscalCode?: string;
  whatsapp?: string;
  category?: string;
  notes?: string;
  avatarUrl?: string;
  createdAt: number;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface ScannedDocument {
  id: string;
  title: string;
  content: string;
  pages: string[]; // URLs delle immagini originali
  createdAt: number;
  isArchived?: boolean;
}

export enum AppView {
  LIST = 'LIST',
  SCAN = 'SCAN',
  EDIT = 'EDIT',
  DETAILS = 'DETAILS',
  DOC_LIST = 'DOC_LIST',
  DOC_EDIT = 'DOC_EDIT'
}

export type NewContactDraft = Omit<Contact, 'id' | 'createdAt'>;
export type DocumentDraft = Omit<ScannedDocument, 'id' | 'createdAt'>;