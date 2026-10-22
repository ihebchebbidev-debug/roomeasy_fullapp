import { Link } from "@tanstack/react-router";
import logo from "@/assets/roomeasy-logo.png";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  inverted = false,
  linked = false,
}: {
  className?: string;
  inverted?: boolean;
  linked?: boolean;
}) {
  const image = (
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
  return linked ? <Link to="/" aria-label="RoomEasy" className="inline-flex shrink-0 items-center">{image}</Link> : image;
}
