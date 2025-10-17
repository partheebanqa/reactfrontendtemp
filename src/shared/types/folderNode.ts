import type { ExtendedRequest } from '@/models/collection.model';

export interface FolderNode {
  id: string;
  name: string;
  type?: 'folder' | 'request';
  folders?: FolderNode[];
  requests?: ExtendedRequest[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestNode {
  id: string;
  name: string;
  method: string;
  url?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollectionFolderTree {
  id: string;
  name: string;
  folders: FolderNode[];
  requests: ExtendedRequest[];
}
