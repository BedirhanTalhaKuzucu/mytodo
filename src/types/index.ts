export type SpaceType = "work" | "personal";

export type SpaceFilter = "all" | SpaceType;

export type NavView = "today" | "inbox" | "weekly" | "notes";

export type TaskStatus = "todo" | "done";

export type TaskPriority = "high" | "medium" | "low";

export type TaskRecurrence = "none" | "daily" | "weekly" | "monthly";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  space: SpaceType | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // ISO YYYY-MM-DD or null
  recurrence: TaskRecurrence;
  subtasks: Subtask[];
  linkedNoteIds: string[];
  tags: string[];
  pomodoroSessions?: number;
  pomodoroMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  space: SpaceType | null;
  isPinned: boolean;
  linkedTaskIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type SelectedItem =
  | { type: "task"; id: string }
  | { type: "note"; id: string }
  | null;

export type PomodoroMode = "focus" | "break";

export interface PomodoroState {
  isRunning: boolean;
  mode: PomodoroMode;
  secondsLeft: number;
  focusMinutes: number;
  breakMinutes: number;
  activeTaskId: string | null;
}
