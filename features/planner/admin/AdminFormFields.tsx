"use client";

import type { ReactNode } from "react";

export function AdminFieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-soft bg-subtle/40 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-soft">{title}</legend>
      {children}
    </fieldset>
  );
}

export function AdminField({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`admin-field${className ? ` ${className}` : ""}`}>
      <span className="admin-field__label">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-soft">{hint}</span> : null}
    </label>
  );
}

const inputClass = "admin-field__input w-full";

export function AdminTextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={className ? `${inputClass} ${className}` : inputClass} {...rest} />;
}

export function AdminNumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      type="number"
      className={className ? `${inputClass} ${className}` : inputClass}
      {...rest}
    />
  );
}

export function AdminTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={className ? `${inputClass} min-h-[88px] font-mono text-xs ${className}` : `${inputClass} min-h-[88px] font-mono text-xs`}
      {...rest}
    />
  );
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select className={className ? `${inputClass} ${className}` : inputClass} {...rest} />;
}

export function AdminCheckbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-strong">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-soft"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
