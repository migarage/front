"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HERO_SLIDES } from "@/data/bikes";

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  const go = (direction: -1 | 1) => {
    setIndex((current) => (current + direction + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <section className="relative overflow-hidden bg-black">
      <div className="relative aspect-[16/7] min-h-[280px] w-full sm:min-h-[360px] lg:min-h-[520px]">
        {HERO_SLIDES.map((slide, slideIndex) => (
          <Link
            key={slide.src}
            href={slide.href}
            className={`absolute inset-0 transition-opacity duration-700 ${
              slideIndex === index ? "opacity-100" : "opacity-0"
            }`}
            tabIndex={slideIndex === index ? 0 : -1}
            aria-hidden={slideIndex !== index}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={slideIndex === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        className="absolute top-1/2 left-3 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:left-6"
        aria-label="Slide anterior"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        className="absolute top-1/2 right-3 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:right-6 lg:right-16"
        aria-label="Slide siguiente"
      >
        ›
      </button>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {HERO_SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Ir al slide ${slideIndex + 1}`}
            onClick={() => setIndex(slideIndex)}
            className={`h-2.5 w-2.5 rounded-full ${
              slideIndex === index ? "bg-honda-red" : "bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
