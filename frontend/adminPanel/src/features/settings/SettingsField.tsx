import { TextField, NumberField, SwitchField } from "@/components/form";
import type { SettingFieldDef } from "./settingsSchema";

export interface SettingsFieldProps {
  field: SettingFieldDef;
  value: string | number;
  onChange: (value: string | number) => void;
}

export function SettingsField({ field, value, onChange }: SettingsFieldProps) {
  const description = field.suffix
    ? `${field.description ? `${field.description} ` : ""}(${field.suffix})`
    : field.description;

  if (field.type === "number") {
    return (
      <NumberField
        id={`setting-${field.key}`}
        label={field.label}
        min={0}
        value={Number(value) || 0}
        onValueChange={onChange}
        description={description}
      />
    );
  }

  return (
    <TextField
      id={`setting-${field.key}`}
      label={field.label}
      type={field.type}
      value={String(value ?? "")}
      onValueChange={onChange}
      description={description}
    />
  );
}

export interface ToggleSettingProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ToggleSetting({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: ToggleSettingProps) {
  return (
    <SwitchField
      id={id}
      label={label}
      description={description}
      checked={checked}
      onCheckedChange={onCheckedChange}
    />
  );
}
