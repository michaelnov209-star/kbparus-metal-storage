# Технический аудит изображений каталога

Дата среза: 29 июля 2026
Объём: 17 обложек категорий, 5 обложек подкатегорий, 31 опубликованный товар, 76 уникальных активных файлов.

## Что означает статус

- **PASS** — на изображении не найдено очевидного противоречия названию, механике или базовой логике эксплуатации.
- **REPLACE** — изображение нельзя оставлять в текущем виде: есть видимая техническая ошибка, несоответствие товару, небезопасная сцена или дублирование уровня каталога.
- **REVIEW_WITH_ENGINEER** — сцена выглядит правдоподобно, но по изображению нельзя подтвердить критичные элементы конструкции или безопасности; перед публикацией нужен просмотр профильного инженера.

Это визуальный аудит маркетинговых материалов, а не расчёт несущей способности, экспертиза проекта, подтверждение соответствия ГОСТ/EN/ISO или сертификация оборудования. Статус PASS не означает, что оборудование сертифицировано.

## Краткий итог

| Объект | PASS | REPLACE | REVIEW_WITH_ENGINEER |
|---|---:|---:|---:|
| Категории | 1 | 16 | 0 |
| Подкатегории | 0 | 5 | 0 |
| Товары | 9 | 19 | 3 |
| **Всего** | **10** | **40** | **3** |

Ключевые результаты:

1. Найдено **9 полных побайтовых дублей** `category cover = product cover` и ещё **1 почти идентичная пара**.
2. Один универсальный action-кадр используется у **9 разных товаров**, ещё один — у **4 товаров**. В большинстве карточек сцена не соответствует конкретной конструкции.
3. Есть несколько сцен с одновременно выдвинутыми тяжёлыми полками/кассетами. Это визуально демонстрирует опасный сценарий опрокидывания и должно быть заменено до публикации.
4. Найдены изображения, где товар не соответствует названию: «депаллетайзер» без механизма депаллетизации, «полки» в виде одной напольной кассеты, односторонняя/двусторонняя конструкция перепутана.
5. Найдены неподтверждённая маркировка (`PONTAR`), сторонние бренды (`SIMPLY`, `GoDEX`, Honeywell) и синтетический текст на этикетках. Право использования таких марок в материалах КБ Парус не подтверждено.
6. Активные оригиналы весят **113,77 MiB**, из них **112,25 MiB — PNG**. Даже при серверной оптимизации это лишний риск для холодного кэша и админки; после технической замены нужен единый WebP/AVIF-конвейер.

## P0 — снять или заменить до следующего продакшн-релиза

| Файл | Причина |
|---|---|
| `/assets/images/catalog/02-manual-sheet-metal.png` | Несколько тяжёлых кассет выдвинуты одновременно в разные стороны; не показаны межблокировка и анкеровка. |
| `/assets/images/home/scenarios/sheet-metal-near-laser-3a47b6bfd950.webp` | Одновременно выдвинуты четыре полностью загруженные листом полки; явно опасная демонстрация опрокидывающего момента. |
| `/assets/images/products/manual-sheet-metal/2.2.png` | Несколько тяжёлых выкатных кассет одновременно находятся вне габарита рамы. |
| `/assets/images/products/manual-sheet-metal/2.4.png` | Одновременное выдвижение нескольких кассет с двух сторон. |
| `/assets/images/products/manual-sheet-metal/manual-sheet-racks-in-action.png` | Переиспользуется у 9 товаров; показана тяжёлая выдвинутая кассета и подвешенный пакет листа, при этом рама стоит на регулируемых опорах без видимой анкеровки. |
| `/assets/images/products/rollout-shelf-storage/heavy-duty-pullout-rack.png` | Три тяжёлые полки с пресс-формами выдвинуты одновременно; это противоречит логике anti-tilt/one-at-a-time. |

Референс безопасной логики: производители тяжёлых выкатных систем прямо описывают межблокировку, допускающую выдвижение только одной полки, фиксацию в открытом положении и анкеровку основания.

## Полные и визуальные дубли

### Побайтово идентичные файлы

| Категория | Товар | SHA-256 (первые 12) |
|---|---|---|
| `/assets/images/catalog/01-auto-sheet-metal.jpg` | `/assets/images/products/auto-sheet-metal/2.1.jpg` | `65cf35339eae` |
| `/assets/images/catalog/05-carousel-vertical-module.png` | `/assets/images/products/carousel-vertical-module/vertical-carousel-module.png` | `2964e4cb40b5` |
| `/assets/images/catalog/07-inlocker.png` | `/assets/images/products/inlocker/smart-industrial-locker.png` | `e13936339bcc` |
| `/assets/images/catalog/11-front-pallet-racks.png` | `/assets/images/products/front-pallet-racks/selective-pallet-rack.png` | `74977008d9c9` |
| `/assets/images/catalog/13-shelf-racks.png` | `/assets/images/products/shelf-racks/industrial-shelving.png` | `3521dfc30c6b` |
| `/assets/images/catalog/14-mezzanines.png` | `/assets/images/products/mezzanines/warehouse-mezzanine.png` | `3bf587d4444d` |
| `/assets/images/catalog/15-cable-racks.png` | `/assets/images/products/cable-racks/cable-drum-rack.png` | `0ac494f70575` |
| `/assets/images/catalog/16-packing-marking-storage.png` | `/assets/images/products/packing-marking/packing-marking-workstation.png` | `3698a7f4a369` |
| `/assets/images/catalog/17-warehouse-erp.png` | `/assets/images/products/warehouse-erp/warehouse-management-system.png` | `ae663eb3d9c2` |

### Почти идентичная пара

- `/assets/images/catalog/03-sort-and-pipe-storage.jpg`
- `/assets/images/products/sort-and-pipe-storage/automated-long-goods-tower.png`

Корреляция уменьшенных изображений: `0,9998`; средняя абсолютная разница: `1,37/255`. Это один и тот же визуальный сюжет в другом кодировании.

### Осознанно не считаем ошибкой

У каждого товара `image` совпадает с `gallery[0]`. Это допустимо как структура данных, если интерфейс не выводит обложку и первый элемент галереи рядом как два разных кадра. Ошибкой были обложки категорий внутри товарных галерей — в текущем рабочем срезе они уже удалены.

## Общие action-кадры

| Файл | Где используется | Вердикт |
|---|---|---|
| `/assets/images/products/manual-sheet-metal/manual-sheet-racks-in-action.png` | 9 товаров ручного хранения листа | **REPLACE**: подходит максимум для горизонтальной выкатной кассеты; не показывает погрузочную кассету, вертикальный стеллаж, пирамиду, напольную полку или депаллетайзер. Дополнительно не видна анкеровка. |
| `/assets/images/products/manual-sort-and-pipe-storage/fishbone-racks-in-action.png` | 4 товара «ёлочка» | **REPLACE** для трёх карточек и минимум REVIEW для одной: показан один двусторонний A-frame, поэтому кадр не подтверждает усиленную, одностороннюю и другую заявленную геометрию. |

## Аудит категорий

| № | Категория / файл | Статус | Видимая проблема | Корректная сцена |
|---:|---|---|---|---|
| 01 | Автоматизированное хранение листа — `/assets/images/catalog/01-auto-sheet-metal.jpg` | **REPLACE** | Технически правдоподобная башня, но файл полностью совпадает с товаром Logic и не показывает ассортимент категории. | Чётко разделённая композиция из 3–4 реальных типов: single tower, double tower, компактный модуль и линия с передачей к лазеру; у каждой системы только одна рабочая станция выдачи. |
| 02 | Ручное хранение листа — `/assets/images/catalog/02-manual-sheet-metal.png` | **REPLACE** | P0: одновременно выдвинуты несколько тяжёлых кассет; часть находится с разных сторон рамы. | Несколько отдельных изделий рядом: погрузочная кассета, горизонтальный выкатной стеллаж с **одной** открытой кассетой, вертикальная пирамида и напольная кассета. |
| 03 | Автоматизированное хранение сортового проката — `/assets/images/catalog/03-sort-and-pipe-storage.jpg` | **REPLACE** | Почти идентична товару automated-long-goods-tower; ассортимент категории не читается. | Отдельно показать башню, honeycomb/кассетную систему и автоматическую станцию выдачи; не смешивать их в одну механически связанную машину. |
| 04 | Ручное хранение сортового проката — `/assets/images/catalog/04-manual-sort-and-pipe-storage.png` | **REPLACE** | На крайних A-frame показаны газовые пружины/шарниры, как будто несущие стойки складываются под грузом; нет понятной анкеровки. | Неподвижные односторонняя и двусторонняя «ёлочка», пирамида и классический консольный стеллаж как отдельные изделия, с базами/анкерами и упорами на концах плеч. |
| 05 | Вертикальный карусельный модуль — `/assets/images/catalog/05-carousel-vertical-module.png` | **REPLACE** | Полный дубль единственного товара; категория и карточка не различаются. | Категорийный кадр из нескольких сценариев хранения/типов carriers; товарный кадр оставить отдельным. В окне доступа показать дверь/световую завесу. |
| 06 | Автоматизированные складские системы — `/assets/images/catalog/06-automated-warehouse-systems.png` | **REPLACE** | В одном «комплексе» слева смешаны листовые кассеты, справа вертикальные контейнеры, но центральный штабелер конструктивно не обслуживает обе части; передаточные зоны открыты. | Разделённая композиция из pallet AS/RS, miniload/tote AS/RS и sheet/long-goods tower; у каждого — свой ограждённый проход и защищённая станция передачи. |
| 07 | InLocker — `/assets/images/catalog/07-inlocker.png` | **REPLACE** | Технически правдоподобно, но полный дубль товарной обложки. | Категория: несколько форматов controlled-access storage; товар: один конкретный шкаф с терминалом и одной открытой ячейкой. |
| 08 | Грузоподъёмное оборудование — `/assets/images/catalog/08-lifting-equipment.png` | **REPLACE** | Неподтверждённая маркировка `PONTAR`, нерелевантный автомобильный домкрат, смесь изделий без понятных рабочих связей; характеристики вакуумного захвата не читаются. | Отдельные реальные архетипы: колонный консольный кран с талью, вакуумный траверс для листа, цепная таль и корректно собранная строповая сборка с master link и крюками с защёлками. Без неподтверждённых брендов и без нагрузки в кадре. |
| 09 | Выкатные полки — `/assets/images/catalog/09-rollout-shelf-storage.png` | **REPLACE** | Механика одной открытой полки выглядит допустимо, но изображён один товар, а не категория; не видны interlock и анкеры. | Два-три отдельных типа: ручной, кривошипный и механизированный rack; только одна полка открыта на каждом независимом изделии. |
| 10 | Консольные стеллажи — `/assets/images/catalog/10-cantilever-racks.png` | **REPLACE** | Один специальный односторонний стеллаж с настилами не раскрывает категорию; часть уровней выглядит как полка, часть — как консоль. | Отдельно односторонний, двусторонний и вариант с мостами/настилом; показать анкеры, longitudinal bracing и roll-off stops. |
| 11 | Фронтальные паллетные стеллажи — `/assets/images/catalog/11-front-pallet-racks.png` | **REPLACE** | Полный дубль товара selective-pallet-rack. | Категория: несколько конфигураций фронтального хранения; товар: отдельный прямой вид одного bay/run с корректными паллетами. |
| 12 | Складская техника — `/assets/images/catalog/12-warehouse-equipment.png` | **PASS** | Погрузчик, электроштабелер и электротележка различимы как отдельные изделия; очевидной невозможной механики не найдено. | При следующем обновлении оставить раздельную lineup-композицию без выдуманных логотипов. |
| 13 | Полочные стеллажи — `/assets/images/catalog/13-shelf-racks.png` | **REPLACE** | Полный дубль товара industrial-shelving. | Категория: лёгкий, среднегрузовой и закрытый вариант; товар: конкретный стеллаж с равномерно размещёнными грузами. |
| 14 | Мезонины — `/assets/images/catalog/14-mezzanines.png` | **REPLACE** | Полный дубль товара; на открытой кромке нет видимых toe boards, хотя сверху хранятся ящики и внизу работают люди. | Мезонин с top rail, mid rail, toe board по периметру, полноценной лестницей; если есть зона передачи паллет — отдельные самозакрывающиеся pallet gates. |
| 15 | Кабельные стеллажи — `/assets/images/catalog/15-cable-racks.png` | **REPLACE** | Полный дубль товара; на осях не показаны удерживающие конусы и тормозные узлы, часть «барабанов» — рулон стали/бухты без фланцев. | Несколько реальных систем: rack для барабанов, rack для катушек и отдельный unwinder; оси с cones, braked holders и направляющими кабеля. |
| 16 | Упаковка и маркировка — `/assets/images/catalog/16-packing-marking-storage.png` | **REPLACE** | Категорийная композиция уместна, но присутствуют сторонние марки `SIMPLY`, `GoDEX`, Honeywell и синтетический текст на этикетках; файл полностью дублирует товар «рабочее место». | Категория: нейтральные wrapper, printer, scanner, scales; товар: отдельный ergonomically arranged packing bench. Без сторонних марок, если их использование не согласовано. |
| 17 | WMS / ERP — `/assets/images/catalog/17-warehouse-erp.png` | **REPLACE** | Технических противоречий нет, но это полный дубль товарной обложки. | Категория: WMS, терминал сбора данных, интеграция ERP и оборудование склада как отдельные узлы; товар: реальный нейтральный интерфейс на рабочем месте оператора. |

## Аудит подкатегорий

| Подкатегория / файл | Статус | Проблема | Корректная сцена |
|---|---|---|---|
| Автоматические башни — `/assets/images/catalog/01-auto-sheet-metal.jpg` | **REPLACE** | Дублирует категорию и товар Logic. | Линейка single/double tower без повторения конкретной карточки. |
| Модульные системы листа — `/assets/images/home/scenarios/sheet-metal-near-laser-3a47b6bfd950.webp` | **REPLACE** | P0: четыре загруженных лотка выдвинуты одновременно. | Компактный модуль рядом с лазером; одна кассета находится в рабочей позиции, остальные полностью внутри. |
| Кассетные системы листа — `/assets/images/catalog/02-manual-sheet-metal.png` | **REPLACE** | Несколько одновременно открытых кассет. | Два отдельных кассетных типа; на каждом открыт максимум один уровень. |
| Вертикальные системы и пирамиды — `/assets/images/catalog/02-manual-sheet-metal.png` | **REPLACE** | Использована горизонтальная кассетная система; заголовку не соответствует. | Вертикальный A-frame/pyramid и мобильный вертикальный rack с фиксаторами листа. |
| Стеллажи «ёлочка» — `/assets/images/products/manual-sort-and-pipe-storage/4.4.png` | **REPLACE** | Складные/шарнирные A-frame с газовыми пружинами не соответствуют обычной несущей геометрии. | Жёстко сваренная/болтовая односторонняя и двусторонняя «ёлочка», анкеры и концевые упоры. |

## Аудит товаров

| Товар | Статус | Что оставить / что заменить | Корректная сцена |
|---|---|---|---|
| Compact 3000×1500 | **PASS** | `1.1.jpg`, `1.2.jpg`, `1.3.jpg`: предмет и рабочие узлы согласуются, очевидной невозможной механики не найдено. | Сохранять реальный продуктовый ряд; не дорисовывать дополнительные кассеты или ограждения без исходной документации. |
| Logic | **PASS** | `2.1–2.4.jpg` выглядят как один согласованный продукт; вакуумная подача в `2.3.jpg` правдоподобна. Категорийный дубль убрать на уровне категории. | Оставить товарную галерею. |
| Spider | **PASS** | `3.1–3.4.jpg`: одна система, ограждённая зона и станция выдачи согласуются. | Оставить. |
| Cross | **PASS** | `4.1–4.3.jpg`: система и межбашенная передача согласуются. | Оставить. |
| Кассетный стеллаж под погрузчик | **REPLACE** | Обложка `2.1.png` требует проверки карманов/опор кассеты; action-файл показывает кран, а не погрузчик. | Кассета полностью извлекается вилами через рассчитанные fork pockets; погрузчик держит кассету вне rack, люди вне рабочей зоны. |
| Стеллаж с выкатными кассетами | **REPLACE** | `2.2.png` — несколько кассет открыты одновременно; общий action не показывает анкеровку. | Одна полностью выдвинутая и зафиксированная кассета, остальные заблокированы; рама анкерована. |
| Совмещённый (гибридный) стеллаж | **REPLACE** | В `2.3.png` крановая конструкция визуально опирается на rack без подтверждённого силового пути; общий action не показывает гибридную механику. | Раздельно показать верхние forklift-cassettes, нижнюю rollout-cassette и независимый рассчитанный crane/jib. |
| Двусторонний стеллаж с выкатными кассетами | **REPLACE** | `2.4.png` демонстрирует несколько одновременно открытых кассет с двух сторон. | Независимый двусторонний rack, но открыт только один drawer; interlock блокирует противоположную сторону. |
| Вертикальный стеллаж с выкатными кассетами | **REPLACE** | `2.5.png` показывает сразу несколько выдвинутых/fanned вертикальных рам; общий action горизонтальный. | Одна вертикальная кассета в рабочей позиции, остальные зафиксированы; лист удерживается от опрокидывания. |
| Вертикальный стационарный/передвижной стеллаж | **REPLACE** | `2.6.png` можно сохранить только после проверки базы и фиксаторов; action показывает другой горизонтальный rack. | Отдельные stationary и mobile версии с вертикально установленными листами, разделителями, упорами и тормозами колёс у mobile-версии. |
| Пирамида вертикального хранения | **REPLACE** | `2.7.png` близка к типу товара, но общий action показывает горизонтальную кассету. | Пирамида с листом, опирающимся всей нижней кромкой, боковыми ограничителями и понятным способом перемещения/анкеровки. |
| Полки для листового металла | **REPLACE** | `2.8.png` — одна напольная кассета/паллет, а не система полок; action не соответствует. | Многоуровневый shelf rack или честно переименованная напольная кассета; отдельный рабочий кадр. |
| Депаллетайзер листа | **REPLACE** | `2.9.png` — пассивная кассета с вертикальными штырями, нет подъёма, отделения листа или передачи; action также не депаллетайзер. | Реальный depalletizer: lift table/stack support, sheet separator или vacuum loading unit, один отделённый лист и защищённая рабочая зона. |
| Ёлочка двусторонняя | **REPLACE** | `4.4.1.png` требует инженерной проверки анкеров и bracing; общий action показывает другую A-frame геометрию. | Тот же тип upright/arms в статике и в работе, продольные связи, анкеры и end stops. |
| Усиленная двусторонняя пирамида-ёлочка | **REPLACE** | `4.4.2.png` — отдельные A-frame не связаны по основанию; только верхние и нижние «карманы», это не заявленная многоуровневая ёлочка. | Жёстко связанный продольными элементами rack с несколькими уровнями плеч и рассчитанной базой. |
| Пирамида-ёлочка двусторонняя | **REPLACE** | `4.4.3.png` содержит газовые пружины/шарниры на крайних несущих A-frame; конструкция выглядит складывающейся под грузом. | Неподвижные A-frame, fixed cross-bracing и anchored bases. |
| Пирамида-ёлочка односторонняя | **REPLACE** | `4.4.4.png` визуально имеет плечи по обе стороны A-frame; не подтверждает одностороннее исполнение. | Arms только на одной рабочей стороне, обратная сторона — bracing/стена; соответствующий action-кадр. |
| Автоматизированная башня для длинномера | **REVIEW_WITH_ENGINEER** | Обложка и action согласуются; нужно подтвердить, что у станции передачи показаны реальные ограждения, light curtain/interlock и безопасная зона оператора. | Одна кассета на transfer station, остальные внутри; ограждённый lift aisle и видимые safety devices. |
| Вертикальный карусельный модуль | **REPLACE** | Механика правдоподобна, но на access opening не читаются sliding door и full-height light curtain, которые типичны для безопасного VCM; обложка дублирует категорию. | Один carrier у окна, открытая защитная дверь только в остановленном состоянии, видимая световая завеса и терминал. |
| Паллетный AS/RS со штабелером-краном | **REVIEW_WITH_ENGINEER** | Геометрия прохода и load carriers правдоподобна; проверить transfer stations, fencing, pallet supports и отсутствие доступа человека в automated aisle. | Отдельная ограждённая шахта stacker-crane и защищённая передаточная станция с паллетой. |
| InLocker | **PASS** | Обложка и action соответствуют controlled-access cabinet; очевидной невозможной механики нет. Категорийный дубль заменить отдельно. | Оставить товарные изображения. |
| Вакуумный подъёмник с консольным краном | **REVIEW_WITH_ENGINEER** | Товар теперь показан отдельно и рабочий сценарий правдоподобен. Нужна проверка cup layout относительно массы/жёсткости листа, vacuum reservoir/alarm, hoist/crane rating и положения оператора вне fall zone. | Один реальный reference configuration: adjustable cross-beams, подходящие cups, reservoir/alarm/control, hook with latch, оператор сбоку. |
| Heavy-duty rack с выкатными полками | **REPLACE** | Обложка P0: одновременно выдвинуты три тяжёлые полки с пресс-формами. Action с одной полкой можно оставить только после проверки rigging, interlock и анкеров. | Открыта и зафиксирована одна полка, остальные locked; видимы anchors и anti-tip; кран поднимает груз за штатные точки. |
| Двусторонний консольный rack | **REPLACE** | Обложка соответствует двустороннему типу; action показывает односторонний rack у стены, а человек стоит в зоне работы погрузчика. | В обоих кадрах именно double-sided rack; forklift/side-loader без пешехода в operating zone, anchors и end stops видимы. |
| Фронтальный паллетный rack | **PASS** | Обложка и action согласуются с selective pallet rack; грубой ошибки не найдено. Категорийный дубль заменить отдельно. | Оставить; при следующей съёмке показать beam locking pins и column protection крупнее. |
| Электрическая паллетная техника | **PASS** | Электротележка/штабелер соответствуют названию; рабочий кадр логичен. | Оставить. |
| Промышленный полочный rack | **PASS** | Ручной отбор и тип груза соответствуют; очевидной опасной сцены нет. Категорийный дубль заменить отдельно. | Оставить. |
| Складской мезонин | **REPLACE** | В обоих кадрах нет видимых toe boards по открытым кромкам, при этом внизу находятся рабочие зоны/люди; обложка дублирует категорию. | Guardrail + midrail + toe board по периметру, безопасная лестница; pallet gate, если предусматривается передача паллет. |
| Rack для кабельных барабанов | **REPLACE** | Обложка смешивает барабаны, бухты и рулон стали; не видны retaining cones/brakes. В action кабель проходит по полу к столу, создавая риск спотыкания и повреждения. | Cable drums на осях с cones и braked holders; кабель идёт через roller guide/measurement unit, не лежит в проходе. |
| Рабочее место упаковки и маркировки | **REPLACE** | Обложка — категорийный collage со сторонними марками и синтетическими этикетками, а не конкретный workstation; action подходит. | Товарная обложка того же dedicated packing bench, что в action: scales, dispenser, printer/scanner и свободная рабочая поверхность. |
| WMS / ERP | **PASS** | Концептуальная обложка и рабочая станция соответствуют software/product scope; очевидной технической ошибки нет. Категорийный дубль заменить отдельно. | Оставить товарный ряд, категорию визуально дифференцировать. |

## Искусственные надписи и бренды

Подтверждённые читаемые случаи:

- `/assets/images/catalog/08-lifting-equipment.png` — `PONTAR`; происхождение марки по доступным официальным материалам не подтверждено.
- `/assets/images/catalog/16-packing-marking-storage.png` и идентичный product cover — `SIMPLY`, `GoDEX`, Honeywell. `SIMPLY` является реальной моделью PKG, поэтому это не AI-слово, но использование сторонней марки в собственной продуктовой визуализации требует согласования. Текст части этикеток синтетический/нечитабельный.

На части рендеров есть микротекст на пультах, форме работников и шильдах, который нельзя достоверно прочитать даже в исходном разрешении. Для новых изображений безопасное правило: либо использовать точную согласованную маркировку КБ Парус, либо вообще не добавлять текст/логотипы.

## Отклонённые, но не активные файлы

Эти untracked-файлы не входят в активный каталог и не считаются принятыми:

- `/assets/images/products/lifting-equipment/pillar-jib-crane.png`
- `/assets/images/products/lifting-equipment/pillar-jib-crane-in-action.png`
- `/assets/images/products/lifting-equipment/electric-chain-hoist.png`

Их нельзя подключать или деплоить без отдельного технического просмотра.

## Референсная база

Официальные материалы использованы как визуальные и эксплуатационные ориентиры, а не как подтверждение соответствия оборудования КБ Парус:

1. Remmert — автоматическое хранение листа, tower/MIDI и единая станция выдачи:
   https://www.remmert.de/en/automated-storage-retrieval-systems/sheet-metal-storage-systems
2. Dexion — long-goods tower: контейнеры, интегрированный lift, fixed operator access point:
   https://www.dexion.com/ls-tower-long-goods-storage/
3. Kardex Megamat — access door, full-height light curtain, imbalance monitoring:
   https://www.kardex.com/en-us/products/carousel/kardex-megamat
4. Schmalz VacuMaster Vario — adjustable beam/cup layout, vacuum reservoir, audible warning, operator controls:
   https://www.schmalz.com/en-de/products/manual-handling-309305/vacuum-lifting-device-vacumaster-309313/vacuum-lifting-devices-vacumaster-vario-309322
5. Proper Storage Systems — one-shelf-at-a-time safety interlock для industrial roll-out racks:
   https://www.properstorage.com/industrial-roll-out-racks.html
6. Hoffmann Group — anti-tilt locking bar и обязательная анкеровка тяжёлого extension rack:
   https://www.hoffmann-group.com/US/en/hus/p/993431-2000
7. OHRA — single/double-sided cantilever, anchoring, arm stops и long-goods application:
   https://www.ohra.net/cantilever-racking/pallet-rack
8. Dexion — обязательные locking pins для pallet-rack beams:
   https://www.dexion.com/products/accessories/safety/locking-pin/
9. Dexion — mezzanine railings, stairs и pallet gates:
   https://www.dexion.com/products/workspace-optimisation/mezzanine-floor-structures/
10. KABELMAT — retaining cones, braked axle holders и controlled unwinding:
    https://kabelmat.com/en/products/machinery-plants-and-lines/cable-drum-storage-and-unwinding-system-with-rewinding-machines
11. OSHA — люди вне fall zone, self-closing hook latches и qualified rigging:
    https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1425
12. OSHA — guardrail/toe-board для elevated open-sided platforms:
    https://www.osha.gov/fall-protection
13. PKG — подтверждение, что SIMPLY является реальной моделью pallet wrapper:
    https://www.pkg-group.com/en/machinery/simply/

## Очерёдность исправления

### P0

1. Удалить/заменить все кадры с несколькими одновременно выдвинутыми тяжёлыми полками.
2. Убрать общий `manual-sheet-racks-in-action.png` из девяти карточек.
3. Не публиковать heavy-duty pullout rack, пока на обложке одновременно открыты три уровня.

Точные файлы P0:

- `/assets/images/catalog/02-manual-sheet-metal.png`
- `/assets/images/home/scenarios/sheet-metal-near-laser-3a47b6bfd950.webp`
- `/assets/images/products/manual-sheet-metal/2.2.png`
- `/assets/images/products/manual-sheet-metal/2.4.png`
- `/assets/images/products/manual-sheet-metal/manual-sheet-racks-in-action.png`
- `/assets/images/products/rollout-shelf-storage/heavy-duty-pullout-rack.png`

### P1

1. Переделать категории 04, 06, 08, 14, 15 и товары fishbone/cable/mezzanine/depalletizer.
2. Отдать инженеру на проверку long-goods tower, AS/RS и vacuum lifter.
3. Удалить псевдобренды и весь нечитаемый AI-текст.

Точные файлы P1:

- `/assets/images/catalog/04-manual-sort-and-pipe-storage.png`
- `/assets/images/catalog/06-automated-warehouse-systems.png`
- `/assets/images/catalog/08-lifting-equipment.png`
- `/assets/images/catalog/14-mezzanines.png`
- `/assets/images/catalog/15-cable-racks.png`
- `/assets/images/catalog/16-packing-marking-storage.png`
- `/assets/images/products/manual-sheet-metal/2.1.png`
- `/assets/images/products/manual-sheet-metal/2.3.png`
- `/assets/images/products/manual-sheet-metal/2.5.png`
- `/assets/images/products/manual-sheet-metal/2.6.png`
- `/assets/images/products/manual-sheet-metal/2.7.png`
- `/assets/images/products/manual-sheet-metal/2.8.png`
- `/assets/images/products/manual-sheet-metal/2.9.png`
- `/assets/images/products/manual-sort-and-pipe-storage/4.4.1.png`
- `/assets/images/products/manual-sort-and-pipe-storage/4.4.2.png`
- `/assets/images/products/manual-sort-and-pipe-storage/4.4.3.png`
- `/assets/images/products/manual-sort-and-pipe-storage/4.4.4.png`
- `/assets/images/products/manual-sort-and-pipe-storage/fishbone-racks-in-action.png`
- `/assets/images/products/sort-and-pipe-storage/automated-long-goods-tower.png`
- `/assets/images/products/sort-and-pipe-storage/automated-long-goods-tower-in-action.png`
- `/assets/images/products/carousel-vertical-module/vertical-carousel-module-in-action.png`
- `/assets/images/products/automated-warehouse-systems/pallet-asrs-stacker-crane.png`
- `/assets/images/products/automated-warehouse-systems/pallet-asrs-stacker-crane-in-action.png`
- `/assets/images/products/lifting-equipment/vacuum-sheet-lifter-jib.png`
- `/assets/images/products/lifting-equipment/vacuum-sheet-lifter-jib-in-action.png`
- `/assets/images/products/rollout-shelf-storage/heavy-duty-pullout-rack-in-action.png`
- `/assets/images/products/cantilever-racks/double-sided-cantilever-rack-in-action.png`
- `/assets/images/products/mezzanines/warehouse-mezzanine-in-action.png`
- `/assets/images/products/cable-racks/cable-drum-rack-in-action.png`
- `/assets/images/products/packing-marking/packing-marking-workstation.png`

### P2

1. Развести категорийные и товарные обложки: заменить 9 exact и 1 near duplicate.
2. Сделать уникальный action-кадр для каждого реального типа товара.
3. После технического утверждения перекодировать активные изображения в WebP/AVIF и автоматически создавать thumb/medium/large.

Точные категорийные файлы P2, которые нужно визуально отделить от товара:

- `/assets/images/catalog/01-auto-sheet-metal.jpg`
- `/assets/images/catalog/03-sort-and-pipe-storage.jpg`
- `/assets/images/catalog/05-carousel-vertical-module.png`
- `/assets/images/catalog/07-inlocker.png`
- `/assets/images/catalog/09-rollout-shelf-storage.png`
- `/assets/images/catalog/10-cantilever-racks.png`
- `/assets/images/catalog/11-front-pallet-racks.png`
- `/assets/images/catalog/13-shelf-racks.png`
- `/assets/images/catalog/17-warehouse-erp.png`
