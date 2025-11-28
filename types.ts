export enum UserRole {
  ADMIN = 'ADMIN',
  PARTICIPANT = 'PARTICIPANT',
}

export enum MaterialType {
  TEXT = 'TEXT',
  HTML = 'HTML',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  // PDF/EPUB would typically require specialized rendering libraries not included in this scaffold
  // We will treat them as simulated text content for this demo.
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Material {
  id: string;
  title: string;
  author: string;
  type: MaterialType;
  content: string; // URL for media, text content for text/html
  coverUrl: string;
  assignedToUserIds: string[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  materialId?: string;
}

export interface ReadingSession {
  userId: string;
  materialId: string;
  startTime: number;
  lastPosition: number; // percentage 0-100 or scrolltop
  durationSeconds: number;
}

export interface FormTemplate {
  id: string;
  title: string;
  type: 'CONSENT' | 'QUESTIONNAIRE';
  content: string; // Body text for consent, description for questionnaire
  questions?: string[]; // List of questions if type is QUESTIONNAIRE
  createdAt: number;
}