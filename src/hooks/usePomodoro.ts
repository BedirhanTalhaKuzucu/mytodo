"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PomodoroMode, PomodoroState } from "@/types";

function playGentleChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}

export function usePomodoro(
  onFocusComplete?: (taskId: string, minutes: number) => void
) {
  const [state, setState] = useState<PomodoroState>({
    isRunning: false,
    mode: "focus",
    secondsLeft: 25 * 60,
    focusMinutes: 25,
    breakMinutes: 5,
    activeTaskId: null,
  });

  const onFocusCompleteRef = useRef(onFocusComplete);
  useEffect(() => {
    onFocusCompleteRef.current = onFocusComplete;
  }, [onFocusComplete]);

  useEffect(() => {
    if (!state.isRunning) return;

    const timer = window.setInterval(() => {
      setState((prev) => {
        if (!prev.isRunning) return prev;
        if (prev.secondsLeft <= 1) {
          playGentleChime();
          if (prev.mode === "focus" && prev.activeTaskId) {
            onFocusCompleteRef.current?.(prev.activeTaskId, prev.focusMinutes);
          }
          const nextMode: PomodoroMode =
            prev.mode === "focus" ? "break" : "focus";
          const nextSeconds =
            (nextMode === "focus" ? prev.focusMinutes : prev.breakMinutes) * 60;
          return {
            ...prev,
            isRunning: false,
            mode: nextMode,
            secondsLeft: nextSeconds,
          };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.isRunning]);

  const toggleRunning = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      secondsLeft:
        (prev.mode === "focus" ? prev.focusMinutes : prev.breakMinutes) * 60,
    }));
  }, []);

  const switchMode = useCallback((mode: PomodoroMode) => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      mode,
      secondsLeft:
        (mode === "focus" ? prev.focusMinutes : prev.breakMinutes) * 60,
    }));
  }, []);

  const setDurations = useCallback(
    (focusMinutes: number, breakMinutes: number) => {
      const safeFocus = Math.max(1, Math.min(120, focusMinutes));
      const safeBreak = Math.max(1, Math.min(60, breakMinutes));
      setState((prev) => ({
        ...prev,
        isRunning: false,
        focusMinutes: safeFocus,
        breakMinutes: safeBreak,
        secondsLeft:
          (prev.mode === "focus" ? safeFocus : safeBreak) * 60,
      }));
    },
    []
  );

  const startFocusOnTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      isRunning: true,
      mode: "focus",
      secondsLeft: prev.focusMinutes * 60,
      activeTaskId: taskId,
    }));
  }, []);

  const clearActiveTask = useCallback(() => {
    setState((prev) => ({ ...prev, activeTaskId: null }));
  }, []);

  const isActive =
    state.isRunning ||
    state.activeTaskId !== null ||
    state.secondsLeft !==
      (state.mode === "focus" ? state.focusMinutes : state.breakMinutes) * 60;

  return {
    pomodoro: state,
    isActive,
    toggleRunning,
    reset,
    switchMode,
    setDurations,
    startFocusOnTask,
    clearActiveTask,
  };
}
