import Image from "next/image";
import Link from "next/link";
import type { Bike } from "@/data/bikes";

export function BikeCard({ bike }: { bike: Bike }) {
  return (
    <Link href={`/modelos/${bike.slug}`} className="group block text-center">
      <div className="relative mx-auto aspect-[16/10] w-full overflow-hidden bg-[#f7f7f7]">
        <Image
          src={bike.image}
          alt={bike.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <h3 className="mt-4 font-display text-[20px] font-semibold tracking-wide text-honda-ink uppercase">
        {bike.name}
      </h3>
      {bike.color ? (
        <p className="mt-1 text-xs tracking-[0.16em] text-honda-muted uppercase">{bike.color}</p>
      ) : null}
    </Link>
  );
}
