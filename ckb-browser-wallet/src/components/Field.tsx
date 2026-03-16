import { PropsWithChildren } from "react";

export function Field({
  label,
  children,
  hint
}: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}