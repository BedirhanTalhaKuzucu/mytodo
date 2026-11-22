import type { Note, Task } from "@/types";

/**
 * Repository Pattern interface for all CRUD operations.
 * Currently backed by LocalStorageAdapter; can be swapped to a
 * SupabaseStorageAdapter in a single place without touching UI code.
 */
export interface StorageAdapter {
  getTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<Task>;
  saveTasks(tasks: Task[]): Promise<void>;
  deleteTask(id: string): Promise<void>;

  getNotes(): Promise<Note[]>;
  saveNote(note: Note): Promise<Note>;
  saveNotes(notes: Note[]): Promise<void>;
  deleteNote(id: string): Promise<void>;

  seedIfEmpty(): Promise<{ tasks: Task[]; notes: Note[] }>;
}
