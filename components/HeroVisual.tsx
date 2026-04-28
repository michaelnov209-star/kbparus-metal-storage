import { visualAssets } from "@/data/storageSystems/visualAssets";

export function HeroVisual() {
  return (
    <div className="hero-visual reveal" aria-label="Визуал промышленной системы хранения металла">
      <img src={visualAssets.hero} alt="Промышленный склад металла" />
      <div className="hero-glass">
        <div className="video-indicator">
          <span />
          рабочая сцена склада
        </div>
        <div className="hero-logo-plate">
          <img src="/brand/logo-g.png" alt="КБ Парус" />
        </div>
        <div className="rack-blueprint" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, index) => (
            <i key={index} />
          ))}
        </div>
        <div className="visual-metric top">
          <strong>до 5000 кг</strong>
          <span>на уровень хранения</span>
        </div>
        <div className="visual-metric bottom">
          <strong>лист / труба / профиль</strong>
          <span>подбор под номенклатуру и способ загрузки</span>
        </div>
      </div>
    </div>
  );
}
