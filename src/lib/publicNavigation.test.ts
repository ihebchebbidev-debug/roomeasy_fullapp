import { expect, test } from "bun:test";
import { authDestination, visibleNavigation } from "./publicNavigation";
import { destinationOptions, matchingDestinations } from "./destinations";

test("signed-out visitors cannot see My trips or private workspace links", () => {
  expect(visibleNavigation([{ to: "/stays" }, { to: "/trips" }, { to: "/messages" }, { to: "/host" }, { to: "/list-your-place" }], false).map((i) => i.to)).toEqual(["/stays", "/list-your-place"]);
});
test("signed-in members retain My trips", () => {
  expect(visibleNavigation([{ to: "/trips" }], true)).toEqual([{ to: "/trips" }]);
});
test("listing entry returns to listing creation after sign-in or signup", () => {
  expect(authDestination("/list-your-place", "guest", false)).toBe("/list-your-place");
  expect(authDestination("/list-your-place", "guest", true)).toBe("/list-your-place");
  expect(authDestination("/list-your-place?edit=abc", "admin", false)).toBe("/list-your-place?edit=abc");
});
test("post-login navigation rejects external URLs and guest admin returns", () => {
  expect(authDestination("//evil.example", "guest", false)).toBe("/");
  expect(authDestination("/admin", "guest", false)).toBe("/");
});
test("Portugal is suggested without any loaded stay records", () => {
  expect(matchingDestinations(destinationOptions("en"), "Portugal").map((o) => o.value)).toContain("Portugal");
});
test("destination matching accepts accents and localized country names", () => {
  expect(matchingDestinations(destinationOptions("fr"), "Allemagne")[0]?.value).toBe("Germany");
  expect(matchingDestinations(destinationOptions("en", [], [{ name: "Évry", country: "France", active: true }]), "evry")[0]?.value).toBe("Évry");
});
test("inactive destinations are excluded", () => {
  expect(destinationOptions("en", [{ code: "PT", name: "Portugal", active: false }], [{ name: "Lisbon", country: "Portugal", active: false }])).toEqual([]);
});