import type { ReactNode } from "react";

interface Props {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Panel({ title, actions, children, className = "" }: Props) {
  return (
    <div
      className={`screwed panel-in bg-paper-raised border border-line rounded-sm p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${className}`}
    >
      <span className="screw-bl" />
      <span className="screw-br" />
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 mb-3">
          {title && (
            <h3 className="font-display text-xs font-semibold tracking-[0.1em] uppercase text-fog">
              {title}
            </h3>
          )}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
