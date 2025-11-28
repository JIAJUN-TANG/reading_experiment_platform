import { LogEntry, User } from '../types';

// In a real app, this would push to a backend API/WebSocket
class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  log(user: User, action: string, details?: string, materialId?: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      userId: user.id,
      userName: user.name,
      action,
      details,
      materialId
    };
    
    this.logs.unshift(entry); // Newest first
    this.notifyListeners();
    console.log(`[Logger] ${user.name}: ${action}`, details);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.logs));
  }
}

export const logger = new LoggerService();