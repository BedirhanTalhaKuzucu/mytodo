import type { Note, Task } from "@/types";
import type { StorageAdapter } from "./adapter";
import { createSeedData } from "./seed";

const TASKS_KEY = "denge_tasks_v1";
const NOTES_KEY = "denge_notes_v1";
const SEEDED_KEY = "denge_seeded_v1";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`LocalStorage write error for ${key}:`, err);
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  async getTasks(): Promise<Task[]> {
    return safeRead<Task[]>(TASKS_KEY, []);
  }

  async saveTask(task: Task): Promise<Task> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.unshift(task);
    }
    safeWrite(TASKS_KEY, tasks);
    return task;
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    safeWrite(TASKS_KEY, tasks);
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    safeWrite(
      TASKS_KEY,
      tasks.filter((t) => t.id !== id)
    );
  }

  async getNotes(): Promise<Note[]> {
    return safeRead<Note[]>(NOTES_KEY, []);
  }

  async saveNote(note: Note): Promise<Note> {
    const notes = await this.getNotes();
    const index = notes.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.unshift(note);
    }
    safeWrite(NOTES_KEY, notes);
    return note;
  }

  async saveNotes(notes: Note[]): Promise<void> {
    safeWrite(NOTES_KEY, notes);
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getNotes();
    safeWrite(
      NOTES_KEY,
      notes.filter((n) => n.id !== id)
    );
  }

  async seedIfEmpty(): Promise<{ tasks: Task[]; notes: Note[] }> {
    if (typeof window === "undefined") {
      return { tasks: [], notes: [] };
    }

    try {
      const alreadySeeded = window.localStorage.getItem(SEEDED_KEY);
      if (alreadySeeded) {
        const [tasks, notes] = await Promise.all([
          this.getTasks(),
          this.getNotes(),
        ]);
        return { tasks, notes };
      }

      const seed = createSeedData();
      safeWrite(TASKS_KEY, seed.tasks);
      safeWrite(NOTES_KEY, seed.notes);
      window.localStorage.setItem(SEEDED_KEY, "true");
      return seed;
    } catch {
      return { tasks: [], notes: [] };
    }
  }
}
