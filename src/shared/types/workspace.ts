
export interface Workspace {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  deletedAt?: string | null;
}