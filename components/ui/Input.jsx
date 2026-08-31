/**
 * Input — labelled text input with an error state, matching the brand's form
 * language. Reused by the Phase 5 consultation form.
 *
 * Uncontrolled by default; pass `value` + `onChange` from a client component to
 * control it. Extra props (name, value, onChange, required, autoComplete, etc.)
 * are forwarded to the underlying `<input>`.
 *
 * @param {object} props
 * @param {string} [props.label] - Visible field label.
 * @param {string} [props.id] - Input id (falls back to `name`); links the label.
 * @param {string} [props.name] - Field name.
 * @param {string} [props.type='text'] - Input type.
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {string} [props.error] - Error message; when set, shows the error state.
 * @param {boolean} [props.required=false] - Marks the field required (adds a visual asterisk).
 * @param {string} [props.className] - Extra classes on the input element.
 * @param {string} [props.wrapperClassName] - Extra classes on the field wrapper.
 */
export default function Input({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  error,
  required = false,
  className = '',
  wrapperClassName = '',
  ...rest
}) {
  const inputId = id || name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  const inputClasses = [
    'w-full rounded-none border bg-white px-3.5 py-2.5 text-body text-brand-slate',
    'placeholder:text-brand-muted transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    error
      ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/40'
      : 'border-slate-300 focus:border-brand-navy focus:ring-brand-navy/30',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['w-full', wrapperClassName].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-caption font-medium text-brand-slate">
          {label}
          {required && <span className="ml-0.5 text-brand-error">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={inputClasses}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-caption text-brand-error">
          {error}
        </p>
      )}
    </div>
  );
}
