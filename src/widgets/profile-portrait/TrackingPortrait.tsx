"use client";

import { useEffect, useRef, useState } from "react";
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from "@rive-app/react-canvas";

import scratchTiming from "./idle-scratch.json";

RuntimeLoader.setWasmUrl("/profile-portrait/rive-2.42.2.wasm");

export default function TrackingPortrait({ request, onReady, onBusy }: {
  request: number;
  onReady: (ready: boolean) => void;
  onBusy: (busy: boolean) => void;
}) {
  const perform = useRef<(() => void) | null>(null);
  useEffect(() => { if (request > 0) perform.current?.(); }, [request]);
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: "/profile-portrait/caricature-idle-v4.riv",
    artboard: "Portrait",
    stateMachines: "Gaze",
    autoBind: true,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoadError: () => setFailed(true),
  });

  useEffect(() => {
    if (!rive || !host.current) return;
    const x = rive.viewModelInstance?.number("lookX");
    const y = rive.viewModelInstance?.number("lookY");
    const eyeOpen = rive.viewModelInstance?.number("eyeOpen");
    const eyeClosed = rive.viewModelInstance?.number("eyeClosed");
    const action = rive.viewModelInstance?.number("action");
    if (!x || !y || !eyeOpen || !eyeClosed || !action) { setFailed(true); return; }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = true;
    let performing = false;
    let scratching = false;
    let scratchTimer: ReturnType<typeof setTimeout> | undefined;
    let scratchEndTimer: ReturnType<typeof setTimeout> | undefined;
    let actionTimer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let previous = 0;
    let blinkStart: number | null = null;
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    const isVisible = () => !media.matches && !document.hidden && inView;
    const canAnimate = () => isVisible() && !performing && !scratching;
    const setScratching = (value: boolean) => {
      scratching = value;
      if (host.current) host.current.dataset.idleAction = value ? "scratch" : "none";
    };
    const scheduleScratch = () => {
      clearTimeout(scratchTimer);
      if (!canAnimate()) return;
      scratchTimer = setTimeout(() => {
        if (!canAnimate()) return;
        setScratching(true);
        cancelAnimationFrame(frame); frame = 0;
        clearTimeout(blinkTimer); blinkStart = null;
        eyeOpen.value = 1; eyeClosed.value = 0;
        x.value = 0; y.value = 0;
        action.value = 2;
        rive.play("Gaze");
        scratchEndTimer = setTimeout(() => {
          setScratching(false); action.value = 0;
          currentX = currentY = 0;
          aim(0, 0); scheduleBlink(); scheduleScratch();
        }, scratchTiming.frames / scratchTiming.fps * 1000 + scratchTiming.settleMs);
      }, scratchTiming.idleMinMs + Math.random() * scratchTiming.idleJitterMs);
    };
    const scheduleBlink = () => {
      clearTimeout(blinkTimer);
      if (!canAnimate()) return;
      blinkTimer = setTimeout(() => {
        if (!canAnimate()) return;
        blinkStart = performance.now();
        aim(targetX, targetY);
      }, 3200 + Math.random() * 2200);
    };
    const tick = (now: number) => {
      frame = 0;
      const alpha = 1 - Math.exp(-Math.min(now - previous, 64) / 75);
      previous = now;
      currentX += (targetX - currentX) * alpha;
      currentY += (targetY - currentY) * alpha;
      const settled = Math.abs(currentX - targetX) + Math.abs(currentY - targetY) < 0.01;
      x.value = settled ? targetX : currentX;
      y.value = settled ? targetY : currentY;
      if (blinkStart !== null) {
        const elapsed = now - blinkStart;
        const opening = elapsed < 65 ? 1 - elapsed / 65 : elapsed < 110 ? 0 : Math.min(1, (elapsed - 110) / 110);
        eyeOpen.value = Math.max(0.001, opening);
        eyeClosed.value = opening < 0.12 ? 1 : 0;
        if (elapsed >= 220) { blinkStart = null; scheduleBlink(); }
      }
      if (!settled || blinkStart !== null) frame = requestAnimationFrame(tick);
      else frame = requestAnimationFrame(() => { frame = 0; rive.pause(); });
    };
    const aim = (nextX: number, nextY: number) => {
      targetX = nextX; targetY = nextY;
      cancelAnimationFrame(frame);
      previous = performance.now();
      rive.play("Gaze");
      frame = requestAnimationFrame(tick);
    };
    const reset = () => { if (canAnimate()) aim(0, 0); };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" || media.matches || document.hidden || !inView || performing || scratching) return;
      scheduleScratch();
      const rect = host.current!.getBoundingClientRect();
      // Both eyes share one bounded direction, avoiding crossed eyes at close range.
      const dx = (event.clientX - (rect.left + rect.width * 0.50)) / Math.max(rect.width, 1);
      const dy = (event.clientY - (rect.top + rect.height * 0.38)) / Math.max(rect.height, 1);
      const length = Math.max(1, Math.hypot(dx, dy));
      aim(dx / length * 12, dy / length * 5);
    };
    perform.current = () => {
      if (!isVisible() || performing) return;
      clearTimeout(scratchTimer); clearTimeout(scratchEndTimer); setScratching(false);
      performing = true;
      onBusy(true);
      cancelAnimationFrame(frame); frame = 0;
      clearTimeout(blinkTimer); blinkStart = null;
      eyeOpen.value = 1; eyeClosed.value = 0;
      x.value = 0; y.value = 0;
      action.value = 1;
      rive.play("Gaze");
      actionTimer = setTimeout(() => {
        action.value = 0;
        performing = false;
        onBusy(false);
        currentX = currentY = 0;
        aim(0, 0);
        scheduleBlink(); scheduleScratch();
      }, 4800);
    };
    const availability = () => {
      cancelAnimationFrame(frame); frame = 0;
      clearTimeout(scratchTimer); clearTimeout(scratchEndTimer); setScratching(false);
      clearTimeout(actionTimer); performing = false; action.value = 0; onBusy(false);
      clearTimeout(blinkTimer); blinkStart = null;
      eyeOpen.value = 1; eyeClosed.value = 0;
      currentX = currentY = targetX = targetY = 0;
      x.value = 0; y.value = 0;
      const visible = !media.matches && !document.hidden && inView && !performing;
      setReady(visible); onReady(visible);
      if (visible) { aim(0, 0); scheduleBlink(); scheduleScratch(); } else rive.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; availability(); });
    observer.observe(host.current);
    availability();
    window.addEventListener("pointermove", pointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", availability);
    media.addEventListener("change", availability);
    return () => {
      perform.current = null;
      clearTimeout(scratchTimer); clearTimeout(scratchEndTimer);
      cancelAnimationFrame(frame); clearTimeout(blinkTimer); clearTimeout(actionTimer); observer.disconnect();
      window.removeEventListener("pointermove", pointer);
      document.documentElement.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", availability);
      media.removeEventListener("change", availability);
    };
  }, [rive, onReady, onBusy]);

  useEffect(() => { if (failed) onReady(false); }, [failed, onReady]);

  return <div ref={host} aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ opacity: ready && !failed ? 1 : 0 }}>
    <RiveComponent className="h-full w-full" />
  </div>;
}
