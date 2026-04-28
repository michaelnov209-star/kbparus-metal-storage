# КБ Парус: системы хранения металла

MVP современного B2B-сайта для подбора систем хранения металла. Проект построен как фундамент для боевого продукта: данные вынесены из компонентов, расчётная логика отделена от UI, заявка готовится в структуре, пригодной для Bitrix24, CMS и 1С.

## Запуск

```bash
npm install
npm run dev
```

Проверка:

```bash
npm run test
npm run build
```

## Архитектура

- `app` — Next.js App Router, страница и API заявки.
- `components` — визуальные компоненты и интерактивный калькулятор.
- `data/storageSystems` — продуктовые категории, оборудование, опции, коэффициенты, SEO, FAQ, кейсы, конкурентные референсы.
- `lib/calculator` — нормализованный расчёт: рекомендация системы, коэффициенты, диапазон стоимости, форматирование и валидация.
- `tests` — unit-тесты расчётной логики.

## Данные и будущая CMS

Контент и справочники не захардкожены в компонентах. В будущем файлы `data/storageSystems/*` можно заменить адаптером Payload CMS, Directus или Strapi. Ключевые сущности уже разделены:

- `equipment` — `product_id`, `sku`, `external_1c_id`, тип изделия, НДС, цена, вес, габариты, нагрузка.
- `productCategories` — группы решений и сценарии применения.
- `calculatorOptions` — справочники формы калькулятора.
- `priceFactors` — коэффициенты, перенесённые из Excel-модели.
- `referenceLinks` — аналоги и конкуренты из Excel и конкурентного анализа.
- `marketInsights` — фишки рынка и ошибки, которые не повторяем.

## Калькулятор

Калькулятор не обещает точную цену. Он возвращает предварительную оценку и диапазон:

```ts
dimensionFactor = heightFactor * widthFactor * lengthFactor
shelfPrice = baseShelfPrice * dimensionFactor * loadFactor
towerPrice = baseTowerPrice * shelvesPerTowerFactor * towerCount
cassettePrice = cassetteBasePrice * cassetteCount * dimensionFactor * loadFactor
preliminaryPrice = shelfPrice + towerPrice + cassettePrice + optionsPrice
priceRange = preliminaryPrice ± 12–18%
```

## Bitrix24

`POST /api/leads` принимает контакт, город, комментарий, UTM-метки, параметры калькулятора, рекомендованную конфигурацию и диапазон стоимости.

Если `BITRIX24_WEBHOOK_URL` не задан, API работает в mock-режиме и возвращает подготовленный payload. Если переменная задана, payload отправляется в Bitrix24.

## 1С

Для будущей интеграции предусмотрены нормальные числовые поля и идентификаторы: `product_id`, `sku`, `external_1c_id`, `price_net`, `price_gross`, `vat_rate`, `weight_kg`, `dimensions_mm`, `product_type`.
