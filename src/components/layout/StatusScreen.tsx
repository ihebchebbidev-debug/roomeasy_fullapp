import type { ReactNode } from "react";

/**
 * Full-page state for "not found", "under review" and error screens.
 * Soft brand-tinted backdrop with a centred card so these pages feel as
 * finished as the rest of the site.
 */
export function StatusScreen({
  icon,
  eyebrow,
  title,
  text,
  actions,
}: {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  text?: string;
  actions?: ReactNode;
}) {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-16">
      {/* backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-background to-background" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--primary) 22%, transparent) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <section className="w-full max-w-lg rounded-3xl border border-border/70 bg-card/85 p-8 text-center shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--primary)_35%,transparent)] backdrop-blur-xl sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
          {icon}
        </div>
        {eyebrow ? (
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className={`${eyebrow ? "mt-2" : "mt-6"} font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl`}>
          {title}
        </h1>
        {text ? <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">{text}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
      </section>
    </main>
  );
}
