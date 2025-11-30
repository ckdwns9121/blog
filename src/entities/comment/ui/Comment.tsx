"use client";

import { useUtterances } from "../model";

interface CommentProps {
  repo: string;
  issueTerm?: "pathname" | "url" | "title" | "og:title";
  label?: string;
}

export default function Comment({ repo, issueTerm = "pathname", label = "Comment" }: CommentProps) {
  const containerRef = useUtterances({ repo, issueTerm, label });

  return <div ref={containerRef} className="mt-8" />;
}
