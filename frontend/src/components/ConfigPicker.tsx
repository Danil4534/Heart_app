interface ConfigPickerProps {
  options: string[];
  value: string[];
  onChange: (ids: string[]) => void;
}

export function ConfigPicker({ options, value, onChange }: ConfigPickerProps) {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((entry) => entry !== item));
      return;
    }
    onChange([...value, item]);
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => {
        const checked = value.includes(option);
        return (
          <label
            key={option}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition ${
              checked
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/30 dark:text-brand-200"
                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <span>{option}</span>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(option)}
              className="h-4 w-4 rounded border-slate-300 accent-brand-500"
            />
          </label>
        );
      })}
    </div>
  );
}
