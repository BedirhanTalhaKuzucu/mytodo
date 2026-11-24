"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { usePomodoro } from "@/hooks/usePomodoro";
import { getTodayISO, isOverdue, isToday } from "@/lib/utils";
import type { NavView, Note, SelectedItem, SpaceFilter, SpaceType } from "@/types";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { DetailDrawer } from "./DetailDrawer";
import { CommandPalette } from "./CommandPalette";
import { PomodoroModal } from "./PomodoroModal";
import { QuickAddModal } from "./QuickAddModal";
import { TodayView } from "./views/TodayView";
import { InboxView } from "./views/InboxView";
import { WeeklyView } from "./views/WeeklyView";
import { NotesView } from "./views/NotesView";
import { BudgetModule } from "@/modules/budget/components/BudgetModule";

export function AppShell() {
  const {
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
  } = useAppData();

  const {
    pomodoro,
    isActive: isPomodoroActive,
    toggleRunning: togglePomodoroRunning,
    reset: resetPomodoro,
    switchMode: switchPomodoroMode,
    setDurations: setPomodoroDurations,
    startFocusOnTask,
    clearActiveTask,
  } = usePomodoro(recordPomodoroSession);

  const [appMode, setAppModeState] = useState<"todo" | "budget">(() => {
    if (typeof window === "undefined") return "todo";
    try {
      const saved = window.localStorage.getItem("denge_app_mode_v1");
      if (saved === "budget" || saved === "todo") return saved;
    } catch {
      // ignore storage errors
    }
    return "todo";
  });

  const setAppMode = useCallback((mode: "todo" | "budget") => {
    setAppModeState(mode);
    try {
      window.localStorage.setItem("denge_app_mode_v1", mode);
    } catch {
      // ignore storage errors
    }
  }, []);
  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>("all");
  const [activeView, setActiveView] = useState<NavView>("today");
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [quickAddState, setQuickAddState] = useState<{
    open: boolean;
    mode: "task" | "note";
    initialTitle?: string;
    initialBody?: string;
  }>(() => {
    if (typeof window === "undefined") {
      return { open: false, mode: "task" };
    }
    const params = new URLSearchParams(window.location.search);
    const sharedTitle =
      params.get("shareTitle") ?? params.get("title") ?? "";
    const sharedText =
      params.get("shareText") ?? params.get("text") ?? "";
    const sharedUrl =
      params.get("shareUrl") ?? params.get("url") ?? "";

    if (!sharedTitle && !sharedText && !sharedUrl) {
      return { open: false, mode: "task" };
    }

    const firstLine = sharedText.split(/\r?\n/)[0]?.trim() ?? "";
    const derivedTitle =
      sharedTitle.trim() ||
      (firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine) ||
      sharedUrl.trim();

    const bodyParts = [sharedText.trim(), sharedUrl.trim()].filter(Boolean);
    const derivedBody = bodyParts.join("\n\n");

    return {
      open: true,
      mode: "task",
      initialTitle: derivedTitle,
      initialBody: derivedBody === derivedTitle ? "" : derivedBody,
    };
  });

  // Clean share query parameters from URL after reading them
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (
      params.has("shareTitle") ||
      params.has("shareText") ||
      params.has("shareUrl") ||
      params.has("title") ||
      params.has("text") ||
      params.has("url")
    ) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Global keyboard shortcuts (Ctrl+K / Cmd+K, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (isCommandOpen) setIsCommandOpen(false);
        else if (isPomodoroOpen) setIsPomodoroOpen(false);
        else if (quickAddState.open)
          setQuickAddState((s) => ({ ...s, open: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandOpen, isPomodoroOpen, quickAddState.open]);

  const counts = useMemo(() => {
    const matchesSpace = (s: SpaceType | null) =>
      spaceFilter === "all" || s === spaceFilter;

    const todayCount = tasks.filter(
      (t) =>
        t.status === "todo" &&
        matchesSpace(t.space) &&
        (isToday(t.dueDate) || isOverdue(t.dueDate))
    ).length;

    const inboxTasksCount = tasks.filter(
      (t) =>
        t.status === "todo" &&
        (t.space === null || t.dueDate === null) &&
        (spaceFilter === "all" || t.space === spaceFilter || t.space === null)
    ).length;
    const inboxNotesCount = notes.filter((n) => n.space === null).length;

    const weeklyCount = tasks.filter(
      (t) => t.status === "todo" && matchesSpace(t.space) && t.dueDate !== null
    ).length;

    const notesCount = notes.filter((n) => matchesSpace(n.space)).length;

    return {
      today: todayCount,
      inbox: inboxTasksCount + inboxNotesCount,
      weekly: weeklyCount,
      notes: notesCount,
    };
  }, [tasks, notes, spaceFilter]);

  const defaultSpaceForNew: SpaceType | null =
    spaceFilter === "all" ? null : spaceFilter;

  const handleCreateTaskFromNote = (note: Note, title: string) => {
    createTask({
      title,
      space: note.space,
      dueDate: getTodayISO(),
      linkedNoteIds: [note.id],
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#E7E5E4] shadow-xs animate-pulse">
            <div className="flex items-center gap-1">
              <span className="h-4 w-1.5 rounded-full bg-[#4F46E5]" />
              <span className="h-4 w-1.5 rounded-full bg-[#059669]" />
            </div>
          </div>
          <p className="text-xs font-medium text-[#78716C]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FAF9F6] text-[#1C1917]">
      <TopBar
        spaceFilter={spaceFilter}
        hideSpaceFilter={appMode === "budget"}
        onChangeSpace={setSpaceFilter}
        onOpenCommandPalette={() => setIsCommandOpen(true)}
        pomodoro={pomodoro}
        isPomodoroActive={isPomodoroActive}
        onTogglePomodoroRunning={togglePomodoroRunning}
        onOpenPomodoroModal={() => setIsPomodoroOpen(true)}
      />

      {appMode === "budget" ? (
        <BudgetModule onExitBudget={() => setAppMode("todo")} />
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* PC Left Sidebar */}
          <Sidebar
            activeView={activeView}
            onSelectView={setActiveView}
            counts={counts}
            onQuickAddTask={() => setQuickAddState({ open: true, mode: "task" })}
            onQuickAddNote={() => setQuickAddState({ open: true, mode: "note" })}
            pomodoro={pomodoro}
            onOpenPomodoroModal={() => setIsPomodoroOpen(true)}
            onOpenBudgetApp={() => setAppMode("budget")}
          />

          {/* Center Content Area */}
          <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 md:px-7 md:py-6 md:pb-8">
            {activeView === "today" && (
              <TodayView
                tasks={tasks}
                notes={notes}
                spaceFilter={spaceFilter}
                selectedId={selected?.id ?? null}
                pomodoroTaskId={pomodoro.activeTaskId}
                onToggleTask={toggleTaskStatus}
                onSelectTask={(id) => setSelected({ type: "task", id })}
                onSelectNote={(id) => setSelected({ type: "note", id })}
                onFocusPomodoro={startFocusOnTask}
                onCreateQuickTask={(title, space, dueDate) =>
                  createTask({ title, space, dueDate })
                }
              />
            )}

            {activeView === "inbox" && (
              <InboxView
                tasks={tasks}
                notes={notes}
                spaceFilter={spaceFilter}
                selectedId={selected?.id ?? null}
                onToggleTask={toggleTaskStatus}
                onSelectTask={(id) => setSelected({ type: "task", id })}
                onSelectNote={(id) => setSelected({ type: "note", id })}
                onUpdateTask={updateTask}
                onUpdateNote={updateNote}
                onCreateInboxTask={(title) =>
                  createTask({ title, space: null, dueDate: null })
                }
              />
            )}

            {activeView === "weekly" && (
              <WeeklyView
                tasks={tasks}
                spaceFilter={spaceFilter}
                selectedId={selected?.id ?? null}
                onToggleTask={toggleTaskStatus}
                onSelectTask={(id) => setSelected({ type: "task", id })}
                onUpdateTask={updateTask}
                onCreateTaskForDay={(title, space, dueDate) =>
                  createTask({ title, space, dueDate })
                }
              />
            )}

            {activeView === "notes" && (
              <NotesView
                notes={notes}
                spaceFilter={spaceFilter}
                selectedId={selected?.id ?? null}
                onSelectNote={(id) => setSelected({ type: "note", id })}
                onTogglePin={(id, currentPinned) =>
                  updateNote(id, { isPinned: !currentPinned })
                }
                onCreateNote={() => {
                  const created = createNote({
                    title: "Yeni Not",
                    content: "",
                    space: defaultSpaceForNew,
                  });
                  setSelected({ type: "note", id: created.id });
                }}
              />
            )}
          </main>

          {/* PC Slide-Over / Mobile Bottom-Sheet Detail Drawer */}
          <DetailDrawer
            selected={selected}
            tasks={tasks}
            notes={notes}
            pomodoro={pomodoro}
            onClose={() => setSelected(null)}
            onSelect={setSelected}
            onUpdateTask={updateTask}
            onToggleTask={toggleTaskStatus}
            onDeleteTask={deleteTask}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onLinkTaskNote={linkTaskAndNote}
            onUnlinkTaskNote={unlinkTaskAndNote}
            onCreateTaskFromNote={handleCreateTaskFromNote}
            onFocusPomodoro={startFocusOnTask}
          />
        </div>
      )}

      {/* Mobile Bottom Nav + FAB (Todo mode only) */}
      {appMode === "todo" && (
        <MobileNav
          activeView={activeView}
          onSelectView={setActiveView}
          counts={counts}
          onOpenQuickAdd={() => setQuickAddState({ open: true, mode: "task" })}
          onOpenBudgetApp={() => setAppMode("budget")}
        />
      )}

      {/* Ctrl+K Command Palette */}
      {isCommandOpen && (
        <CommandPalette
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          tasks={tasks}
          notes={notes}
          onNavigate={setActiveView}
          onChangeSpace={setSpaceFilter}
          onSelectTask={(id) => setSelected({ type: "task", id })}
          onSelectNote={(id) => setSelected({ type: "note", id })}
          onQuickCreateTask={(title) => {
            const created = createTask({
              title,
              space: defaultSpaceForNew,
              dueDate: activeView === "inbox" ? null : getTodayISO(),
            });
            setSelected({ type: "task", id: created.id });
          }}
          onQuickCreateNote={(title) => {
            const created = createNote({
              title,
              content: "",
              space: defaultSpaceForNew,
            });
            setSelected({ type: "note", id: created.id });
          }}
        />
      )}

      {/* Pomodoro Modal */}
      {isPomodoroOpen && (
        <PomodoroModal
          isOpen={isPomodoroOpen}
          onClose={() => setIsPomodoroOpen(false)}
          pomodoro={pomodoro}
          tasks={tasks}
          onToggleRunning={togglePomodoroRunning}
          onReset={resetPomodoro}
          onSwitchMode={switchPomodoroMode}
          onSetDurations={setPomodoroDurations}
          onStartTask={startFocusOnTask}
          onClearTask={clearActiveTask}
        />
      )}

      {/* Quick Add Modal (Mobile FAB + PC Quick Add + Share Target) */}
      {quickAddState.open && (
        <QuickAddModal
          isOpen={quickAddState.open}
          initialMode={quickAddState.mode}
          initialTitle={quickAddState.initialTitle}
          initialBody={quickAddState.initialBody}
          defaultSpace={defaultSpaceForNew}
          onClose={() => setQuickAddState((s) => ({ ...s, open: false }))}
          onCreateTask={(data) => {
            const created = createTask(data);
            setSelected({ type: "task", id: created.id });
          }}
          onCreateNote={(data) => {
            const created = createNote(data);
            setSelected({ type: "note", id: created.id });
          }}
        />
      )}
    </div>
  );
}
