/**
 * Select — labelled dropdown matching Input's visual language, with an error
 * state. Reused for the practice-area selector in the Phase 5 contact form.
 *
 * Provide options via the `options` prop (array of `{ value, label }` or plain
 * strings) or by passing `<option>` children directly. Extra props (name,
 * value, onChange, required, etc.) are forwarded to the underlying `<select>`.
 *
 * @param {object} props
 * @param {string} [props.label] - Visible field label.
 * @param {string} [props.id] - Select id (falls back to `name`); links the label.
 * @param {string} [props.name] - Field name.
 * @param {Array<{value: string, label: string}|string>} [props.options=[]] - Option list.
 * @param {string} [props.placeholder] - Optional non-selectable prompt shown first.
 * @param {string} [props.error] - Error message; when set, shows the error state.
 * @param {boolean} [props.required=false] - Marks the field required.
 * @param {string} [props.className] - Extra classes on the select element.
 * @param {string} [props.wrapperClassName] - Extra classes on the field wrapper.
 * @param {React.ReactNode} [props.children] - Optional `<option>` children (used if `options` is empty).
 */
export default function Select({
  label,
  id,
  name,
  options = [],
  placeholder,
  error,
  required = false,
  className = '',
  wrapperClassName = '',
  children,
  ...rest
}) {
  const selectId = id || name;
  const errorId = error && selectId ? `${selectId}-error` : undefined;

  const selectClasses = [
    'w-full appearance-none rounded-none border bg-white px-3.5 py-2.5 pr-10 text-body text-brand-slate',
    'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
    error
      ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/40'
      : 'border-slate-300 focus:border-brand-navy focus:ring-brand-navy/30',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const normalized = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div className={['w-full', wrapperClassName].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-caption font-medium text-brand-slate">
          {label}
          {required && <span className="ml-0.5 text-brand-error">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          defaultValue={placeholder ? '' : undefined}
          className={selectClasses}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {normalized.length > 0
            ? normalized.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {/* Chevron */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-caption text-brand-error">
          {error}
        </p>
      )}
    </div>
  );
}
