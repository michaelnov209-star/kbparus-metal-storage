import { ArrowDown, Star } from "lucide-react";
import "./product-editor.scss";

export function FeaturedPlacementGuide() {
  return (
    <section className="featured-placement-guide" aria-label="Пример размещения рекомендуемого товара">
      <div>
        <span><Star size={16} fill="currentColor" /> Что изменит этот переключатель</span>
        <strong>Товар поднимется в начало своей категории</strong>
        <p>
          Используйте для одной–двух приоритетных моделей. Остальные товары сохранят обычный порядок.
        </p>
      </div>
      <div className="featured-placement-guide__mock" aria-hidden="true">
        <div className="is-featured"><i /><b>Рекомендуемый товар</b><small>первая карточка</small></div>
        <ArrowDown size={18} />
        <div><i /><b>Обычный товар</b><small>следом по порядку</small></div>
      </div>
    </section>
  );
}
