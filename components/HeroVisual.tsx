import { visualAssets } from "@/data/storageSystems/visualAssets";

export function HeroVisual() {
  return (
    <div className="hero-visual reveal" aria-label="Промышленная система хранения металла">
      <img src={visualAssets.hero} alt="Промышленный склад и металлоконструкции" />
      <div className="hero-visual-overlay">
        <div className="video-indicator">
          <span />
          pseudo-video / заменить на реальный ролик
        </div>
        <div className="hero-logo-plate">
          <img src="/brand/logo-g.png" alt="КБ Парус" />
        </div>
        <div className="video-timeline">
          <span className="is-active">01 хранение</span>
          <span>02 выдача</span>
          <span>03 подача</span>
        </div>
        <div className="rack-scan">
          {Array.from({ length: 5 }).map((_, index) => <span key={index} />)}
        </div>
        <div className="visual-metric top">
          <strong>до 5000 кг</strong>
          <span>на уровень хранения</span>
        </div>
        <div className="visual-metric bottom">
          <strong>лист / труба / профиль</strong>
          <span>подбор под номенклатуру</span>
        </div>
      </div>
    </div>
  );
}
