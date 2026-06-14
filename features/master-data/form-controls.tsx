import { ReactNode } from "react";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  required = false,
  hint
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date" | "time";
  min?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="mt-2 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition placeholder:text-stone-400 focus:border-luxas-green"
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {hint ? <p className="mt-1.5 text-xs text-stone-500">{hint}</p> : null}
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <select
        className="mt-2 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition focus:border-luxas-green"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {children}
      </select>
    </label>
  );
}

export function ToggleField({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-luxas-line bg-white px-3 py-2.5">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="h-4 w-4 accent-luxas-green"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
