import type {
  Note,
  SpaceType,
  Subtask,
  Task,
  TaskPriority,
  TaskRecurrence,
  TaskStatus,
} from "@/types";
import type { StorageAdapter } from "./adapter";
import { createSeedData } from "./seed";
import {
  getSupabaseUserId,
  getValidAccessToken,
} from "@/lib/supabase/auth";

interface DbTaskRow {
  id: string;
  title: string;
  notes: string;
  space: SpaceType | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  recurrence: TaskRecurrence;
  subtasks: Subtask[];
  linked_note_ids: string[];
  tags: string[];
  pomodoro_sessions: number;
  pomodoro_minutes: number;
  created_at: string;
  updated_at: string;
}

interface DbNoteRow {
  id: string;
  title: string;
  content: string;
  space: SpaceType | null;
  is_pinned: boolean;
  linked_task_ids: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

function getConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { url, key };
}

async function sbFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = getConfig();
  const token = await getValidAccessToken();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}) on ${path}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function mapDbTask(r: DbTaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes ?? "",
    space: r.space ?? null,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date ?? null,
    recurrence: r.recurrence ?? "none",
    subtasks: Array.isArray(r.subtasks) ? r.subtasks : [],
    linkedNoteIds: Array.isArray(r.linked_note_ids) ? r.linked_note_ids : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    pomodoroSessions: r.pomodoro_sessions ?? 0,
    pomodoroMinutes: r.pomodoro_minutes ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toDbTask(t: Task): DbTaskRow {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes ?? "",
    space: t.space ?? null,
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate ?? null,
    recurrence: t.recurrence ?? "none",
    subtasks: t.subtasks ?? [],
    linked_note_ids: t.linkedNoteIds ?? [],
    tags: t.tags ?? [],
    pomodoro_sessions: t.pomodoroSessions ?? 0,
    pomodoro_minutes: t.pomodoroMinutes ?? 0,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

function mapDbNote(r: DbNoteRow): Note {
  return {
    id: r.id,
    title: r.title,
    content: r.content ?? "",
    space: r.space ?? null,
    isPinned: Boolean(r.is_pinned),
    linkedTaskIds: Array.isArray(r.linked_task_ids) ? r.linked_task_ids : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toDbNote(n: Note): DbNoteRow {
  return {
    id: n.id,
    title: n.title,
    content: n.content ?? "",
    space: n.space ?? null,
    is_pinned: Boolean(n.isPinned),
    linked_task_ids: n.linkedTaskIds ?? [],
    tags: n.tags ?? [],
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  };
}

export class SupabaseStorageAdapter implements StorageAdapter {
  async getTasks(): Promise<Task[]> {
    const rows = await sbFetch<DbTaskRow[]>(
      "tasks?select=*&order=created_at.desc"
    );
    return rows.map(mapDbTask);
  }

  async saveTask(task: Task): Promise<Task> {
    const userId = getSupabaseUserId();
    await sbFetch("tasks?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([
        { ...toDbTask(task), ...(userId ? { user_id: userId } : {}) },
      ]),
    });
    return task;
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    const existing = await sbFetch<{ id: string }[]>("tasks?select=id");
    const nextIds = new Set(tasks.map((t) => t.id));
    const toDelete = existing.map((r) => r.id).filter((id) => !nextIds.has(id));
    const userId = getSupabaseUserId();

    if (tasks.length > 0) {
      await sbFetch("tasks?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(
          tasks.map((t) => ({
            ...toDbTask(t),
            ...(userId ? { user_id: userId } : {}),
          }))
        ),
      });
    }
    if (toDelete.length > 0) {
      const ids = toDelete.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(",");
      await sbFetch(`tasks?id=in.(${encodeURIComponent(ids)})`, {
        method: "DELETE",
      });
    }
  }

  async deleteTask(id: string): Promise<void> {
    await sbFetch(`tasks?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async getNotes(): Promise<Note[]> {
    const rows = await sbFetch<DbNoteRow[]>(
      "notes?select=*&order=updated_at.desc"
    );
    return rows.map(mapDbNote);
  }

  async saveNote(note: Note): Promise<Note> {
    const userId = getSupabaseUserId();
    await sbFetch("notes?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([
        { ...toDbNote(note), ...(userId ? { user_id: userId } : {}) },
      ]),
    });
    return note;
  }

  async saveNotes(notes: Note[]): Promise<void> {
    const existing = await sbFetch<{ id: string }[]>("notes?select=id");
    const nextIds = new Set(notes.map((n) => n.id));
    const toDelete = existing.map((r) => r.id).filter((id) => !nextIds.has(id));
    const userId = getSupabaseUserId();

    if (notes.length > 0) {
      await sbFetch("notes?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(
          notes.map((n) => ({
            ...toDbNote(n),
            ...(userId ? { user_id: userId } : {}),
          }))
        ),
      });
    }
    if (toDelete.length > 0) {
      const ids = toDelete.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(",");
      await sbFetch(`notes?id=in.(${encodeURIComponent(ids)})`, {
        method: "DELETE",
      });
    }
  }

  async deleteNote(id: string): Promise<void> {
    await sbFetch(`notes?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async seedIfEmpty(): Promise<{ tasks: Task[]; notes: Note[] }> {
    const [existingTasks, existingNotes] = await Promise.all([
      this.getTasks(),
      this.getNotes(),
    ]);
    if (existingTasks.length > 0 || existingNotes.length > 0) {
      return { tasks: existingTasks, notes: existingNotes };
    }

    const seed = createSeedData();
    await Promise.all([this.saveTasks(seed.tasks), this.saveNotes(seed.notes)]);
    return seed;
  }
}
