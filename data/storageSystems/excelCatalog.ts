import { visualAssets } from "./visualAssets";

export interface ExcelHomeCatalogItem {
  id: string;
  title: string;
  excelCell: string;
  summary: string;
  scenario: string;
  image: string;
}

export const excelHomeCatalog: ExcelHomeCatalogItem[] = [
  {
    id: "carousel-vertical-module",
    title: "Карусельный вертикальный модуль",
    excelCell: "Главная!A3",
    summary: "Вертикальное хранение с выдачей нужной ячейки оператору.",
    scenario: "Для плотного хранения листа, оснастки, заготовок и комплектующих в ограниченной площади.",
    image: visualAssets.engineering
  },
  {
    id: "inlocker",
    title: "Шкаф InLocker: автоматизированная система ячеек",
    excelCell: "Главная!C3",
    summary: "Ячеечное хранение с контролем доступа, выдачи и возврата позиций.",
    scenario: "Для инструмента, расходников, комплектующих и ценных производственных позиций.",
    image: visualAssets.warehouse
  },
  {
    id: "lifting-equipment",
    title: "Грузоподъёмное оборудование",
    excelCell: "Главная!D3",
    summary: "Оборудование для безопасной подачи металла и тяжёлых заготовок.",
    scenario: "Когда систему хранения нужно связать с кран-балкой, консольным краном или зоной выдачи.",
    image: visualAssets.engineering
  },
  {
    id: "rollout-shelf-storage",
    title: "Системы хранения с выкатными полками",
    excelCell: "Главная!A4",
    summary: "Кассеты и полки выдвигаются к оператору, чтобы не перекладывать весь металл.",
    scenario: "Для листового металла, пачек и заготовок, к которым нужен быстрый прямой доступ.",
    image: visualAssets.forklift
  },
  {
    id: "front-pallet-racks",
    title: "Паллетные фронтальные стеллажи",
    excelCell: "Главная!C4",
    summary: "Классическое складское хранение паллет, тарных мест и производственных запасов.",
    scenario: "Для складов с погрузчиком, адресным хранением и регулярной отгрузкой.",
    image: visualAssets.warehouse
  },
  {
    id: "warehouse-equipment",
    title: "Складская техника",
    excelCell: "Главная!D4",
    summary: "Техника и вспомогательное оснащение для перемещения грузов на складе.",
    scenario: "Когда нужно связать хранение, отбор, перемещение и отгрузку в один понятный процесс.",
    image: visualAssets.forklift
  },
  {
    id: "cable-racks",
    title: "Стеллажи для хранения и размотки кабеля",
    excelCell: "Главная!C5",
    summary: "Хранение барабанов и бухт с удобной размоткой без лишних перестановок.",
    scenario: "Для производств, монтажных участков и складов кабельной продукции.",
    image: visualAssets.steelProfile
  },
  {
    id: "warehouse-erp",
    title: "Системы управления складом, ERP",
    excelCell: "Главная!A6",
    summary: "Передача параметров хранения, заявок и расчётов в учётную систему.",
    scenario: "Чтобы менеджер сразу видел исходные данные и быстрее готовил предложение.",
    image: visualAssets.productionLine
  }
];
