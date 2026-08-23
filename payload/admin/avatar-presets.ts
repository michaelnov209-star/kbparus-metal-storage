export const avatarPresetValues = [
  "ember",
  "graphite",
  "steel",
  "copper",
  "carbon",
  "sand",
  "smoke",
  "signal",
  "hare",
  "dog",
  "squirrel",
  "badger",
  "moose",
  "cat",
  "hedgehog",
  "raven"
] as const;

export type AvatarPreset = (typeof avatarPresetValues)[number];
export type AvatarVisualPreset = AvatarPreset | "system";

export const avatarPresetOptions = [
  { label: { ru: "Медведь — начальник производства", en: "Bear — production supervisor" }, value: "ember" },
  { label: { ru: "Сова — инженер-проектировщик", en: "Owl — design engineer" }, value: "graphite" },
  { label: { ru: "Лиса — менеджер проекта", en: "Fox — project manager" }, value: "steel" },
  { label: { ru: "Бобр — инженер-технолог", en: "Beaver — process engineer" }, value: "copper" },
  { label: { ru: "Волк — руководитель монтажа", en: "Wolf — installation foreman" }, value: "carbon" },
  { label: { ru: "Рысь — инженер ОТК", en: "Lynx — quality engineer" }, value: "sand" },
  { label: { ru: "Енот — специалист автоматизации", en: "Raccoon — automation engineer" }, value: "smoke" },
  { label: { ru: "Бизон — начальник склада", en: "Bison — warehouse supervisor" }, value: "signal" },
  { label: { ru: "Заяц — менеджер по работе с клиентами", en: "Hare — sales manager" }, value: "hare" },
  { label: { ru: "Овчарка — сервисный инженер", en: "Shepherd — service engineer" }, value: "dog" },
  { label: { ru: "Белка — специалист по снабжению", en: "Squirrel — procurement specialist" }, value: "squirrel" },
  { label: { ru: "Барсук — инженер по охране труда", en: "Badger — safety engineer" }, value: "badger" },
  { label: { ru: "Лось — специалист по логистике", en: "Moose — logistics specialist" }, value: "moose" },
  { label: { ru: "Кот — контент-менеджер", en: "Cat — content manager" }, value: "cat" },
  { label: { ru: "Ёж — сварщик", en: "Hedgehog — welder" }, value: "hedgehog" },
  { label: { ru: "Ворон — инженер-электрик", en: "Raven — electrical engineer" }, value: "raven" }
] as const;

export const avatarPresetLabels: Record<AvatarVisualPreset, string> = {
  ember: "Медведь — начальник производства",
  graphite: "Сова — инженер-проектировщик",
  steel: "Лиса — менеджер проекта",
  copper: "Бобр — инженер-технолог",
  carbon: "Волк — руководитель монтажа",
  sand: "Рысь — инженер ОТК",
  smoke: "Енот — специалист автоматизации",
  signal: "Бизон — начальник склада",
  hare: "Заяц — менеджер по работе с клиентами",
  dog: "Овчарка — сервисный инженер",
  squirrel: "Белка — специалист по снабжению",
  badger: "Барсук — инженер по охране труда",
  moose: "Лось — специалист по логистике",
  cat: "Кот — контент-менеджер",
  hedgehog: "Ёж — сварщик",
  raven: "Ворон — инженер-электрик",
  system: "Системное изменение"
};

export const avatarPresetMeta: Record<
  AvatarPreset,
  { animal: string; role: string }
> = {
  ember: { animal: "Медведь", role: "Начальник производства" },
  graphite: { animal: "Сова", role: "Инженер-проектировщик" },
  steel: { animal: "Лиса", role: "Менеджер проекта" },
  copper: { animal: "Бобр", role: "Инженер-технолог" },
  carbon: { animal: "Волк", role: "Руководитель монтажа" },
  sand: { animal: "Рысь", role: "Инженер ОТК" },
  smoke: { animal: "Енот", role: "Специалист автоматизации" },
  signal: { animal: "Бизон", role: "Начальник склада" },
  hare: { animal: "Заяц", role: "Менеджер по работе с клиентами" },
  dog: { animal: "Овчарка", role: "Сервисный инженер" },
  squirrel: { animal: "Белка", role: "Специалист по снабжению" },
  badger: { animal: "Барсук", role: "Инженер по охране труда" },
  moose: { animal: "Лось", role: "Специалист по логистике" },
  cat: { animal: "Кот", role: "Контент-менеджер" },
  hedgehog: { animal: "Ёж", role: "Сварщик" },
  raven: { animal: "Ворон", role: "Инженер-электрик" }
};

export function normalizeAvatarPreset(value: unknown): AvatarVisualPreset {
  if (value === "system") return "system";
  return avatarPresetValues.includes(value as AvatarPreset)
    ? (value as AvatarPreset)
    : "ember";
}
