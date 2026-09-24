"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";
import frame from "./portrait-frame.json";

const TrackingPortrait = dynamic(() => import("./TrackingPortrait"), { ssr: false });

export default function ProfilePortrait() {
  const clipId = useId();
  const [request, setRequest] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [left, top, right, bottom] = frame.crop;
  return (
    <button type="button" aria-label="캐릭터 동작 재생: 점프, 회전, 주머니에서 노트북 꺼내기"
      title={busy ? "노트북 꺼내는 중…" : "클릭하면 점프하고 노트북을 꺼내요"}
      disabled={!ready || busy} aria-busy={busy} data-performing={busy}
      onClick={() => setRequest((value) => value + 1)}
      className="relative block h-full w-full cursor-pointer overflow-hidden border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-500 disabled:cursor-default">
      <svg aria-hidden="true" viewBox="0 0 1024 1024" className="absolute inset-0 h-full w-full" style={{ opacity: ready ? 0 : 1 }}>
        <defs><clipPath id={clipId}><rect x={left} y={top} width={right-left} height={bottom-top} /></clipPath></defs>
        <g transform={`translate(${frame.x} ${frame.y}) scale(${frame.scale})`}>
          <image href="/profile-portrait/front-color-v3.png" width="1536" height="1024" clipPath={`url(#${clipId})`} />
        </g>
      </svg>
      <TrackingPortrait request={request} onReady={setReady} onBusy={setBusy} />
    </button>
  );
}
