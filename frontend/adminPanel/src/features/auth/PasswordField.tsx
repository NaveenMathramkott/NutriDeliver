import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form";
import { fieldProps, useFieldControl } from "@/components/form/fieldControl";
import { cn } from "@/lib/utils";

export interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
}

/**
 * Password input with a show/hide toggle. Used by the login form and any
 * other screen that collects a password.
 */
export function PasswordField({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  required,
  disabled,
  autoComplete = "current-password",
  className,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const control = useFieldControl();

  return (
    <FormField id={id} label={label} required={required} className={className}>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          {...fieldProps(control)}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="pl-10 pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded",
          )}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </FormField>
  );
}

export interface IconInputProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
}

/** Text input with a leading icon, e.g. the email field on the login form. */
export function IconInput({
  id,
  label,
  icon,
  value,
  onValueChange,
  placeholder,
  type = "text",
  required,
  disabled,
  autoComplete,
  className,
}: IconInputProps) {
  const control = useFieldControl();

  return (
    <FormField id={id} label={label} required={required} className={className}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input
          {...fieldProps(control)}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="pl-10"
        />
      </div>
    </FormField>
  );
}
