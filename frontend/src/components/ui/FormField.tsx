import { ReactNode, useState, forwardRef } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";

export const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-[#D0D5DD] text-sm text-[#101828] placeholder:text-[#98A2B3] bg-white focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/25 focus:border-[#4F7CFF] transition-all";

export const inputErrorCls =
  "w-full px-3 py-2.5 rounded-xl border border-[#E5484D] text-sm text-[#101828] placeholder:text-[#98A2B3] bg-white focus:outline-none focus:ring-2 focus:ring-[#E5484D]/20 focus:border-[#E5484D] transition-all";

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, error, required, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#475467]">
        {label}
        {required && <span className="text-[#E5484D] ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-[#98A2B3]">{hint}</p>}
      {error && <p className="text-[10px] text-[#E5484D] flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftIcon, className, ...props }, ref) => {
    if (leftIcon) {
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]">{leftIcon}</span>
          <input
            ref={ref}
            className={`${error ? inputErrorCls : inputCls} pl-9 ${className ?? ""}`}
            {...props}
          />
        </div>
      );
    }
    return (
      <input
        ref={ref}
        className={`${error ? inputErrorCls : inputCls} ${className ?? ""}`}
        {...props}
      />
    );
  }
);

export function PasswordInput({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={`${error ? inputErrorCls : inputCls} pr-10`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085] transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`${error ? inputErrorCls : inputCls} pr-9 appearance-none cursor-pointer ${className ?? ""}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] pointer-events-none" />
    </div>
  );
}

export function TextAreaField({
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      rows={3}
      className={`${error ? inputErrorCls : inputCls} resize-none`}
      {...props}
    />
  );
}

export function OTPInput({ length = 6, value, onChange }: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          type="text"
          maxLength={1}
          value={d}
          onChange={(e) => {
            const next = [...digits];
            next[i] = e.target.value.replace(/\D/, "");
            onChange(next.join(""));
            if (e.target.value && i < length - 1) {
              const nextInput = document.getElementById(`otp-${i + 1}`);
              nextInput?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              document.getElementById(`otp-${i - 1}`)?.focus();
            }
          }}
          id={`otp-${i}`}
          className="w-11 h-12 text-center text-lg font-bold border border-[#D0D5DD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30 focus:border-[#4F7CFF] transition-all bg-white text-[#101828]"
        />
      ))}
    </div>
  );
}
