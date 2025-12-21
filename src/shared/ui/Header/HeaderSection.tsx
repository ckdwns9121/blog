import { useMemo } from "react";
import { HeaderSectionProps } from "./types";
import { cn } from "@/shared/lib/cn";

export function HeaderSection({ plugins, position, className }: HeaderSectionProps) {
  // priority에 따라 정렬 (높은 순일수록 먼저 표시)
  const sortedPlugins = useMemo(() => [...plugins].sort((a, b) => (b.priority || 0) - (a.priority || 0)), [plugins]);

  if (sortedPlugins.length === 0) return null;

  if (position === "left") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {sortedPlugins.map((plugin) => (
          <div key={plugin.id} className="flex items-center">
            {plugin.render()}
          </div>
        ))}
      </div>
    );
  }

  if (position === "center") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {sortedPlugins.map((plugin) => (
          <div key={plugin.id} className="flex items-center">
            {plugin.render()}
          </div>
        ))}
      </div>
    );
  }

  if (position === "right") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {sortedPlugins.map((plugin) => (
          <div key={plugin.id} className="flex items-center">
            {plugin.render()}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {sortedPlugins.map((plugin) => (
        <div key={plugin.id} className="flex items-center">
          {plugin.render()}
        </div>
      ))}
    </div>
  );
}
