"use client";

import { useFormFields } from "@payloadcms/ui";
import { Search } from "lucide-react";
import { createProductSlug } from "@/lib/cms/product-slug";
import "./product-editor.scss";

function stringValue(fields: Record<string, { value?: unknown }>, path: string) {
  const value = fields[path]?.value;
  return typeof value === "string" ? value.trim() : "";
}

export function ProductSeoPreview() {
  const data = useFormFields(([fields]) => ({
    description: stringValue(fields, "seoDescription") || stringValue(fields, "summary"),
    title: stringValue(fields, "seoTitle") || stringValue(fields, "title")
  }));
  const title = data.title || "Название товара | КБ Парус";
  const description =
    data.description ||
    "Короткое и понятное описание товара появится здесь после заполнения основных полей.";
  const slug = createProductSlug(data.title || "nazvanie-tovara");

  return (
    <section className="product-seo-preview" aria-label="Предварительный вид карточки в поиске">
      <div className="product-seo-preview__head">
        <Search size={17} />
        <div>
          <strong>Как страница может выглядеть в поиске</strong>
          <span>Предпросмотр обновляется вместе с полями ниже</span>
        </div>
      </div>
      <div className="product-seo-preview__result">
        <span>КБ Парус · Системы хранения металла</span>
        <small>metalstorage.ru › catalog › категория › {slug}</small>
        <b>{title.slice(0, 68)}</b>
        <p>{description.slice(0, 160)}</p>
      </div>
    </section>
  );
}
