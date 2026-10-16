import { query } from "@/db/query.js";
import { EQUIPMENT_SEED } from "@/db/seed-data.js";

/**
 * Upserts the amenity catalogue the listing form validates against.
 * Idempotent, so it is safe to run on every boot. Spanish, German and
 * Portuguese labels are only filled when still empty, so an admin's own
 * wording from the Amenities screen is never overwritten.
 */
export async function syncEquipmentCatalogue(): Promise<number> {
  for (const item of EQUIPMENT_SEED) {
    await query(
      `INSERT INTO equipment (id, "group", label_en, label_fr, label_es, label_de, label_pt, paid, active)
       VALUES ($1, $2::equipment_group, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (id) DO UPDATE
         SET "group" = EXCLUDED."group",
             label_en = EXCLUDED.label_en,
             label_fr = EXCLUDED.label_fr,
             label_es = COALESCE(NULLIF(equipment.label_es, ''), EXCLUDED.label_es),
             label_de = COALESCE(NULLIF(equipment.label_de, ''), EXCLUDED.label_de),
             label_pt = COALESCE(NULLIF(equipment.label_pt, ''), EXCLUDED.label_pt),
             paid = EXCLUDED.paid,
             active = true`,
      [item.id, item.group, item.labelEn, item.labelFr, item.labelEs, item.labelDe, item.labelPt, item.paid ?? false],
      { label: "equipment.sync" },
    );
  }
  return EQUIPMENT_SEED.length;
}
