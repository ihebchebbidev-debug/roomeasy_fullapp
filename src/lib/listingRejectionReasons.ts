/**
 * The fixed list of reasons a moderator can pick when refusing a listing.
 * Mirrors `nodejs_backend/src/modules/admin/rejectionReasons.ts` — keep both in sync.
 */
export const LISTING_REJECTION_REASONS = [
  { code: "photos_insufficient", label: "Photos missing, too few, or of poor quality" },
  { code: "description_incomplete", label: "Description incomplete or not informative enough" },
  { code: "address_invalid", label: "Address or location is inaccurate" },
  { code: "price_unrealistic", label: "Price is unrealistic for this listing" },
  { code: "duplicate_listing", label: "Duplicate of an existing listing" },
  { code: "prohibited_content", label: "Contains prohibited or offensive content" },
  { code: "contact_details", label: "Contains contact details or off-platform booking" },
  { code: "not_compliant", label: "Does not meet legal or safety requirements" },
  { code: "other", label: "Other reason (explained below)" },
] as const;

export type ListingRejectionCode = (typeof LISTING_REJECTION_REASONS)[number]["code"];
