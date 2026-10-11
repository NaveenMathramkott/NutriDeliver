import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PERMISSION_GROUPS } from "./adminConstants";

export interface PermissionsFieldProps {
  selected: string[];
  onChange: (permissions: string[]) => void;
}

function toggle(list: string[], permission: string): string[] {
  return list.includes(permission)
    ? list.filter((p) => p !== permission)
    : [...list, permission];
}

/**
 * Multi-select permission picker grouped by resource, with per-group toggles.
 */
export function PermissionsField({
  selected,
  onChange,
}: PermissionsFieldProps) {
  const allSelected = PERMISSION_GROUPS.every((group) =>
    group.permissions.every((p) => selected.includes(p)),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Permissions</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() =>
            onChange(
              allSelected
                ? []
                : PERMISSION_GROUPS.flatMap((g) => g.permissions),
            )
          }
        >
          {allSelected ? "Clear all" : "Select all"}
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
        {PERMISSION_GROUPS.map((group) => {
          const groupSelected = group.permissions.every((p) =>
            selected.includes(p),
          );
          return (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-6 px-0 text-xs"
                  onClick={() =>
                    onChange(
                      groupSelected
                        ? selected.filter((p) => !group.permissions.includes(p))
                        : [
                            ...selected,
                            ...group.permissions.filter(
                              (p) => !selected.includes(p),
                            ),
                          ],
                    )
                  }
                >
                  {groupSelected ? "Clear" : "All"}
                </Button>
              </div>
              <div className="grid gap-1.5">
                {group.permissions.map((permission) => (
                  <label
                    key={permission}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent/60"
                  >
                    <Checkbox
                      checked={selected.includes(permission)}
                      onCheckedChange={() =>
                        onChange(toggle(selected, permission))
                      }
                    />
                    <span className="font-mono text-xs">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
