import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: { ru: "Изображение", en: "Media" },
    plural: { ru: "Медиа-библиотека", en: "Media" }
  },
  admin: {
    description: {
      ru: "Загружайте сюда фотографии товаров, баннеры, логотипы. Файл сохранится в облако и будет доступен сайту.",
      en: "Upload product photos, banners, logos. Files are stored in cloud and served to the site."
    },
    useAsTitle: "filename"
  },
  upload: {
    // Принимаем картинки (любые) И видео mp4/webm для hero-фона
    mimeTypes: ["image/*", "video/mp4", "video/webm", "video/quicktime"],
    imageSizes: [
      { name: "thumb", width: 320, height: undefined, position: "centre" },
      { name: "medium", width: 800, height: undefined, position: "centre" },
      { name: "large", width: 1600, height: undefined, position: "centre" }
    ],
    formatOptions: { format: "webp", options: { quality: 80 } }
  },
  fields: [
    {
      name: "alt",
      label: { ru: "Alt-текст (для SEO и доступности)", en: "Alt text" },
      type: "text",
      required: true
    },
    {
      name: "caption",
      label: { ru: "Подпись (опционально)", en: "Caption" },
      type: "text"
    }
  ],
  access: {
    read: () => true
  }
};
