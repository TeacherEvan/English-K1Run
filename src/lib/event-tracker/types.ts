export type GameEventType =
  | "error"
  | "warning"
  | "info"
  | "performance"
  | "user_action"
  | "lifecycle"
  | "test"
  | "language_change";

export interface GameEvent {
  id: string;
  timestamp: number;
  type: GameEventType;
  category: string;
  message: string;
  data?: Record<string, unknown>;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}
