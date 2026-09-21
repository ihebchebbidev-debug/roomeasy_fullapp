import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyTurnstileToken = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const secret = process.env["CLOUDFLARE_TURNSTILE_SECRET"];

    // No real key configured: the widget is decorative, so skip the round-trip
    // to Cloudflare entirely instead of making the user wait for it.
    if (!secret) return { success: true };

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: data.token }),
      },
    );

    const result = (await response.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!result.success) {
      throw new Error(
        `Turnstile verification failed: ${result["error-codes"]?.join(", ") ?? "unknown error"}`,
      );
    }

    return { success: true };
  });
