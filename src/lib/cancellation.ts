import type { clientCopy } from "@/i18n/clientCopy";
import type { CancellationPolicy } from "@/models/property";

type Copy = (typeof clientCopy)["en"];

export const cancellationPolicies: CancellationPolicy[] = ["flexible", "moderate", "strict"];

export function cancellationLabel(policy: CancellationPolicy, cc: Copy): string {
  if (policy === "flexible") return cc.policyFlexible;
  if (policy === "strict") return cc.policyStrict;
  return cc.policyModerate;
}

export function cancellationText(policy: CancellationPolicy, cc: Copy): string {
  if (policy === "flexible") return cc.policyFlexibleText;
  if (policy === "strict") return cc.policyStrictText;
  return cc.policyModerateText;
}

/**
 * Share of the total that is refunded when a stay is cancelled `days`
 * before check-in, following the host's chosen policy.
 */
export function refundShare(policy: CancellationPolicy, daysBeforeCheckIn: number): number {
  if (policy === "flexible") return daysBeforeCheckIn >= 1 ? 1 : 0;
  if (policy === "moderate") return daysBeforeCheckIn >= 5 ? 1 : 0.5;
  return 0;
}
