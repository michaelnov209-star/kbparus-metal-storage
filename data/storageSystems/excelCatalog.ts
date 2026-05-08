export interface ExcelHomeCatalogItem {
  id: string;
  title: string;
  summary: string;
  scenario: string;
  image: string;
  featured?: boolean;
}

export const excelHomeCatalog: ExcelHomeCatalogItem[] = [
  {
    id: "auto-sheet-metal",
    title: "Автоматизированные системы для хранения листового металла",
    summary: "Башенные и кассетные решения для листа с механизированной выдачей.",
    scenario: "Для цехов резки, гибки и складов листового металла.",
    image: "/assets/images/catalog/01-auto-sheet-metal.jpg",
    featured: true
  },
  {
    id: "manual-sheet-metal",
    title: "Ручные системы для хранения листового металла",
    summary: "Простые системы хранения листа без сложной автоматики.",
    scenario: "Для небольших складов, сервисных зон и участков ручного отбора.",
    image: "/assets/images/catalog/02-manual-sheet-metal.png"
  },
  {
    id: "sort-and-pipe-storage",
    title: "Системы для хранения сортового и трубного металлопроката",
    summary: "Хранение труб, профиля, балок, швеллера и сортового проката.",
    scenario: "Когда важно быстро находить типоразмер и безопасно подавать металл.",
    image: "/assets/images/catalog/03-sort-and-pipe-storage.jpg",
    featured: true
  },
  {
    id: "manual-sort-and-pipe-storage",
    title: "Ручные системы для хранения сортового и трубного металлопроката",
    summary: "Конструкции для ручного или полумеханизированного обслуживания труб, профиля и сортового проката.",
    scenario: "Для складов с понятной номенклатурой и умеренным оборотом.",
    image: "/assets/images/catalog/04-manual-sort-and-pipe-storage.png",
    featured: true
  },
  {
    id: "carousel-vertical-module",
    title: "Карусельный вертикальный модуль",
    summary: "Вертикальное хранение с выдачей нужной ячейки оператору.",
    scenario: "Для плотного хранения листа, оснастки, заготовок и комплектующих.",
    image: "/assets/images/catalog/05-carousel-vertical-module.jpg"
  },
  {
    id: "automated-warehouse-systems",
    title: "Автоматизированные складские системы",
    summary: "Комплексные решения для плотного хранения и выдачи материалов.",
    scenario: "Для складов, где важны скорость, учет и безопасная выдача.",
    image: "/assets/images/catalog/06-automated-warehouse-systems.png"
  },
  {
    id: "inlocker",
    title: "Шкаф InLocker: автоматизированная система ячеек",
    summary: "Ячеечное хранение с контролем доступа, выдачи и возврата.",
    scenario: "Для инструмента, расходников, комплектующих и ценных позиций.",
    image: "/assets/images/catalog/07-inlocker.png"
  },
  {
    id: "lifting-equipment",
    title: "Грузоподъемное оборудование",
    summary: "Оснащение для безопасной подачи металла и тяжелых заготовок.",
    scenario: "Когда хранение нужно связать с кран-балкой или зоной выдачи.",
    image: "/assets/images/catalog/08-lifting-equipment.png"
  },
  {
    id: "rollout-shelf-storage",
    title: "Системы хранения с выкатными полками",
    summary: "Полки и кассеты выдвигаются к оператору для прямого доступа.",
    scenario: "Для листа, пачек и заготовок, которые часто забирают в работу.",
    image: "/assets/images/catalog/09-rollout-shelf-storage.png"
  },
  {
    id: "cantilever-racks",
    title: "Консольные стеллажи",
    summary: "Классика для труб, профиля, балок и швеллера.",
    scenario: "Для загрузки погрузчиком или кран-балкой.",
    image: "/assets/images/catalog/10-cantilever-racks.png"
  },
  {
    id: "front-pallet-racks",
    title: "Паллетные фронтальные стеллажи",
    summary: "Складское хранение паллет, тарных мест и производственных запасов.",
    scenario: "Для адресного склада с регулярной отгрузкой.",
    image: "/assets/images/catalog/11-front-pallet-racks.png"
  },
  {
    id: "warehouse-equipment",
    title: "Складская техника",
    summary: "Техника и вспомогательное оснащение для перемещения грузов.",
    scenario: "Чтобы связать хранение, отбор, перемещение и отгрузку.",
    image: "/assets/images/catalog/12-warehouse-equipment.png"
  },
  {
    id: "shelf-racks",
    title: "Полочные стеллажи",
    summary: "Адресное хранение небольших грузов, инструмента и комплектующих.",
    scenario: "Для цеховых кладовых, складов ЗИП и сервисных зон.",
    image: "/assets/images/catalog/13-shelf-racks.png"
  },
  {
    id: "mezzanines",
    title: "Мезонины",
    summary: "Многоуровневые складские конструкции для увеличения полезной площади.",
    scenario: "Когда нужно использовать высоту помещения, а не расширять склад.",
    image: "/assets/images/catalog/14-mezzanines.png"
  },
  {
    id: "cable-racks",
    title: "Стеллажи для хранения и размотки кабеля",
    summary: "Хранение барабанов и бухт с удобной размоткой.",
    scenario: "Для производств, монтажных участков и складов кабельной продукции.",
    image: "/assets/images/catalog/15-cable-racks.png"
  },
  {
    id: "packing-marking-storage",
    title: "Упаковка, маркировка, хранение",
    summary: "Оснащение для подготовки продукции к отгрузке и учету.",
    scenario: "Для финальной зоны склада и производственной логистики.",
    image: "/assets/images/catalog/16-packing-marking-storage.png"
  },
  {
    id: "warehouse-erp",
    title: "Системы управления складом, ERP",
    summary: "Передача заявок, расчетов и параметров хранения в учетную систему.",
    scenario: "Чтобы менеджер сразу видел исходные данные и быстрее готовил предложение.",
    image: "/assets/images/catalog/17-warehouse-erp.png"
  }
];
