/**
 * Guards the two copies of the smart pricing engine (website preview and
 * server) against drifting apart. Run: `bun scripts/check-pricing-parity.ts`.
 * Exits with code 1 when the code or the computed prices differ.
 */
import { readFileSync } from "node:fs";

import * as web from "../src/lib/smartPricingEngine";
import * as server from "../nodejs_backend/src/domain/smartPricingEngine";

const strip = (path: string) =>
  readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim();

let failed = false;
if (strip("src/lib/smartPricingEngine.ts") !== strip("nodejs_backend/src/domain/smartPricingEngine.ts")) {
  console.error("✗ The two smartPricingEngine.ts files differ in code.");
  failed = true;
}

// Behavioural check over a spread of rule sets and nights.
const rules = web.defaultSmartPricingRules();
const variants = [rules, { ...rules, enabled: true }] as unknown as web.SmartPricingRules[];
const nights: web.NightContext[] = [];
for (let i = 0; i < 60; i += 1) {
  const d = new Date(Date.UTC(2026, 0, 1 + i * 6));
  nights.push({ date: d.toISOString().slice(0, 10), basePrice: 80 + i * 3, overridePrice: i % 7 === 0 ? 150 : null, daysAhead: i * 5 - 10, occupancyPercent: i % 3 === 0 ? null : (i * 7) % 100, isGapNight: i % 5 === 0 });
}
for (const variant of variants) {
  const a = JSON.stringify(web.computeSmartPricing(variant, nights));
  const b = JSON.stringify(server.computeSmartPricing(variant as never, nights as never));
  if (a !== b) {
    console.error("✗ The two engines compute different prices.");
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("✓ Both pricing engines are identical.");
