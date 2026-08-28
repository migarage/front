"use client";

import { useMemo, useState } from "react";
import { BIKES, CATEGORIES, type CategoryId } from "@/data/bikes";
import { BikeCard } from "./BikeCard";

export function Catalog() {
  const [active, setActive] = useState<CategoryId>("scooter");

  const bikes = useMemo(
    () => BIKES.filter((bike) => bike.category === active),
    [active],
  );

  return (
    <section id="catalogo" className="bg-white py-10 sm:py-14">
      <div className="honda-container">
        <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-honda-line">
          {CATEGORIES.map((category) => {
            const selected = category.id === active;
            return (
              <button
                key={category.id}
                id={category.id}
                type="button"
                onClick={() => setActive(category.id)}
                className={`shrink-0 border-b-2 pb-3 font-display text-[13px] font-semibold tracking-[0.16em] uppercase transition-colors ${
                  selected
                    ? "border-honda-red text-honda-red"
                    : "border-transparent text-honda-gray hover:text-honda-ink"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.map((bike) => (
            <BikeCard key={bike.slug} bike={bike} />
          ))}
        </div>
      </div>
    </section>
  );
}
