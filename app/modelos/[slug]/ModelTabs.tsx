"use client";

import { useState } from "react";
import type { Bike } from "@/data/bikes";

const TABS = ["Diseño", "Tecnología", "Detalles", "Motor"] as const;

export function ModelTabs({ bike }: { bike: Bike }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Diseño");

  const content =
    tab === "Diseño"
      ? { title: bike.tagline, text: bike.description }
      : tab === "Tecnología"
        ? bike.highlights[1] ?? bike.highlights[0]
        : tab === "Detalles"
          ? bike.highlights[0]
          : bike.highlights[bike.highlights.length - 1];

  return (
    <section className="border-y border-honda-line bg-white">
      <div className="honda-container">
        <div className="no-scrollbar flex gap-8 overflow-x-auto">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`shrink-0 border-b-2 py-4 font-display text-[13px] font-semibold tracking-[0.16em] uppercase ${
                tab === item
                  ? "border-honda-red text-honda-red"
                  : "border-transparent text-honda-gray"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="max-w-3xl py-10">
          <h2 className="font-display text-3xl font-semibold">{content.title}</h2>
          <p className="mt-4 text-base leading-7 text-honda-gray">{content.text}</p>
        </div>
      </div>
    </section>
  );
}
