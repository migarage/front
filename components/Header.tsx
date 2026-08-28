"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/data/site";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="flex justify-center px-4 py-4 sm:py-5">
        <Link href="/" aria-label="Inicio">
          <Image
            src="/banner.png"
            alt="riBer — Howe move you"
            width={1024}
            height={150}
            priority
            className="h-auto w-[min(480px,90vw)] object-contain"
          />
        </Link>
      </div>

      <nav
        className="no-scrollbar flex overflow-x-auto border-b border-white"
        aria-label="Secciones"
      >
        {SECTIONS.map((s) => {
          const active = pathname === s.href || pathname.startsWith(s.href + "/");
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`flex min-h-[50px] flex-1 basis-1/4 items-center justify-center border-r border-[#444] px-2 text-center text-[10px] font-semibold tracking-[0.08em] text-white uppercase transition-colors duration-200 last:border-r-0 sm:min-h-[54px] sm:text-[12px] md:text-[13px] ${
                active ? "bg-[#CC0000]" : "bg-black hover:bg-[#CC0000]"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>
      <div className="h-[3px] bg-[#CC0000]" />
    </header>
  );
}
