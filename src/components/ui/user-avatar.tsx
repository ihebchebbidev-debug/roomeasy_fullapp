import { UserRound } from "lucide-react";
import { useState } from "react";

import { mediaUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, src, className }: { name: string; src?: string | null | undefined; className?: string }) {
  const [failed, setFailed] = useState(false);
  const resolved = mediaUrl(src);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-primary", className)}>
      {resolved && !failed ? <img src={resolved} alt={name} className="size-full object-cover" onError={() => setFailed(true)} /> : initials ? <span className="text-[0.34em] font-bold" aria-label={name}>{initials}</span> : <UserRound className="size-1/2" aria-label={name} />}
    </span>
  );
}