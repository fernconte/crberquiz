import type { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className }: GlassPanelProps) {
  const baseClasses =
    "rounded-3xl border border-cyber-cyan/30 bg-white/5 backdrop-blur";

  return (
    <div className={className ? `${baseClasses} ${className}` : baseClasses}>
      {children}
    </div>
  );
}
