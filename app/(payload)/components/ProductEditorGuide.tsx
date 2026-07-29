"use client";

import { useFormFields } from "@payloadcms/ui";
import { CheckCircle2, Images, ListChecks, SearchCheck, Sparkles } from "lucide-react";
import { createProductSlug } from "@/lib/cms/product-slug";
import "./product-editor.scss";

function fieldValue(fields: Record<string, { value?: unknown }>, path: string) {
  const value = fields[path]?.value;
  return typeof value === "string" ? value.trim() : "";
}

export function ProductEditorGuide() {
  const title = useFormFields(([fields]) => fieldValue(fields, "title"));
  const generatedSlug = createProductSlug(title || "название-товара");

  return (
    <section className="product-editor-guide" aria-label="Как заполнить карточку товара">
      <div className="product-editor-guide__intro">
        <span><Sparkles size={17} /> Новая карточка товара</span>
        <strong>Заполните по порядку — технические поля сайт настроит сам</strong>
        <p>
          Начните с названия и категории. Адрес страницы будет создан автоматически и не требует
          знаний SEO или программирования.
        </p>
      </div>

      <ol className="product-editor-guide__steps">
        <li><CheckCircle2 size={17} /><span><b>1. Описание</b><small>Что это и для кого</small></span></li>
        <li><Images size={17} /><span><b>2. Фото</b><small>Главное + разные ракурсы</small></span></li>
        <li><ListChecks size={17} /><span><b>3. Данные</b><small>Цена и характеристики</small></span></li>
        <li><SearchCheck size={17} /><span><b>4. Публикация</b><small>Проверка вида в поиске</small></span></li>
      </ol>

      <div className="product-editor-guide__url">
        <span>Адрес создастся автоматически</span>
        <code>/catalog/категория/{generatedSlug}</code>
      </div>
    </section>
  );
}
