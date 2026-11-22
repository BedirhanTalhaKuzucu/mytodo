"use client";

import { useCallback, useEffect, useState } from "react";
import { storageAdapter } from "@/lib/storage";
import { computeNextRecurrenceDate, generateId } from "@/lib/utils";
import type {
  Note,
  SpaceType,
  Task,
  TaskPriority,
  TaskRecurrence,
} from "@/types";

export interface CreateTaskInput {
  title: string;
  notes?: string;
  space?: SpaceType | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  recurrence?: TaskRecurrence;
  tags?: string[];
  linkedNoteIds?: string[];
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  space?: SpaceType | null;
  isPinned?: boolean;
  tags?: string[];
  linkedTaskIds?: string[];
}

export function useAppData() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    storageAdapter
      .seedIfEmpty()
      .then((data) => {
        if (!mounted) return;
        setTasks(data.tasks);
        setNotes(data.notes);
      })
      .catch((err) => {
        console.error("Veri yükleme hatası:", err);
      })
      .finally(() => {
        if (mounted) setIsLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const createTask = useCallback((input: CreateTaskInput): Task => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateId(),
      title: input.title.trim() || "Başlıksız Görev",
      notes: input.notes ?? "",
      space: input.space !== undefined ? input.space : null,
      status: "todo",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate !== undefined ? input.dueDate : null,
      recurrence: input.recurrence ?? "none",
      subtasks: [],
      linkedNoteIds: input.linkedNoteIds ?? [],
      tags: input.tags ?? [],
      pomodoroSessions: 0,
      pomodoroMinutes: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic UI update (0ms)
    setTasks((prev) => [newTask, ...prev]);
    void storageAdapter.saveTask(newTask);

    // Sync bidirectional link if created with linkedNoteIds
    if (newTask.linkedNoteIds.length > 0) {
      setNotes((prev) => {
        const updated = prev.map((n) =>
          newTask.linkedNoteIds.includes(n.id) &&
          !n.linkedTaskIds.includes(newTask.id)
            ? {
                ...n,
                linkedTaskIds: [...n.linkedTaskIds, newTask.id],
                updatedAt: now,
              }
            : n
        );
        void storageAdapter.saveNotes(updated);
        return updated;
      });
    }

    return newTask;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    const now = new Date().toISOString();
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: now } : t
      );
      const target = updated.find((t) => t.id === id);
      if (target) {
        void storageAdapter.saveTask(target);
      }
      return updated;
    });
  }, []);

  const toggleTaskStatus = useCallback((id: string) => {
    const now = new Date().toISOString();
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;

      const nextStatus = target.status === "todo" ? "done" : "todo";
      const updatedTarget: Task = {
        ...target,
        status: nextStatus,
        updatedAt: now,
      };

      let nextList = prev.map((t) => (t.id === id ? updatedTarget : t));

      // If completing a recurring task, automatically spawn next occurrence
      if (nextStatus === "done" && target.recurrence !== "none") {
        const nextDue = computeNextRecurrenceDate(
          target.dueDate,
          target.recurrence
        );
        const nextOccurrence: Task = {
          ...target,
          id: generateId(),
          status: "todo",
          dueDate: nextDue,
          subtasks: target.subtasks.map((s) => ({ ...s, done: false })),
          createdAt: now,
          updatedAt: now,
        };
        nextList = [nextOccurrence, ...nextList];
        void storageAdapter.saveTasks(nextList);
      } else {
        void storageAdapter.saveTask(updatedTarget);
      }

      return nextList;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    const now = new Date().toISOString();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    void storageAdapter.deleteTask(id);

    // Clean up references in notes
    setNotes((prev) => {
      let changed = false;
      const updated = prev.map((n) => {
        if (n.linkedTaskIds.includes(id)) {
          changed = true;
          return {
            ...n,
            linkedTaskIds: n.linkedTaskIds.filter((tid) => tid !== id),
            updatedAt: now,
          };
        }
        return n;
      });
      if (changed) void storageAdapter.saveNotes(updated);
      return updated;
    });
  }, []);

  const createNote = useCallback((input: CreateNoteInput): Note => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: generateId(),
      title: input.title.trim() || "Başlıksız Not",
      content: input.content ?? "",
      space: input.space !== undefined ? input.space : null,
      isPinned: input.isPinned ?? false,
      linkedTaskIds: input.linkedTaskIds ?? [],
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    setNotes((prev) => [newNote, ...prev]);
    void storageAdapter.saveNote(newNote);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    const now = new Date().toISOString();
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: now } : n
      );
      const target = updated.find((n) => n.id === id);
      if (target) {
        void storageAdapter.saveNote(target);
      }
      return updated;
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    const now = new Date().toISOString();
    setNotes((prev) => prev.filter((n) => n.id !== id));
    void storageAdapter.deleteNote(id);

    // Clean up references in tasks
    setTasks((prev) => {
      let changed = false;
      const updated = prev.map((t) => {
        if (t.linkedNoteIds.includes(id)) {
          changed = true;
          return {
            ...t,
            linkedNoteIds: t.linkedNoteIds.filter((nid) => nid !== id),
            updatedAt: now,
          };
        }
        return t;
      });
      if (changed) void storageAdapter.saveTasks(updated);
      return updated;
    });
  }, []);

  const linkTaskAndNote = useCallback((taskId: string, noteId: string) => {
    const now = new Date().toISOString();
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId && !t.linkedNoteIds.includes(noteId)
          ? {
              ...t,
              linkedNoteIds: [...t.linkedNoteIds, noteId],
              updatedAt: now,
            }
          : t
      );
      const target = updated.find((t) => t.id === taskId);
      if (target) void storageAdapter.saveTask(target);
      return updated;
    });

    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === noteId && !n.linkedTaskIds.includes(taskId)
          ? {
              ...n,
              linkedTaskIds: [...n.linkedTaskIds, taskId],
              updatedAt: now,
            }
          : n
      );
      const target = updated.find((n) => n.id === noteId);
      if (target) void storageAdapter.saveNote(target);
      return updated;
    });
  }, []);

  const unlinkTaskAndNote = useCallback((taskId: string, noteId: string) => {
    const now = new Date().toISOString();
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              linkedNoteIds: t.linkedNoteIds.filter((id) => id !== noteId),
              updatedAt: now,
            }
          : t
      );
      const target = updated.find((t) => t.id === taskId);
      if (target) void storageAdapter.saveTask(target);
      return updated;
    });

    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              linkedTaskIds: n.linkedTaskIds.filter((id) => id !== taskId),
              updatedAt: now,
            }
          : n
      );
      const target = updated.find((n) => n.id === noteId);
      if (target) void storageAdapter.saveNote(target);
      return updated;
    });
  }, []);

  const recordPomodoroSession = useCallback(
    (taskId: string, minutes: number) => {
      const now = new Date().toISOString();
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                pomodoroSessions: (t.pomodoroSessions ?? 0) + 1,
                pomodoroMinutes: (t.pomodoroMinutes ?? 0) + minutes,
                updatedAt: now,
              }
            : t
        );
        const target = updated.find((t) => t.id === taskId);
        if (target) void storageAdapter.saveTask(target);
        return updated;
      });
    },
    []
  );

  return {
    tasks,
    notes,
    isLoaded,
    createTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    createNote,
    updateNote,
    deleteNote,
    linkTaskAndNote,
    unlinkTaskAndNote,
    recordPomodoroSession,
  };
}
