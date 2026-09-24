import { Check } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { equipmentByGroup, equipmentGroupLabel, equipmentLabel, findEquipment, useEquipmentVersion } from "@/data/equipment";
import { useClientCopy } from "@/i18n/clientCopy";
import { useLanguage } from "@/i18n/LanguageProvider";

/** Guest-facing equipment & services, grouped by theme. */
export function EquipmentList({ ids }: { ids: string[] }) {
  const { locale } = useLanguage();
  const cc = useClientCopy();
  const [showAll, setShowAll] = useState(false);

  const catalogueVersion = useEquipmentVersion();
  const groups = useMemo(
    () => equipmentByGroup(ids.map(findEquipment).filter((item): item is NonNullable<typeof item> => Boolean(item))),
    [ids, catalogueVersion],
  );

  if (groups.length === 0) return null;
  const visible = showAll ? groups : groups.slice(0, 3);

  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{cc.equipment}</h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        {visible.map(({ group, items }) => (
          <section key={group}>
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {equipmentGroupLabel(group, locale)}
            </p>
            <ul className="mt-3 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
                  <span>
                    {equipmentLabel(item, locale)}
                    {item.paid ? (
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                        {cc.paid}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {groups.length > 3 ? (
        <Button
          variant="link"
          className="mt-4 h-auto px-0 text-sm font-semibold underline"
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll ? cc.showLess : cc.showAll}
        </Button>
      ) : null}
    </div>
  );
}
