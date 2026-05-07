"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const visibleItems = useMemo(() => {
    if (!normalizedQuery) return items;

    return items.filter((item) => {
      const text = `${item.question} ${item.answer}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [items, normalizedQuery]);

  return (
    <div className="faq-panel reveal">
      <label className="faq-search">
        <Search size={19} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по вопросам"
          type="search"
        />
      </label>

      <div className="line-faq" aria-live="polite">
        {visibleItems.map((item) => (
          <details className="reveal faq-filtered-item" key={item.question}>
            <summary><span />{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>

      {visibleItems.length === 0 && (
        <div className="faq-empty">
          <strong>Такого вопроса пока нет</strong>
          <span>Оставьте заявку, и инженер подскажет решение по вашему складу.</span>
        </div>
      )}
    </div>
  );
}
