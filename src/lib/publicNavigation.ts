/** Public entry points must not send visitors into a private workspace. */
export function visibleNavigation<T extends { to: string }>(items: readonly T[], signedIn: boolean): T[] {
  return items.filter((item) => signedIn || !["/trips", "/messages", "/favourites", "/profile", "/host", "/admin"].includes(item.to));
}

export function authDestination(returnTo: string | undefined, role: string, created: boolean): string {
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.startsWith("/admin") && (!created || returnTo.startsWith("/list-your-place"))) return returnTo;
  return role === "admin" ? "/admin" : "/";
}