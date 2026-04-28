"use client";

import { useState } from "react";
import { productCategories } from "@/data/storageSystems/productCategories";
import { solutionVisuals } from "@/data/storageSystems/visualAssets";

export function SolutionsShowcase() {
  const [activeId, setActiveId] = useState(productCategories[0].id);
  const active = productCategories.find((item) => item.id === activeId) ?? productCategories[0];
  const image = solutionVisuals[active.id] ?? solutionVisuals.cassette;

  return (
    <section className="section solutions-showcase reveal" id="solutions">
      <div className="section-heading wide">
        <span className="eyebrow">Системы хранения</span>
        <h2>Не один стеллаж, а набор решений под разные материалы и сценарии склада</h2>
        <p>Тип системы выбирается по материалу, весу, частоте доступа, технике загрузки и ограничениям помещения.</p>
      </div>

      <div className="solution-tabs" role="tablist" aria-label="Типы систем хранения">
        {productCategories.map((category) => (
          <button
            className={category.id === active.id ? "is-active" : ""}
            key={category.id}
            type="button"
            onClick={() => setActiveId(category.id)}
          >
            {category.title}
          </button>
        ))}
      </div>

      <div className="solution-stage">
        <div className="solution-photo">
          <img src={image} alt={active.title} />
        </div>
        <div className="solution-copy">
          <span className="eyebrow">Активное решение</span>
          <h3>{active.title}</h3>
          <p>{active.summary}</p>
          <div className="tag-row">
            {active.fitFor.map((item) => <span key={item}>{item}</span>)}
          </div>
          <ul className="spec-list">
            {active.typicalSpecs.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <a className="primary-button" href="#calculator">Подобрать конфигурацию</a>
        </div>
      </div>
    </section>
  );
}
