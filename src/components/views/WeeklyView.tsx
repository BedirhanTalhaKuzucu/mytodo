"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import type { SpaceFilter, SpaceType, Task } from "@/types";
import {
  addDaysISO,
  getMonthCalendarDays,
  getTodayISO,
  getTomorrowISO,
  getWeekDays,
} from "@/lib/utils";
import { TaskRow } from "@/components/TaskRow";

interface WeeklyViewProps {
  tasks: Task[];
  spaceFilter: SpaceFilter;
  selectedId: string | null;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onCreateTaskForDay: (
    title: string,
    space: SpaceType | null,
    dueDate: string
  ) => void;
}

const WEEKDAY_HEADERS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function WeeklyView({
  tasks,
  spaceFilter,
  selectedId,
  onToggleTask,
  onSelectTask,
  onUpdateTask,
  onCreateTaskForDay,
}: WeeklyViewProps) {
  const [calendarMode, setCalendarMode] = useState<"weekly" | "monthly">(
    "weekly"
  );
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const weekDays = getWeekDays(weekOffset);
  const monthData = getMonthCalendarDays(monthOffset);
  const todayISO = getTodayISO();
  const tomorrowISO = getTomorrowISO();

  const [selectedDayISO, setSelectedDayISO] = useState<string>(todayISO);
  const [addingDayISO, setAddingDayISO] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const filteredTasks = tasks.filter(
    (t) => spaceFilter === "all" || t.space === spaceFilter
  );

  const handleWeekChange = (nextOffset: number) => {
    setWeekOffset(nextOffset);
    const nextDays = getWeekDays(nextOffset);
    const todayMatch = nextDays.find((d) => d.isToday);
    setSelectedDayISO(todayMatch ? todayMatch.iso : nextDays[0].iso);
  };

  const handleMonthChange = (nextOffset: number) => {
    setMonthOffset(nextOffset);
    const nextMonth = getMonthCalendarDays(nextOffset);
    const todayMatch = nextMonth.days.find((d) => d.isToday);
    const firstCurrent = nextMonth.days.find((d) => d.isCurrentMonth);
    setSelectedDayISO(
      todayMatch?.iso ?? firstCurrent?.iso ?? nextMonth.days[0].iso
    );
  };

  const handleAddForDay = (dayISO: string) => {
    if (!newTaskTitle.trim()) {
      setAddingDayISO(null);
      return;
    }
    const targetSpace: SpaceType =
      spaceFilter === "personal" ? "personal" : "work";
    onCreateTaskForDay(newTaskTitle, targetSpace, dayISO);
    setNewTaskTitle("");
    setAddingDayISO(null);
  };

  const activeMobileDay =
    (calendarMode === "weekly"
      ? weekDays.find((d) => d.iso === selectedDayISO) ?? weekDays[0]
      : monthData.days.find((d) => d.iso === selectedDayISO) ??
        monthData.days.find((d) => d.isToday) ??
        monthData.days[0]);

  const selectedDayTasks = filteredTasks.filter(
    (t) => t.dueDate === activeMobileDay.iso
  );

  return (
    <div className="@container mx-auto max-w-7xl space-y-5">
      {/* Header, Mode Switcher & Period Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#4F46E5]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">
            {calendarMode === "weekly" ? "Haftalık Plan" : "Aylık Plan"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Weekly / Monthly Segmented Control */}
          <div className="flex items-center rounded-xl border border-[#E7E5E4] bg-stone-100/80 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setCalendarMode("weekly")}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                calendarMode === "weekly"
                  ? "bg-white text-[#1C1917] shadow-2xs"
                  : "text-[#78716C] hover:text-[#1C1917]"
              }`}
            >
              Haftalık
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode("monthly")}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                calendarMode === "monthly"
                  ? "bg-white text-[#1C1917] shadow-2xs"
                  : "text-[#78716C] hover:text-[#1C1917]"
              }`}
            >
              Aylık
            </button>
          </div>

          {/* Prev / Current / Next */}
          <div className="flex items-center gap-1 rounded-xl border border-[#E7E5E4] bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() =>
                calendarMode === "weekly"
                  ? handleWeekChange(weekOffset - 1)
                  : handleMonthChange(monthOffset - 1)
              }
              className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100 hover:text-[#1C1917]"
              title={calendarMode === "weekly" ? "Önceki Hafta" : "Önceki Ay"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                calendarMode === "weekly"
                  ? handleWeekChange(0)
                  : handleMonthChange(0)
              }
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-[#1C1917] hover:bg-stone-100 capitalize"
            >
              {calendarMode === "weekly"
                ? weekOffset === 0
                  ? "Bu Hafta"
                  : `${weekDays[0].dayNumber} ${weekDays[0].monthShort}`
                : monthData.monthLabel}
            </button>
            <button
              type="button"
              onClick={() =>
                calendarMode === "weekly"
                  ? handleWeekChange(weekOffset + 1)
                  : handleMonthChange(monthOffset + 1)
              }
              className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100 hover:text-[#1C1917]"
              title={calendarMode === "weekly" ? "Sonraki Hafta" : "Sonraki Ay"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= WEEKLY MODE ================= */}
      {calendarMode === "weekly" && (
        <>
          {/* MOBILE: Horizontal Day Strip */}
          <div className="md:hidden space-y-4">
            <div className="grid grid-cols-7 gap-1 rounded-xl border border-[#E7E5E4] bg-white p-1.5">
              {weekDays.map((day) => {
                const selected = day.iso === activeMobileDay.iso;
                const dayCount = filteredTasks.filter(
                  (t) => t.dueDate === day.iso && t.status === "todo"
                ).length;
                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => setSelectedDayISO(day.iso)}
                    className={`flex flex-col items-center rounded-lg py-2 text-xs transition-all ${
                      selected
                        ? "bg-[#1C1917] text-white shadow-xs"
                        : day.isToday
                        ? "bg-indigo-50 text-[#4F46E5]"
                        : "text-[#78716C] hover:bg-stone-100"
                    }`}
                  >
                    <span className="text-[10px] uppercase">{day.dayName}</span>
                    <span className="mt-0.5 text-sm font-semibold">
                      {day.dayNumber}
                    </span>
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${
                        dayCount > 0
                          ? selected
                            ? "bg-amber-400"
                            : "bg-[#4F46E5]"
                          : "bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <SelectedDayTaskPanel
              dayNumber={activeMobileDay.dayNumber}
              monthShort={activeMobileDay.monthShort}
              dayISO={activeMobileDay.iso}
              tasks={selectedDayTasks}
              selectedId={selectedId}
              todayISO={todayISO}
              tomorrowISO={tomorrowISO}
              addingDayISO={addingDayISO}
              newTaskTitle={newTaskTitle}
              onSetAddingDay={setAddingDayISO}
              onSetNewTaskTitle={setNewTaskTitle}
              onAddForDay={handleAddForDay}
              onToggleTask={onToggleTask}
              onSelectTask={onSelectTask}
              onUpdateTask={onUpdateTask}
            />
          </div>

          {/* DESKTOP: Container-Responsive Grid (never squeezes columns when drawer opens) */}
          <div className="hidden md:grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayTasks = filteredTasks.filter(
                (t) => t.dueDate === day.iso
              );
              const isAdding = addingDayISO === day.iso;

              return (
                <div
                  key={day.iso}
                  className={`flex min-w-0 min-h-[240px] flex-col rounded-xl border p-3 transition-colors ${
                    day.isToday
                      ? "border-indigo-300 bg-white shadow-xs"
                      : "border-[#E7E5E4] bg-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                    <div className="min-w-0">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wider ${
                          day.isToday ? "text-[#4F46E5]" : "text-[#78716C]"
                        }`}
                      >
                        {day.dayName}
                      </span>
                      <p className="text-base font-bold text-[#1C1917] truncate">
                        {day.dayNumber}{" "}
                        <span className="text-xs font-normal text-[#78716C]">
                          {day.monthShort}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingDayISO(day.iso);
                        setNewTaskTitle("");
                      }}
                      title="Bu güne görev ekle"
                      className="shrink-0 rounded-lg p-1 text-[#78716C] hover:bg-stone-100 hover:text-[#1C1917]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex-1 space-y-2 min-w-0">
                    {dayTasks.map((task) => {
                      const done = task.status === "done";
                      return (
                        <div
                          key={task.id}
                          onClick={() => onSelectTask(task.id)}
                          className={`group min-w-0 overflow-hidden rounded-lg border p-2 text-xs cursor-pointer transition-all ${
                            selectedId === task.id
                              ? "border-indigo-300 bg-indigo-50/40"
                              : "border-[#E7E5E4] bg-[#FAF9F6] hover:border-stone-300 hover:bg-white"
                          } ${done ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTask(task.id);
                              }}
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                done
                                  ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                                  : "border-stone-300 bg-white"
                              }`}
                            >
                              {done && (
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              )}
                            </button>
                            <span
                              className={`min-w-0 flex-1 break-words line-clamp-3 font-medium leading-snug ${
                                done
                                  ? "line-through text-[#78716C]"
                                  : "text-[#1C1917]"
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-1">
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                task.space === "work"
                                  ? "bg-[#4F46E5]"
                                  : task.space === "personal"
                                  ? "bg-[#059669]"
                                  : "bg-stone-400"
                              }`}
                            />
                            <div
                              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {day.iso !== todayISO && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateTask(task.id, { dueDate: todayISO })
                                  }
                                  className="rounded bg-white px-1 py-0.5 text-[10px] text-[#78716C] border border-stone-200 hover:text-[#1C1917]"
                                  title="Bugüne al"
                                >
                                  Bugün
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateTask(task.id, {
                                    dueDate: addDaysISO(day.iso, 1),
                                  })
                                }
                                className="rounded bg-white px-1 py-0.5 text-[10px] text-[#78716C] border border-stone-200 hover:text-[#1C1917]"
                                title="1 gün ertele"
                              >
                                +1g
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isAdding && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddForDay(day.iso);
                        }}
                        className="rounded-lg border border-indigo-300 bg-white p-1.5"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onBlur={() => {
                            if (!newTaskTitle.trim()) setAddingDayISO(null);
                          }}
                          placeholder="Görev..."
                          className="w-full text-xs text-[#1C1917] focus:outline-none"
                        />
                      </form>
                    )}

                    {dayTasks.length === 0 && !isAdding && (
                      <p className="py-6 text-center text-[11px] text-[#78716C]/60">
                        Boş
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ================= MONTHLY MODE ================= */}
      {calendarMode === "monthly" && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-2xs">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-[#E7E5E4] bg-[#FAF9F6]">
              {WEEKDAY_HEADERS.map((wd) => (
                <div
                  key={wd}
                  className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[#78716C]"
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-[#E7E5E4]">
              {monthData.days.map((day) => {
                const dayTasks = filteredTasks.filter(
                  (t) => t.dueDate === day.iso
                );
                const isSelectedDay = activeMobileDay.iso === day.iso;
                const isAdding = addingDayISO === day.iso;

                return (
                  <div
                    key={day.iso}
                    onClick={() => setSelectedDayISO(day.iso)}
                    className={`group relative flex min-h-[64px] md:min-h-[112px] flex-col p-1.5 md:p-2 cursor-pointer transition-colors ${
                      !day.isCurrentMonth
                        ? "bg-stone-50/70 text-[#78716C]/50"
                        : isSelectedDay
                        ? "bg-indigo-50/35"
                        : "bg-white hover:bg-[#FAF9F6]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          day.isToday
                            ? "bg-[#4F46E5] text-white"
                            : isSelectedDay
                            ? "bg-[#1C1917] text-white md:bg-transparent md:text-[#1C1917]"
                            : day.isCurrentMonth
                            ? "text-[#1C1917]"
                            : "text-[#78716C]/50"
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingDayISO(day.iso);
                          setNewTaskTitle("");
                        }}
                        title="Bu güne görev ekle"
                        className="hidden md:inline-flex opacity-0 group-hover:opacity-100 rounded p-0.5 text-[#78716C] hover:bg-stone-200/70 hover:text-[#1C1917]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Mobile: Task Dots */}
                    {dayTasks.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5 md:hidden">
                        {dayTasks.slice(0, 4).map((t) => (
                          <span
                            key={t.id}
                            className={`h-1.5 w-1.5 rounded-full ${
                              t.status === "done"
                                ? "bg-stone-300"
                                : t.space === "work"
                                ? "bg-[#4F46E5]"
                                : t.space === "personal"
                                ? "bg-[#059669]"
                                : "bg-stone-400"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Desktop: Task Pills */}
                    <div className="mt-1.5 hidden md:flex flex-1 flex-col gap-1 min-w-0">
                      {dayTasks.slice(0, 3).map((t) => {
                        const done = t.status === "done";
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTask(t.id);
                            }}
                            className={`flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-left text-[11px] transition-colors min-w-0 ${
                              selectedId === t.id
                                ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                                : "border-[#E7E5E4] bg-[#FAF9F6] hover:border-stone-300 hover:bg-white text-[#1C1917]"
                            } ${done ? "opacity-55 line-through" : ""}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                t.space === "work"
                                  ? "bg-[#4F46E5]"
                                  : t.space === "personal"
                                  ? "bg-[#059669]"
                                  : "bg-stone-400"
                              }`}
                            />
                            <span className="truncate font-medium">
                              {t.title}
                            </span>
                          </button>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <span className="px-1 text-[10px] font-medium text-[#78716C]">
                          +{dayTasks.length - 3} görev daha
                        </span>
                      )}

                      {isAdding && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddForDay(day.iso);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border border-indigo-300 bg-white px-1.5 py-0.5"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onBlur={() => {
                              if (!newTaskTitle.trim()) setAddingDayISO(null);
                            }}
                            placeholder="Görev..."
                            className="w-full text-[11px] text-[#1C1917] focus:outline-none"
                          />
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Selected Day Task List under Monthly Calendar */}
          <div className="md:hidden">
            <SelectedDayTaskPanel
              dayNumber={activeMobileDay.dayNumber}
              monthShort={activeMobileDay.monthShort}
              dayISO={activeMobileDay.iso}
              tasks={selectedDayTasks}
              selectedId={selectedId}
              todayISO={todayISO}
              tomorrowISO={tomorrowISO}
              addingDayISO={addingDayISO}
              newTaskTitle={newTaskTitle}
              onSetAddingDay={setAddingDayISO}
              onSetNewTaskTitle={setNewTaskTitle}
              onAddForDay={handleAddForDay}
              onToggleTask={onToggleTask}
              onSelectTask={onSelectTask}
              onUpdateTask={onUpdateTask}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SelectedDayTaskPanel({
  dayNumber,
  monthShort,
  dayISO,
  tasks,
  selectedId,
  todayISO,
  tomorrowISO,
  addingDayISO,
  newTaskTitle,
  onSetAddingDay,
  onSetNewTaskTitle,
  onAddForDay,
  onToggleTask,
  onSelectTask,
  onUpdateTask,
}: {
  dayNumber: string;
  monthShort: string;
  dayISO: string;
  tasks: Task[];
  selectedId: string | null;
  todayISO: string;
  tomorrowISO: string;
  addingDayISO: string | null;
  newTaskTitle: string;
  onSetAddingDay: (iso: string | null) => void;
  onSetNewTaskTitle: (val: string) => void;
  onAddForDay: (iso: string) => void;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1C1917]">
          {dayNumber} {monthShort}
        </h2>
        <button
          type="button"
          onClick={() => {
            onSetAddingDay(dayISO);
            onSetNewTaskTitle("");
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#E7E5E4] px-2.5 py-1 text-xs font-medium text-[#1C1917]"
        >
          <Plus className="h-3.5 w-3.5" />
          Ekle
        </button>
      </div>

      {addingDayISO === dayISO && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddForDay(dayISO);
          }}
          className="flex items-center gap-2 rounded-xl border border-indigo-300 bg-white p-2"
        >
          <input
            type="text"
            autoFocus
            value={newTaskTitle}
            onChange={(e) => onSetNewTaskTitle(e.target.value)}
            placeholder="Görev başlığı..."
            className="min-w-0 flex-1 text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#1C1917] px-3 py-1 text-xs font-medium text-white"
          >
            Ekle
          </button>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E7E5E4] bg-white/60 py-8 text-center text-xs text-[#78716C]">
          Bu gün için planlanmış görev yok.
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isSelected={selectedId === task.id}
              onToggle={onToggleTask}
              onSelect={onSelectTask}
              extraActions={
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-[#78716C]">Taşı:</span>
                  {task.dueDate !== todayISO && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTask(task.id, { dueDate: todayISO })
                      }
                      className="rounded-md bg-stone-100 px-2 py-0.5 font-medium text-[#1C1917] hover:bg-stone-200"
                    >
                      Bugün
                    </button>
                  )}
                  {task.dueDate !== tomorrowISO && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTask(task.id, { dueDate: tomorrowISO })
                      }
                      className="rounded-md bg-stone-100 px-2 py-0.5 font-medium text-[#1C1917] hover:bg-stone-200"
                    >
                      Yarın
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateTask(task.id, {
                        dueDate: addDaysISO(task.dueDate ?? todayISO, 7),
                      })
                    }
                    className="rounded-md bg-stone-100 px-2 py-0.5 font-medium text-[#1C1917] hover:bg-stone-200"
                  >
                    +1 Hafta
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
