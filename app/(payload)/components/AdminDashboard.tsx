const sections = [
  {
    title: "Главная страница",
    text: "Hero, метрики, преимущества, кейсы, отзывы, FAQ, партнёры и CTA-блоки.",
    href: "/admin/globals/home-content",
    cta: "Управлять лендингом"
  },
  {
    title: "Каталог",
    text: "Категории, подкатегории, товары, цены, изображения и SEO страниц каталога.",
    href: "/admin/collections/products",
    cta: "Открыть товары"
  },
  {
    title: "Калькулятор",
    text: "Профили расчётов, цены, коэффициенты и опции, которые попадают в заявки.",
    href: "/admin/collections/calculator-profiles",
    cta: "Проверить профили"
  },
  {
    title: "Медиа-библиотека",
    text: "Фото, видео, баннеры и файлы для страниц сайта и карточек оборудования.",
    href: "/admin/collections/media",
    cta: "Открыть медиа"
  },
  {
    title: "Компания",
    text: "Контакты, реквизиты, мессенджеры и сквозные данные, которые видит клиент.",
    href: "/admin/globals/contacts",
    cta: "Редактировать контакты"
  },
  {
    title: "Заявки",
    text: "Внутренний журнал заявок с сайта: контактные данные, источник, UTM, параметры калькулятора и статус обработки.",
    href: "/admin/collections/leads",
    cta: "Открыть заявки"
  }
];

export function AdminDashboard() {
  return (
    <section className="kb-admin-dashboard" aria-label="Центр управления сайтом">
      <div className="kb-admin-dashboard__hero">
        <p className="kb-admin-dashboard__eyebrow">КБ Парус CMS</p>
        <h2>Центр управления сайтом и каталогом</h2>
        <p>
          Рабочая панель для менеджеров: быстро понять, какой раздел сайта где
          редактируется, и перейти к нужной задаче без поиска по таблицам.
        </p>
      </div>
      <div className="kb-admin-dashboard__grid">
        {sections.map((section) => (
          <a className="kb-admin-dashboard__card" href={section.href} key={section.href}>
            <span>{section.title}</span>
            <p>{section.text}</p>
            <strong>{section.cta}</strong>
          </a>
        ))}
      </div>
    </section>
  );
}
