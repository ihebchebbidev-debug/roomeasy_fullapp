# Pricing engine, multilingual SEO, and currencies

## What the code already has
- **Smart auto-pricing:** most of this is already built. The pricing engine handles manual overrides, seasons, weekends, occupancy, early-bird and last-minute discounts, gap nights, and a price floor and ceiling. The host dashboard has a Smart Pricing panel, and the server uses these rules when it charges a booking. Nothing new needs building here. The work is checking it end to end and fixing any gaps.
- **Guest display currency:** there's a currency switcher (EUR, USD, GBP, CHF, BRL) that uses live exchange rates. It falls back to euros if rates can't be loaded.
- **SEO:** the home page and listing pages already have structured data, and there's a sitemap. There are no language-specific web addresses, the page language is always marked as English, and the sitemap doesn't list other languages.
- **Host listing currency:** this is missing. Every listing is priced in euros, and hosts can't pick another currency.

## 1. Smart pricing: check and finish
- Book a real test stay and confirm each rule changes the price shown in checkout (weekend, season, last-minute, occupancy, floor).
- Confirm the price the guest sees matches what the server charges. The pricing-parity check covers this.
- Fix any rule that is saved but ignored. Make sure the panel explains the order rules apply in (already written in the engine), in all 4 languages.

## 2. Language-specific web addresses and SEO
- Add a language prefix to every public web address: `/en/...`, `/fr/...`, `/de/...`, `/es/...`, `/pt/...`. The plain `/` address sends visitors to the language their browser prefers.
- The language switcher changes the web address, so each language can be shared and indexed on its own.
- Each page gets the correct page language, links pointing to its versions in other languages (`hreflang` plus `x-default`), and a canonical address.
- The sitemap lists every page in every language, with links between the language versions.
- Structured data: listings get `LodgingBusiness`, with price and currency and a rating where one exists. Add `BreadcrumbList` on listings and search, and `Organization` plus `WebSite` (with site search) on the home page. All of it in the page's language.

## 3. Currencies
- **Host listing currency:** hosts pick a currency for each listing (EUR, USD, GBP, CHF, BRL). They enter their prices, cleaning fee and price floor in that currency.
- **Guest display:** every price is converted from the listing's own currency into the currency the guest picked, using daily rates. A small "charged in X" note appears at checkout.
- **Charging:** the booking stores the listing's currency, the amount, and the exchange rate on the day of booking, so receipts and host payouts never change afterwards.
- **Admin finance:** totals are grouped by currency and also shown converted to EUR.
- Existing listings stay in EUR, so nothing changes for them.

## Technical details
- Add `currency char(3) default 'EUR'` to listings. Bookings get `currency` and `fx_rate_to_eur`. Some defaults in the server registry still say `'USD'` and need changing to `'EUR'`.
- Both copies of the pricing code (`domain/pricing.ts` and `lib/pricing.ts`) work in the listing's currency. The parity script gets extra test cases for this.
- Language-prefixed pages use an optional `{-$lang}` segment in TanStack Router, and `head()` builds the alternate-language links from one helper in `lib/seo.ts`.
- Changes to the separate server only go live after you redeploy it. This is already an open blocker on the roadmap.

## Decision needed
When a listing is priced in GBP, should the guest pay in GBP, or should we convert and always charge in EUR? The plan assumes the guest pays in the listing's currency. Tell me if you want EUR only.
