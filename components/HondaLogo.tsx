import Image from "next/image";
import Link from "next/link";
import { LOGO } from "@/data/site";

type HondaLogoProps = {
  className?: string;
  priority?: boolean;
};

export function HondaLogo({ className = "", priority }: HondaLogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="Honda The Power of Dreams">
      <Image
        src={LOGO}
        alt="Honda The Power Of Dreams"
        width={900}
        height={135}
        priority={priority}
        className="h-auto w-[min(420px,86vw)] object-contain"
      />
    </Link>
  );
}
