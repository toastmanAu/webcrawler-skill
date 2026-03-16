import { PropsWithChildren } from "react";

export function Card({
  children,
  title,
  right
}: PropsWithChildren<{ title?: string; right?: React.ReactNode }>) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}