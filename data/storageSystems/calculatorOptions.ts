import type { FacilityKind, LoadingMethod, MaterialKind, ExecutionMode } from "./types";

export const materialOptions: Array<{ value: MaterialKind; label: string }> = [
  { value: "sheet", label: "Лист" },
  { value: "pipe", label: "Труба" },
  { value: "profile", label: "Профиль" },
  { value: "longProduct", label: "Сортовой прокат" },
  { value: "mixed", label: "Смешанный металл" }
];

export const loadingOptions: Array<{ value: LoadingMethod; label: string }> = [
  { value: "crane", label: "Кран-балка" },
  { value: "forklift", label: "Погрузчик" },
  { value: "manual", label: "Вручную" }
];

export const facilityOptions: Array<{ value: FacilityKind; label: string }> = [
  { value: "workshop", label: "Цех" },
  { value: "warehouse", label: "Склад" },
  { value: "outdoor", label: "Улица" }
];

export const executionOptions: Array<{ value: ExecutionMode; label: string }> = [
  { value: "manual", label: "Ручная система" },
  { value: "automatic", label: "Автоматическая система" }
];
