export interface Role {
  id: string;
  name: string;
  isRD: boolean;
  children?: Role[];
  parentId?: string;
}

export interface ApprovalState {
  timestamp: string;
  ip: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  type: 'roles' | 'activities' | 'qra';
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  type: 'roles' | 'activities' | 'qra';
  data: any; // This will be typed based on the template type
  createdAt: string;
} 