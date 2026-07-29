# Техническая спецификация изображений: ручные системы хранения листового металла

Дата аудита: 29.07.2026
Охват: `catalogDepth.ts`, продукты `forklift-cassette-rack` — `depalletizer`, изображения `2.1.png` — `2.9.png`, общий кадр `manual-sheet-racks-in-action.png`, категория `02-manual-sheet-metal.png`.

## Результат аудита

| ID | Текущий файл | Вердикт | Главная причина |
|---|---|---|---|
| `forklift-cassette-rack` | `2.1.png` | Переделать | Похож на выкатные полки; не показаны съёмные кассеты и карманы под вилы погрузчика. |
| `rollout-cassette-rack` | `2.2.png` | Переделать | Одновременно выдвинуто несколько кассет; нет ясной блокировки и правдоподобной опоры выдвинутого уровня. |
| `hybrid-rollout-rack` | `2.3.png` | Переделать | Смешаны непроверенные механизмы; верх не читается как кассеты под погрузчик, встроенная крановая система выглядит вымышленной. |
| `two-side-rollout-rack` | `2.4.png` | Переделать | Несколько уровней выдвинуты в обе стороны; это создаёт визуально опасный сценарий опрокидывания. |
| `vertical-rollout-cassette` | `2.5.png` | Переделать с сохранением идеи | Тип изделия узнаваем, но выдвинутую раму визуально держит один ролик; не читаются две направляющие, верхнее ведение и удержание листа. |
| `vertical-stationary` | `2.6.png` | Переделать или сузить товар до стационарного исполнения | Похоже на стационарный секционный стеллаж, но не может одновременно показывать заявленное передвижное исполнение; назначение без листов читается слабо. |
| `pyramid-vertical` | `2.7.png` | Переделать с сохранением A-образной схемы | Силуэт правдоподобен, но отсутствуют опорные прокладки, нижние упоры и фиксация листов; проушины могут ошибочно обещать подъём загруженной конструкции. |
| `shelves-manual-sheet` | `2.8.png` | Переделать полностью | Показана одиночная кассета на роликах, а не полочный стеллаж. |
| `depalletizer` | `2.9.png` | Переделать полностью после выбора типа изделия | Кадр не показывает ни пассивный штыревой депаллетайзер, ни автоматический поштучный разделитель/податель. |
| Общий action | `manual-sheet-racks-in-action.png` | Убрать из общих галерей | Подходит только к горизонтальному выкатному стеллажу; стропы касаются острых кромок без видимой защиты. |
| Категория | `02-manual-sheet-metal.png` | Переделать | Показан один тип стеллажа и несколько выдвинутых кассет, а категория должна объединять несколько разных продуктов. |

Ни одно изображение не следует публиковать как технически подтверждённое до проверки инженером КБ Парус. Ниже дан эталонный визуальный стандарт, основанный на реальных конструкциях производителей, но он не заменяет рабочие чертежи и расчёт несущей способности.

## Общие требования к любому новому изображению

### Обязательная механическая логика

1. В кадре должен читаться непрерывный путь нагрузки: листы → кассета/полка/рама → ролики или опорные балки → стойки → опорные пластины → пол.
2. Все тяжёлые стационарные стеллажи показывать с реалистичными опорными пластинами и анкерами. Не рисовать «парящие» стойки и декоративные винтовые ножки вместо промышленного основания.
3. У выкатных систем одновременно выдвинут только один уровень в одной секции. Инструкция Plastixs прямо требует выдвигать по одной полке на секцию; изображение не должно нормализовать опасный сценарий.
4. Выдвинутый уровень должен иметь физически понятную поддержку: колёса/ролики на рельсах, опорную раму, консоль, рассчитанную изготовителем, либо иной видимый механизм. Один случайный ролик под многотонной рамой недопустим.
5. Лист не должен стоять вертикально без нижнего упора, бокового/верхнего удержания или безопасного угла опирания.
6. Не добавлять к изделию кран-балку, вакуумный захват, мотор, гидравлику, датчики или ограждение, если они не входят в продаваемую комплектацию. В action-кадре внешнее оборудование должно визуально оставаться внешним.
7. Не показывать грузоподъёмность цифрами, маркировками или количеством листов, если она не подтверждена расчётом конкретной модели.
8. Вилы погрузчика входят только в предусмотренные закрытые карманы/туннели кассеты, полностью и симметрично. Они не касаются пакета листа.
9. В подъёмных сценах никто не находится под грузом или в зоне его возможного падения. Стропы на острых кромках должны иметь видимую защиту; предпочтительный образ для одного листа — специализированный вакуумный или магнитный захват.
10. На изображении не должно быть одновременно несовместимых операций: погрузчик вытаскивает кассету, оператор выдвигает другую, а кран снимает лист.

### Единый визуальный стиль

- Фотореалистичная промышленная визуализация, без «концепт-арта».
- Несущая рама: графитовый/чёрный металл.
- Подвижные и съёмные элементы: фирменный оранжевый `#fc5413`.
- Реальные сварные и болтовые соединения, одинаковые профили в одинаковых узлах.
- Студийный кадр: нейтральный светло-серый фон, камера на высоте 1,4–1,7 м, ракурс 3/4, без сверхширокоугольных искажений.
- Action-кадр: чистый современный металлообрабатывающий цех, правдоподобный масштаб, СИЗ, свободные проходы.
- Никаких брендов конкурентов, текста, водяных знаков, случайных предупреждающих наклеек и выдуманных панелей управления.
- В студийном кадре изделие занимает 70–82% площади; вся опорная база и край выдвинутого элемента входят в кадр.
- Для каждой карточки нужны самостоятельные кадры конкретного товара. Фото категории никогда не используется в галерее товара.

### Общий базовый prompt

```text
Photorealistic engineering-accurate industrial product visualization. Graphite-black structural steel main frame, safety-orange #fc5413 only on moving or removable components. Real welded and bolted joints, realistic rectangular steel sections, coherent load paths, visible industrial floor anchors where required, true-to-scale 3000 x 1500 mm sheet-metal proportions. Three-quarter eye-level camera, neutral light-gray studio, soft controlled lighting, sharp technical detail, no text, no logo, no competitor branding, no decorative machinery, no impossible geometry, no floating parts, no duplicated mechanisms, no sci-fi components.
```

### Общий negative prompt

```text
multiple drawers extended, two drawers moving at once, unsupported cantilevered load, single tiny caster under a multi-ton drawer, bent rails, discontinuous beams, fake hydraulics, decorative cables, random lifting eyes, forklift forks touching sheet metal, people under suspended loads, worker inside crush zone, unprotected fabric slings over sharp sheet edges, category collage inside a product image, mixed product types, extra crane integrated into the rack, impossible fasteners, warped sheet packs, ambiguous scale
```

## 2.1. Кассетный стеллаж под погрузчик

### Реальная конструкция

Это стационарная несущая башня с горизонтальными ячейками и полностью съёмными кассетами. Каждая кассета имеет интегрированные трубчатые карманы под вилы; они принимают вилы и защищают лист от контакта с ними. Кассета переносится погрузчиком целиком. Это не выкатной ящик на колёсах.

### Studio view

- Мощная анкерованная рама с 5–8 визуально различимыми ячейками.
- Все кассеты находятся внутри; одну пустую кассету можно поставить рядом на полу, чтобы показать два закрытых вилочных туннеля и боковые упоры.
- Кассеты плоские, жёсткие, с равномерными поперечинами под пакет листа.
- Направляющие и механические задние упоры удерживают кассету в ячейке.
- Не показывать фронтальные колёса, длинные выкатные рельсы или ручки выдвижного ящика.

### Action view

- Погрузчик стоит перпендикулярно лицевой стороне стеллажа.
- Вилы полностью вошли в два штатных кармана одной кассеты.
- Извлекается только одна кассета; остальные полностью находятся в ячейках.
- Пакет лежит плоско, по центру, не свисает за боковые ограничители.
- Пешеходов нет между погрузчиком и стеллажом.

### Текущий кадр `2.1.png`

Не принимать. Он показывает много одинаковых оранжевых уровней, похожих на выкатные полки, но не показывает ключевой признак товара — отдельную транспортируемую кассету с карманами под вилы. Кадр может ввести клиента в заблуждение относительно способа обслуживания.

### Product-specific prompt

```text
Create a forklift-served sheet-metal cassette rack: a heavy anchored graphite steel tower with six horizontal storage cells and six independent safety-orange removable flat cassettes. Every cassette has two clearly visible closed rectangular fork tunnels underneath, a rigid cross-braced deck, rear seating stops and low side retainers. Show all cassettes fully seated; place one separate empty cassette on the floor beside the tower only to reveal its fork tunnels. No rollout wheels, no drawer handles, no extended drawers, no crane.
```

```text
Action view of the same forklift cassette rack in a real fabrication shop. One standard forklift is square to the rack and has both forks fully inserted into the dedicated closed fork tunnels of exactly one orange cassette. The cassette is withdrawn only 30–40 cm, centered and level, with a flat sheet-metal pack safely contained. Every other cassette remains fully seated. No pedestrians in the aisle, no crane, no second active load unit.
```

## 2.2. Стеллаж с выкатными кассетами

### Реальная конструкция

Горизонтальные полки/кассеты на роликах выкатываются на 100% для доступа сверху. Реальные системы используют колёса/подшипники, фиксатор в закрытом и открытом положении и, в зависимости от модели, поворотные боковые рамы/двери. Материал снимается краном, вакуумным, магнитным захватом или иной рассчитанной системой.

### Studio view

- Анкерованная четырёхстоечная рама с 5–7 горизонтальными уровнями.
- Ровно одна нижняя или средняя кассета выдвинута на 80–100%.
- Видны несущие ролики/колёса, рельсовый путь и механический фиксатор.
- Остальные кассеты закрыты и находятся внутри габарита рамы.
- На выдвинутой кассете лежит небольшой правдоподобный пакет листов.
- Боковые рамы либо полностью открыты для выбранной кассеты, либо показано фиксированное исполнение; не смешивать оба варианта.

### Action view

- Одна кассета полностью выдвинута и зафиксирована.
- Вакуумный или магнитный траверсный захват снимает один лист вертикально вверх.
- Оператор с пультом находится вне проекции груза и зоны защемления.
- Остальные уровни закрыты.

### Текущий кадр `2.2.png`

Не принимать. На нём одновременно выдвинуто несколько кассет, часть рам не имеет ясной опоры, а боковые конструкции похожи на несогласованные консоли. Это противоречит базовой безопасной эксплуатации выкатных систем.

### Product-specific prompt

```text
Create a manual horizontal rollout sheet-metal rack with a heavy anchored graphite structural frame and six orange full-extension drawers. Exactly one waist-height drawer is extended 100% on visible paired steel rollers and continuous guide tracks, with a clear lock-in/lock-out latch; all five other drawers are fully closed. A neatly aligned stack of 3000 x 1500 mm sheets rests flat on the extended drawer. Hinged side access frame is open only on the active side. No other drawer extended.
```

```text
Action view of the same rack. Exactly one drawer is fully extended and mechanically locked. A correctly sized vacuum lifting beam raises one single flat sheet vertically a few centimeters above the stack. An operator wearing helmet, gloves and eye protection controls the hoist from outside the fall zone. All remaining drawers are closed; no fabric slings, no forklift, no person under the sheet.
```

## 2.3. Совмещённый (гибридный) стеллаж

### Реальная конструкция

Проверяемая гибридная схема объединяет нижний блок 100% выкатных полок и верхний блок съёмных кассет под погрузчик в одной несущей раме. Нижние уровни обслуживаются сверху после выкатывания; верхние кассеты извлекаются погрузчиком через штатные вилочные карманы.

### Studio view

- Одна общая анкерованная рама.
- Нижняя треть/половина: 3–4 выкатные кассеты на роликах с ручкой и фиксатором.
- Верхняя часть: 3–5 съёмных кассет с двумя закрытыми вилочными туннелями каждая.
- Для демонстрации можно выдвинуть ровно одну нижнюю полку; верхние кассеты остаются в ячейках.
- Не добавлять встроенный консольный кран или вакуумный захват, если это отдельный товар.

### Action view

Выбрать только один из двух сценариев:

1. Погрузчик извлекает одну верхнюю кассету; все нижние выкатные полки закрыты.
2. Вакуумный захват снимает один лист с одной выдвинутой нижней полки; погрузчик отсутствует, верхние кассеты закрыты.

### Текущий кадр `2.3.png`

Не принимать. Он объединяет стеллаж, поворотный кран и вакуумное устройство в непроверенный единый агрегат. Верхние уровни не имеют читаемых вилочных карманов, а нижняя часть не показывает корректную механику выкатных уровней. Это выглядит как концепт, а не серийное оборудование.

### Product-specific prompt

```text
Create a real hybrid sheet-metal warehouse rack in one anchored graphite frame. Lower block: four safety-orange manual full-extension rollout drawers on visible paired rollers, handles and lock-in/lock-out latches. Upper block: four independent safety-orange removable forklift cassettes, each with two closed rectangular fork tunnels underneath. Extend exactly one lower drawer 80%; keep all upper cassettes fully seated. No integrated jib crane, no vacuum lifter attached to the rack, no second moving element.
```

```text
Action view of the hybrid rack using only the upper forklift workflow. A forklift safely withdraws exactly one upper orange cassette by its dedicated closed fork tunnels. Every lower rollout drawer is closed and latched. The load remains level and centered; no worker is in the travel aisle and no overhead crane is active.
```

## 2.4. Двусторонний стеллаж с выкатными кассетами

### Реальная конструкция

В двустороннем исполнении один и тот же уровень может полностью выдвигаться с передней или задней стороны. Производители размещают такие стеллажи между двумя рабочими зонами. Двусторонний доступ не означает безопасное одновременное выдвижение разных многотонных полок.

### Studio view

- Симметричная анкерованная рама с двумя свободными рабочими проходами.
- Только одна кассета выдвинута с одной стороны.
- На противоположной стороне все уровни находятся внутри рамы.
- Видны направляющие, рассчитанные на движение в обе стороны, и блокировка выбранного направления.
- Камера 3/4 сверху допустима только настолько, чтобы показать оба прохода без искажения геометрии.

### Action view

- Один оператор/захват работает с одной выдвинутой кассетой.
- Противоположный проход свободен, второй оператор и вторая выдвинутая кассета отсутствуют.
- Для второй фотографии можно повторить отдельный сценарий с другой стороны, но не объединять два сценария в одном кадре.

### Текущий кадр `2.4.png`

Не принимать. Он визуально показывает несколько уровней, выдвинутых в разные стороны. При отсутствии явно показанной инженерной блокировки это выглядит как опасная перегрузка основания и риск опрокидывания.

Также требуется исправить текст карточки: формулировка «два оператора могут работать одновременно» не подтверждена. Без документации конкретного изготовителя безопасная формулировка — «доступ к уровням с обеих сторон, по одной кассете за операцию».

### Product-specific prompt

```text
Create a double-sided horizontal rollout sheet-metal rack centered between two clear work aisles. Heavy anchored graphite frame, six orange bi-directional drawers on continuous through-guides. Exactly one drawer is extended 100% toward the camera-right aisle and locked; every other drawer is fully closed, including the opposite side. Show a mechanically credible direction interlock and paired roller supports. No drawer extended toward camera-left.
```

```text
Action view in a two-bay fabrication shop. One orange drawer is fully extended and locked toward one processing cell while a vacuum lifter removes one sheet. The opposite side remains completely closed and its aisle is empty. One operator only, outside the fall zone. No simultaneous work on the rear side.
```

## 2.5. Вертикальное хранение с выкатными кассетами

### Реальная конструкция

Вертикальные выкатные рамы располагаются плотно рядом. Каждая рама движется независимо на колёсах по двум параллельным рельсам или по иной полноценной направляющей системе, часто с верхним ведением. Листы удерживаются внутри вертикальной рамы нижним каналом, нескользящими прокладками и ограничителями.

### Studio view

- Жёсткий внешний каркас с 8–12 вертикальными рамами.
- Одна рама выдвинута прямо вперёд на 80–100%, остальные закрыты.
- Чётко видны две параллельные напольные направляющие и минимум две разнесённые точки опоры выдвинутой рамы.
- Верхний ролик/направляющая не даёт раме качаться и опрокидываться.
- Один или несколько листов стоят внутри выдвинутой рамы, опираются на нижний канал и удерживаются боковыми/верхними элементами.

### Action view

- Оператор перемещает одну вертикальную раму штатной рукояткой либо снимает лист рассчитанным подъёмным устройством.
- Не показывать ручное удержание полного крупноформатного листа одним человеком.
- Остальные рамы закрыты; свободная зона перед открытой рамой обозначена композицией.

### Текущий кадр `2.5.png`

Идея изделия считывается, но кадр требует переделки. У выдвинутой рамы виден только один крайний ролик, нет убедительной пары рельсов и верхнего направляющего узла. Нагруженная рама выглядит способной опрокинуться наружу. Сохранить можно общий форм-фактор, но не механику.

### Product-specific prompt

```text
Create a vertical pull-out sheet storage rack with a rigid anchored graphite outer frame and ten closely spaced orange vertical drawer frames. Exactly one drawer frame is pulled straight forward 90%. It rides on two parallel floor rails with two widely spaced load-bearing rollers and a visible upper anti-sway guide. The drawer has a deep lower channel, non-slip pads and upper side restraints holding three vertical 3000 x 1500 mm sheets securely. All other vertical drawers remain closed.
```

```text
Action view of the same vertical rack. One vertical drawer is fully extended on both rails and locked. A correctly sized vacuum lifter supports one sheet while it is removed vertically; an operator controls it from the side outside the fall zone. The remaining sheets stay restrained in the drawer, and every other drawer is closed.
```

## 2.6. Стационарный/передвижной вертикальный стеллаж

### Важное продуктовое решение

Название объединяет разные конструкции:

- стационарный секционный стеллаж: сварная рама, плоское основание, неподвижные разделители, анкеры;
- передвижная тележка: сварная рама, широкое устойчивое основание, четыре промышленных колеса, минимум два тормоза и рукоятка;
- мобильные вертикальные рамы на рельсах: отдельный высокоплотный продукт, где рамы сдвигаются по двум параллельным рельсам и создают проход.

Один кадр не должен обещать все три исполнения. Production-ready решение — сделать вариант исполнения полем товара и отдельные изображения. До этого основной кадр следует считать стационарным.

### Studio view: стационарный вариант

- Сварная рама с 4–6 вертикальными секциями.
- Плоское стальное основание или промежуточные нижние связи не позволяют листу касаться пола и проваливаться.
- Высокие разделители и нижние упоры удерживают лист внутри своей секции.
- Анкерные пластины видны в основании.
- В двух-трёх секциях находятся листы разных форматов, но они не выступают опасно за габарит.

### Studio view: передвижная тележка

- Устойчивая низкая база, четыре колеса подходящего диаметра, два тормоза, отдельная рукоятка.
- Короткие/средние листы и остатки лежат в пределах рассчитанного габарита.
- Не ставить на маленькие мебельные ролики конструкцию для полного тяжёлого пакета 3000×1500 мм.

### Action view

- Для стационарной версии: один лист снимается вакуумным захватом, стеллаж анкерован.
- Для тележки: оператор перемещает тележку за рукоятку без подвешенного груза рядом; колёса разблокированы только на время перемещения.
- Для рельсовой системы: рамы раздвинуты так, что образован один безопасный проход; не подменять её обычной тележкой.

### Текущий кадр `2.6.png`

Условно похож на стационарный секционный стеллаж, но не на передвижной. Пустой кадр не объясняет работу секций, а верхние прямоугольные перемычки выглядят скорее как клетка, чем как оптимальные разделители. Можно сохранить идею плоской базы и анкерных лап, но продукт нужно показать с реальными листами и нижними упорами.

### Product-specific prompt

```text
Create the stationary version of a vertical sheet-material storage rack: a fully welded graphite steel frame with five upright storage bays, high tubular dividers, a continuous flat steel base, intermediate floor bracing, toe stops and visible lag-down anchor plates. Place realistic sheets of two sizes in three bays, leaning only slightly and fully contained below the divider height. No casters, no sliding drawers, no forklift pockets.
```

```text
Create a separate mobile-cart variant, not combined with the stationary model: a compact fully welded vertical sheet cart with three fixed bays, broad flat base, four industrial swivel casters of realistic diameter, two visible foot brakes and a push handle. Store only a modest quantity of safely contained sheet offcuts. No anchors, no floor rails, no claim of carrying a multi-ton full-size pack.
```

## 2.7. Пирамида вертикального хранения

### Реальная конструкция

Пирамида — A-образная рама с широким основанием. Листы опираются на наклонные стороны и стремятся внутрь конструкции, а не наружу. Нужны нижние упоры, защитные прокладки и удержание от бокового сдвига. Стационарный и передвижной варианты должны быть показаны отдельно.

### Studio view

- Симметричная A-образная несущая рама.
- Широкая база выступает с обеих сторон и обеспечивает устойчивость.
- На обеих наклонных сторонах видны резиновые/UHMW-прокладки и нижний непрерывный упор.
- Листы стоят с небольшим наклоном внутрь; их центр тяжести находится над базой.
- Для стационарной версии — анкерные точки. Для мобильной — рассчитанные колёса/тележка и тормоза.
- Не добавлять подъёмные проушины, если не подтверждён подъём загруженной пирамиды.

### Action view

- Один лист устанавливается вакуумным захватом на одну сторону A-рамы.
- Остальной пакет зафиксирован, противоположная сторона нагружена симметрично или остаётся пустой в пределах устойчивости.
- Оператор не стоит между подвешенным листом и рамой.

### Текущий кадр `2.7.png`

Общий A-образный силуэт и широкое основание правдоподобны. Однако нет защитных прокладок, нижнего удержания и реального листа. Подъёмные проушины и вилочные карманы одновременно создают непроверенное обещание транспортировки загруженной конструкции. Кадр допустим только как черновая основа формы, не как готовое изображение.

### Product-specific prompt

```text
Create a stationary A-frame sheet-metal storage pyramid with a heavy graphite triangular frame and a broad anchored base extending equally on both sides. Add continuous orange lower toe rails, bolted black rubber/UHMW protective strips on both inclined faces and side retention stops. Show several full-size metal sheets leaning safely inward on each side, with their centers of gravity over the base. No lifting eyes, no casters, no forklift pockets.
```

```text
Action view of the same anchored A-frame. A vacuum lifting beam positions one sheet onto one padded inclined face. The sheet is vertical with a slight inward lean and is about to contact the lower toe rail. The operator stands to the side, not between the sheet and rack; no one is beneath the suspended sheet.
```

## 2.8. Полки для хранения листового металла

### Реальная конструкция

Это простой стационарный горизонтальный стеллаж с несколькими фиксированными плоскими полками. Тонкий лист хранится плашмя, что уменьшает коробление. У промышленного варианта — сварная рама, 4–5 уровней, равномерная поддержка по площади, доступ с нескольких сторон и анкеры.

### Studio view

- 4–5 фиксированных горизонтальных полок в единой анкерованной раме.
- Полки не выдвигаются и не имеют роликов.
- Листы малого формата лежат плоско, отсортированы по размеру/материалу.
- Опорная сетка/настил достаточно частый, чтобы тонкий лист не провисал.
- Боковые и задние упоры не дают материалу соскользнуть.

### Action view

- Оператор в перчатках снимает один реально переносимый малый лист с уровня на высоте пояса либо использует компактный вакуумный захват.
- Не показывать ручной перенос одним человеком тяжёлого полноформатного листа.
- Остальные листы остаются плоскими и не свисают.

### Текущий кадр `2.8.png`

Полностью не соответствует товару: это одиночная низкая кассета/тележка на роликах. В кадре нет ни стеллажа, ни нескольких полок, ни хранения малого формата.

### Product-specific prompt

```text
Create a simple fixed horizontal sheet-metal shelving rack for small-format sheets. Fully welded anchored graphite frame, five non-moving flat shelves with dense cross-supports, modest vertical clearance, low orange rear and side stops. Store neatly separated small steel and aluminum sheet blanks flat on four shelves. Four-sided access, visible anchor plates, no rollers, no pull-out drawers, no lifting eyes, no mobile base.
```

```text
Action view of the fixed shelving rack. One operator wearing cut-resistant gloves safely removes a small manageable sheet blank from a waist-height shelf using both hands. All remaining blanks lie flat, aligned and fully supported. No suspended load and no full-size 3000 x 1500 mm sheet being carried manually.
```

## 2.9. Депаллетайзер

### Блокирующее несоответствие в описании товара

Словом «депаллетайзер» на рынке называются как минимум два разных изделия:

1. **Пассивный pin table.** Низкая рама с переставляемыми вертикальными штырями. Штыри совмещают с окнами деревянного поддона; пакет листа опускают на штыри, после чего поддон отделяется. Это не автоматическая поштучная подача.
2. **Автоматический destacker/feeder.** Подъёмный стол с пакетом, разделители листов, вакуумная траверса/портал, контроль двойного листа и передача на конвейер или станок. Это полноценная ограждённая машина.

Текущие `summary`, `description`, `badge` и `specs` описывают второй, автоматический тип. Поэтому основной кадр должен показывать автоматический destacker/feeder. Если бизнес имел в виду pin table из линейки ручных систем, нужно сначала изменить текст и характеристики.

### Studio view: автоматический вариант по текущему контенту

- Ограждённая промышленная ячейка.
- Входной пакет листов на подъёмном столе или паллетной позиции.
- Магнитные разделители для стали и/или воздушное разделение; для универсальности — явно нейтральные разделительные узлы.
- Горизонтальная каретка/портал с массивом вакуумных чашек.
- Один лист поднят на несколько сантиметров, остаётся горизонтальным.
- Выходной конвейер или стол следующего этапа.
- Защитное ограждение, межблокируемая дверь, HMI и аварийный стоп.
- Никаких людей внутри рабочей зоны.

### Action view: автоматический вариант

- Один лист переносится вакуумной траверсой от пакета к выходному столу.
- На пакете остаются ровные листы; второй лист не «прилип» к поднятому.
- За ограждением виден оператор у HMI.

### Studio view: пассивный pin table, если контент будет исправлен

- Низкая прямоугольная трубчатая рама.
- 12 переставляемых вертикальных штырей, расположенных не случайно, а по окнам реального деревянного поддона.
- Штыри могут скользить вдоль труб рамы; сверху защитные полимерные колпачки.
- В основании имеются интегрированные вилочные туннели для перемещения самого стола.

### Текущий кадр `2.9.png`

Не соответствует ни одному варианту. Для pin table штыри выглядят случайно расставленными, не читается их скольжение и совмещение с поддоном, нет защитных наконечников и ясных вилочных туннелей. Для автоматического депаллетайзера полностью отсутствуют подъёмный стол, разделение листов, захват, портал, ограждение и выходной тракт.

### Product-specific prompt: автоматический вариант

```text
Create an engineering-realistic automatic sheet-metal destacker and feeder cell. A low pallet lift table holds a neat 3000 x 1500 mm steel-sheet stack. Four sheet-fanner/separation units surround the top of the stack. An overhead graphite gantry carries an orange vacuum gripper beam with evenly spaced oil-resistant suction cups and lifts exactly one sheet horizontally a few centimeters. A short outfeed conveyor or laser loading table is aligned beside it. Full perimeter safety fence, interlocked access door, external HMI and emergency stop. No people inside the guarded cell, no second sheet attached, no decorative robot arms.
```

### Product-specific prompt: pin table после изменения контента

```text
Create a passive low-profile sheet-metal pin-table depalletizer, not an automatic feeder. Heavy graphite rectangular tubular frame, twelve orange repositionable upright pin weldments sliding along the framework, each with a black acrylic protective cap. Arrange the pins in a mechanically ordered grid matching the openings of a visible wooden shipping pallet. Show integral closed forklift tubes in the base. No gantry, no vacuum cups, no conveyor, no random tall rods, no automatic controls.
```

## Общий action-кадр `manual-sheet-racks-in-action.png`

### Почему его нельзя использовать для девяти товаров

- Он показывает только горизонтальный выкатной стеллаж; для вилочного, вертикального, A-образного, полочного и депаллетайзера это другой продукт.
- Поднимается целый пакет листов текстильными стропами. На острых кромках не видны защитные накладки, хотя OSHA требует защищать стропы от острых краёв.
- Из кадра неясно, зафиксирована ли выдвинутая полка.
- Один общий кадр лишает карточки товара доказательства реального сценария применения.

Решение: удалить его из всех общих галерей. Если нужна дополнительная фотография для `rollout-cassette-rack`, создать отдельный action-кадр с одной зафиксированной полкой и вакуумным/магнитным захватом одного листа.

## Категорийное изображение `02-manual-sheet-metal.png`

Текущий кадр показывает один большой выкатной стеллаж и несколько открытых кассет. Это одновременно не раскрывает ассортимент и демонстрирует нежелательный сценарий.

Новое категорийное изображение должно объединять **несколько отдельных изделий**, не превращая их в один фантазийный агрегат:

1. слева сзади — стеллаж со съёмными кассетами под погрузчик, все кассеты закрыты;
2. по центру — горизонтальный выкатной стеллаж, открыта одна полка;
3. справа сзади — вертикальный выкатной стеллаж, открыта одна вертикальная рама;
4. справа спереди — A-образная пирамида с безопасно опёртыми листами;
5. опционально спереди — низкий pin table, только если этот товар действительно остаётся в категории.

Все изделия должны быть физически разделены проходами, находиться в одном масштабе и не выполнять операции одновременно. Категорийное изображение используется только на плитке/странице категории и не добавляется третьим кадром в галереи товаров.

```text
Wide photorealistic category scene in a clean industrial showroom, presenting four separate manual sheet-metal storage products with clear aisles between them: a forklift cassette tower with all cassettes seated, a horizontal rollout rack with exactly one drawer extended, a vertical pull-out rack with exactly one vertical frame extended, and an anchored A-frame pyramid holding sheets safely. All products share graphite structural frames and #fc5413 moving elements but remain visibly separate machines. No simultaneous handling operations, no forklift, no crane, no category product fused into another product, no extra drawers open.
```

## Чек-лист приёмки каждого сгенерированного изображения

Изображение принимается только если на все вопросы дан ответ «да»:

1. Изделие без подписи узнаётся именно как заявленный тип, а не соседний товар?
2. Видно, что держит вес листа и куда передаётся нагрузка?
3. Все стойки, рельсы, колёса, кассеты и листы физически соединены?
4. Выдвинута только одна кассета/рама?
5. Выдвинутый элемент имеет минимум две правдоподобные опоры или рассчитанную направляющую?
6. Листы лежат/стоят внутри опорного контура и не свисают опасно?
7. Погрузчик использует штатные вилочные карманы, не касается листа?
8. Подъёмное устройство соответствует одному листу или пакету и имеет правдоподобные точки захвата?
9. Нет людей под грузом, внутри crush-zone или между движущимся грузом и рамой?
10. Нет деталей, которых нет в комплектации товара?
11. Studio и action показывают одно и то же изделие с совпадающей геометрией?
12. Изображение не повторяет фото категории и не подменяет индивидуальный action-кадр?
13. Оранжевым выделены только подвижные/съёмные элементы, а не случайные несущие балки?
14. Профессионал не увидит выдуманных креплений, разорванных профилей, лишних колёс, случайных тросов или невозможных пересечений?
15. Инженер КБ Парус подтвердил принцип работы, даже если точная конфигурация изготавливается под заказ?

## Источники

- [Eurostorage — кассетный стеллаж под погрузчик](https://www.eurostorage.com/storage-of-metal-sheets/metal-sheet-forklift-rack/): съёмные кассеты, штатные вилочные туннели, защита листа от вил.
- [Eurostorage — горизонтальный выкатной стеллаж](https://www.eurostorage.com/storage-of-metal-sheets/metal-sheet-rack-horizontal/): 100% выдвижение, колёса, фиксация, обслуживание краном/вакуумом/магнитом.
- [Eurostorage — гибридный warehouse rack](https://www.eurostorage.com/storage-of-metal-sheets/metal-sheet-warehouse-rack/): нижние выкатные полки плюс верхние кассеты под погрузчик.
- [Steel Storage Systems — двусторонний выкатной стеллаж](https://steelstorage.com/products/roll-out-sheet-racks/): двусторонний доступ и демонстрация одной выдвинутой полки.
- [Steel Storage Systems — техническая брошюра](https://steelstorage.com/wp-content/uploads/2020/01/Sheet-Rack.Brochure.pdf): выдвижение в обе стороны, усиление под загрузку погрузчиком, вилочные подставки.
- [Plastixs — инструкция выкатной системы](https://www.plastixs.com/wp-content/uploads/2025/03/Rack-Storage-Pull-Out-System-Operating-Instructions.pdf): требование выдвигать только одну полку на секцию и держать людей вне рабочей зоны.
- [Eurostorage — вертикальный выкатной стеллаж](https://www.eurostorage.com/storage-of-metal-sheets/metal-sheet-rack-vertical/): 100% выдвижение вертикальных рам, нескользящие полосы, индивидуальный доступ.
- [Eurostorage — мобильные вертикальные рамы](https://www.eurostorage.com/storage-of-metal-sheets/mobile-frames-rack-manual/): колёса на двух параллельных рельсах и создание рабочего прохода.
- [Vestil — каталог вертикальных и горизонтальных листовых стеллажей](https://vestildocs.com/Catalogs/storage.pdf): стационарные секции, анкеры, фиксированные горизонтальные полки и равномерная поддержка.
- [Rack Engineering Division — vertical sheet storage](https://rack-eng.com/product/vertical-sheet-storage-system/): вертикальные выкатные рамы и доступ для крана/вакуума.
- [SteelStack — A-frame sheet cart](https://www.steelstackusa.com/fold-away-sheet-cart): реальная A-образная транспортная конструкция для листа.
- [LEAN Manufacturing Products — pin table / depalletizer](https://www.leanmanufacturingproducts.com/our-products/pin-table): переставляемые штыри, защитные наконечники и отделение пакета от деревянного поддона.
- [Union Tool — автоматический vacuum feeder](https://www.uniontoolcorp.com/Metal_Sheet_Vacuum_Feeder_PB14993.htm): подъёмный стол, магнитные разделители и вакуумная поштучная подача.
- [Atlas Technologies — automatic destacker](https://atlastechnologies.com/front-of-line-destacker-systems): поштучное разделение и автоматическая подача листовой заготовки.
- [OSHA 1910.184 — Slings](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.184/): защита строп от острых кромок и запрет нахождения людей у подвешенного груза.
