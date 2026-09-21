import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  equipmentByGroup,
  equipmentGroupLabel,
  equipmentLabel,
  searchEquipment,
} from "@/data/equipment";
import { useClientCopy } from "@/i18n/clientCopy";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * Host-side equipment & services picker: one search box over the whole
 * catalogue, then a yes/no switch per item grouped by theme.
 */
export function EquipmentEditor({
  selected,
  onChange,
  idPrefix,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  idPrefix: string;
}) {
  const { locale } = useLanguage();
  const cc = useClientCopy();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => equipmentByGroup(searchEquipment(query)), [query]);

  const toggle = (id: string, on: boolean) => {
    onChange(on ? [...new Set([...selected, id])] : selected.filter((item) => item !== id));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-bold">{cc.equipment}</h3>
          <p className="text-xs text-muted-foreground">{cc.equipmentHint}</p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {cc.equipmentSelected.replace("{n}", String(selected.length))}
        </Badge>
      </div>

      <div className="relative mt-4">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={cc.equipmentSearch}
          aria-label={cc.equipmentSearch}
          className="pl-9"
        />
      </div>

      {groups.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{cc.equipmentEmpty}</p>
      ) : (
        <div className="mt-4 max-h-96 space-y-5 overflow-y-auto rounded-xl border border-border p-4">
          {groups.map(({ group, items }) => (
            <section key={group}>
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {equipmentGroupLabel(group, locale)}
              </p>
              <ul className="mt-2 divide-y divide-border">
                {items.map((item) => {
                  const id = `${idPrefix}-${item.id}`;
                  const on = selected.includes(item.id);
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                      <label htmlFor={id} className="min-w-0 text-sm">
                        <span>{equipmentLabel(item, locale)}</span>
                        {item.paid ? (
                          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                            {cc.paid}
                          </span>
                        ) : null}
                      </label>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {on ? cc.yes : cc.no}
                        </span>
                        <Switch id={id} checked={on} onCheckedChange={(value) => toggle(item.id, value)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
