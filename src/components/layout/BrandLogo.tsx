import logo from "@/assets/roomeasy-logo.png";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <img
      src={logo}
      alt="RoomEasy"
      width={1182}
      height={800}
      className={cn(
        "h-12 w-auto object-contain object-left",
        inverted && "brightness-0 invert",
        className,
      )}
    />
  );
}
