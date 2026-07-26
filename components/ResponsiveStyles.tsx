export function ResponsiveStyles() {
  return (
    <style>{`
      /* Responsive foundation. Kept last so one predictable layer owns tablet/mobile behavior. */
      .visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
      .line-page h1,.line-page h2{overflow-wrap:normal;hyphens:none}
      .catalog-detail-page :is(h1,h2,h3,h4){overflow-wrap:anywhere;hyphens:auto}
      .line-page :is(.catalog-detail-hero,.product-hero,.product-title-strip,.catalog-detail-content,.product-info-grid)>*{min-width:0}
      #catalog,#calculator,#cases,#geography,#reviews,#about,#faq,#request,#contacts,#product-configurator,#product-request{scroll-margin-top:88px}

      .material-card-media{position:relative;display:block!important;height:100%;padding:0!important;background:#17212b;overflow:hidden}
      .material-card-media:after{content:"";position:absolute;inset:42% 0 0;background:linear-gradient(0deg,rgba(9,14,20,.84),transparent)}
      .material-card-media img{width:100%!important;height:100%!important;object-fit:cover!important;transition:transform .55s cubic-bezier(.22,1,.36,1)}
      .material-card:hover .material-card-media img{transform:scale(1.035)}
      .material-card-media strong{position:absolute;left:18px;right:18px;bottom:16px;z-index:1;width:max-content;max-width:calc(100% - 36px);padding:8px 11px;color:#fff;background:rgba(16,24,32,.76);border:1px solid rgba(255,255,255,.2);border-radius:999px;font-size:13px;line-height:1.1;backdrop-filter:blur(12px)}
      .review-avatar img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:inherit}

      .mobile-menu-overlay{overscroll-behavior:contain}
      .mobile-menu-panel{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;width:min(100%,420px)!important;max-width:100%;height:100dvh!important;padding:0!important;background:linear-gradient(180deg,#0e151e,#141f2a)!important;overscroll-behavior:contain}
      .mobile-menu-head{position:sticky;top:0;z-index:4;display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:72px;margin:0!important;padding:12px 14px 12px 18px;background:rgba(14,21,30,.92);border-bottom:1px solid rgba(255,255,255,.1);backdrop-filter:blur(18px)}
      .mobile-menu-primary-links{order:1;display:grid!important;gap:4px!important;padding:10px 12px!important;border:0!important}
      .mobile-menu-primary-links a{min-height:48px!important;padding:0 12px!important;color:#fff!important;background:rgba(255,255,255,.035);border:1px solid transparent;border-radius:12px!important;font-size:15px!important}
      .mobile-menu-primary-links a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
      .mobile-menu-catalog{order:2;padding:0 12px 14px}
      .mobile-menu-catalog-title{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;width:100%!important;min-height:58px!important;padding:9px 14px!important;color:#fff!important;background:rgba(255,255,255,.065)!important;border:1px solid rgba(255,255,255,.13)!important;border-radius:14px!important;font:inherit!important;font-size:15px!important;font-weight:900!important;text-align:left!important;cursor:pointer}
      .mobile-menu-catalog-title>span{display:grid;gap:2px}
      .mobile-menu-catalog-title small{color:rgba(255,255,255,.58);font-size:11px;font-weight:700}
      .mobile-menu-catalog-title svg{flex:0 0 auto;color:var(--accent);transition:transform .2s ease}
      .mobile-menu-catalog-title[aria-expanded="true"] svg{transform:rotate(180deg)}
      .mobile-menu-catalog-body{display:grid;gap:8px;padding-top:10px}
      .mobile-menu-search{display:flex!important;align-items:center!important;gap:9px!important;min-height:48px!important;padding:0 12px!important;color:rgba(255,255,255,.56)!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:12px!important}
      .mobile-menu-search input{min-width:0;width:100%;height:46px;padding:0;color:#fff;background:transparent;border:0;outline:0;font:inherit;font-size:15px}
      .mobile-menu-search input::placeholder{color:rgba(255,255,255,.5)}
      .mobile-menu-catalog-all{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:46px!important;padding:0 12px!important;color:#fff!important;background:linear-gradient(135deg,var(--accent),#ff7540)!important;border-radius:12px!important;font-size:14px!important;font-weight:900!important}
      .mobile-menu-categories{display:grid!important;gap:3px!important;max-height:46dvh;overflow:auto;scrollbar-width:thin}
      .mobile-menu-categories a{min-height:48px!important;padding:8px 10px!important;font-size:14px!important}
      .mobile-menu-empty{margin:0;padding:16px 10px;color:rgba(255,255,255,.66)!important;font-size:13px}
      .mobile-menu-phones{order:3;position:sticky;bottom:0;z-index:3;margin-top:auto!important;padding:12px!important;background:rgba(14,21,30,.94);border-top:1px solid rgba(255,255,255,.1)!important;backdrop-filter:blur(18px)}
      .mobile-menu-phones a{justify-content:center!important;min-height:48px!important;color:#fff!important;background:rgba(255,255,255,.07);border-radius:12px}

      @media(min-width:1181px) and (max-width:1320px){
        .line-header{grid-template-columns:auto minmax(0,1fr) auto!important;width:calc(100% - 28px)!important;max-width:none!important;gap:10px!important;padding:0 12px!important}
        .line-header .brand{min-width:150px!important;max-width:150px!important}
        .line-header .brand img{width:148px!important}
        .line-header nav{justify-content:center!important;gap:4px!important;overflow:visible!important;padding:0!important}
        .line-header nav>a,.catalog-trigger{min-height:42px!important;padding:0 10px!important;font-size:12px!important}
        .line-header-contact .phone-stack{display:none!important}
        .line-hero-inner{padding-top:150px!important}
      }

      @media(max-width:1180px){
        .line-header{position:fixed!important;top:10px!important;left:50%!important;display:flex!important;grid-template-columns:none!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;width:calc(100% - 20px)!important;max-width:none!important;min-height:60px!important;padding:7px 8px!important;background:rgba(12,17,23,.72)!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:18px!important;box-shadow:0 18px 45px rgba(0,0,0,.2)!important;backdrop-filter:blur(18px) saturate(1.12)!important}
        .line-header.is-scrolled{top:6px!important;min-height:58px!important;border-radius:16px!important}
        .line-header:after,.line-header nav,.line-header-contact .phone-stack{display:none!important}
        .line-header .brand{display:flex!important;flex:1 1 auto!important;justify-content:flex-start!important;min-width:0!important;max-width:176px!important;min-height:44px!important;padding:3px 7px!important}
        .line-header .brand img{width:154px!important;max-width:100%!important}
        .line-header-contact{display:flex!important;flex:0 0 auto!important;align-items:center!important;gap:7px!important;padding:0!important;border:0!important}
        .social-btn{width:40px!important;height:40px!important;border-radius:12px!important}
        .mobile-menu-burger{display:grid!important;place-items:center!important;flex:0 0 auto!important;width:44px!important;height:44px!important;padding:0!important;color:#fff!important;background:rgba(255,255,255,.1)!important;border:1px solid rgba(255,255,255,.2)!important;border-radius:12px!important;cursor:pointer}
        .mobile-menu-burger:focus-visible,.mobile-menu-close:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
        .line-hero-inner{width:calc(100% - 32px)!important;padding-top:112px!important}
        .line-hero{min-height:86dvh!important}
        .line-hero-inner{min-height:86dvh!important}
        .section-title-row{grid-template-columns:1fr!important;gap:16px!important}
        .catalog-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        .material-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        .before-after-grid{grid-template-columns:1fr!important}
        .line-contact-form{grid-template-columns:1fr!important}
        .catalog-detail-hero>*,.product-hero>*{min-width:0!important}
        .catalog-detail-hero h1,.product-title-strip h1{overflow-wrap:anywhere!important;hyphens:auto!important}
        .catalog-detail-content,.product-info-grid{grid-template-columns:1fr!important}
      }

      @media(min-width:901px) and (max-width:1180px){
        .catalog-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important}
        .catalog-card{grid-template-rows:280px auto!important;min-height:468px!important}
      }

      @media(min-width:641px) and (max-width:900px){
        .catalog-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
        .catalog-card{grid-template-rows:270px auto!important;min-height:452px!important}
        .case-slider,.review-slider,.line-partners{grid-auto-columns:minmax(330px,58vw)!important}
      }

      @media(max-width:760px){
        .line-page{--wide:calc(100vw - 24px)!important;padding-bottom:84px!important}
        .line-section,.before-after-section,.calculator-shell,.line-about,.line-banner,.line-main-site-banner,.line-contact-form,.line-contacts{padding-top:52px!important;padding-bottom:56px!important}
        .line-section,.before-after-section,.calculator-shell,.line-contacts{padding-left:12px!important;padding-right:12px!important}
        .section-title-row,.section-title-center{margin-bottom:22px!important}
        .line-page h2{font-size:clamp(30px,9vw,42px)!important;line-height:1.02!important}
        .section-title-row p,.section-title-center p{font-size:15px!important}
        .line-hero{min-height:88dvh!important}
        .line-hero-inner{width:calc(100% - 28px)!important;min-height:88dvh!important;padding:108px 0 28px!important}
        .line-page .line-hero h1{font-size:clamp(38px,13vw,56px)!important;line-height:.96!important}
        .line-hero-content p{max-width:100%!important;font-size:16px!important}
        .line-hero-actions{display:grid!important;grid-template-columns:1fr!important;width:100%!important}
        .line-hero-cta{width:100%!important;min-height:52px!important}
        .hero-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        .hero-metrics article{min-height:82px!important;padding:13px!important}
        .hero-metrics strong{font-size:24px!important}
        .hero-metrics span{font-size:11.5px!important}

        .catalog-summary{grid-template-columns:1fr!important;gap:10px!important;width:100%!important}
        .catalog-summary article{min-height:0!important;padding:16px 16px 16px 52px!important;border-radius:18px!important}
        .catalog-summary strong{font-size:19px!important}
        .catalog-summary span{font-size:13px!important}
        .material-grid{grid-template-columns:1fr!important;gap:14px!important}
        .material-card{grid-template-rows:220px auto!important;border-radius:22px!important}
        .material-card>div:last-child{padding:19px 20px 22px!important}
        .material-card h3{font-size:23px!important}
        .material-card p{font-size:15px!important}
        .before-after-card,.before-after-card img{min-height:390px!important;height:390px!important}
        .before-after-card div{left:18px!important;right:18px!important;bottom:20px!important;padding:0!important}
        .before-after-card h3{font-size:32px!important}
        .before-after-card p{font-size:15px!important}
        .case-slider,.review-slider,.line-partners{grid-auto-columns:minmax(280px,86vw)!important;gap:12px!important}

        .calculator-shell{padding-bottom:108px!important}
        .calc-progress{position:sticky!important;top:78px!important;z-index:40!important;margin-bottom:16px!important;padding:7px!important;border-radius:16px!important}
        .calc-steps{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;overflow:visible!important;margin:0 0 7px!important;padding:0!important}
        .calc-steps button{display:grid!important;place-items:center!important;min-width:0!important;min-height:42px!important;padding:0!important;font-size:0!important}
        .calc-steps button span{display:grid!important;place-items:center!important;width:28px!important;height:28px!important;font-size:12px!important}
        .calc-panel-title{display:grid!important;grid-template-columns:1fr!important;gap:6px!important;margin-bottom:14px!important}
        .calc-panel-title h3{font-size:clamp(25px,8vw,34px)!important}
        .calc-option-group,.access-selector{padding:12px!important}
        .calc-chip-row{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        .calc-chip,.option-card,.condition-chip,.guided-choice,.line-primary,.line-secondary,.line-form button{min-height:44px!important}
        .system-card{grid-template-columns:82px minmax(0,1fr)!important}

        .line-contact-form{width:calc(100% - 24px)!important;margin-left:auto!important;margin-right:auto!important;padding:28px 18px!important;border-radius:26px!important}
        .line-contact-form h2{font-size:clamp(30px,9vw,42px)!important}
        .line-contact-form p{font-size:16px!important}
        .line-form{grid-template-columns:1fr!important;padding:18px!important}
        .line-form>*{grid-column:1!important}
        .line-main-site-banner,.line-banner{width:calc(100% - 24px)!important;margin-left:auto!important;margin-right:auto!important}

        .catalog-detail-header{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;width:100%!important;min-height:0!important;margin:0!important;padding:12px!important;background:#fff!important;border:0!important;border-bottom:1px solid #d5dde5!important}
        .catalog-detail-header .brand{justify-content:center!important}
        .catalog-detail-header .brand img{width:176px!important}
        .catalog-detail-header nav{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;width:100%!important}
        .catalog-detail-header nav a{justify-content:center!important;min-width:0!important;min-height:44px!important;padding:6px 8px!important;background:#f0f3f6!important;border-radius:10px!important;font-size:12px!important;text-align:center!important}
        .catalog-detail-header nav a:first-child{color:#1a1a1a!important}
        .product-breadcrumbs{width:calc(100% - 24px)!important;margin:14px auto!important;flex-wrap:nowrap!important;overflow-x:auto!important;white-space:nowrap!important;scrollbar-width:none}
        .product-title-strip{width:calc(100% - 24px)!important;margin:14px auto!important;padding:22px 18px!important;border-radius:22px!important}
        .product-title-strip h1{margin:8px 0 10px!important;font-size:clamp(31px,10vw,42px)!important;line-height:1!important}
        .product-title-strip p{font-size:15px!important}
        .catalog-detail-hero,.catalog-detail-hero.is-assortment,.product-hero{grid-template-columns:minmax(0,1fr)!important;gap:12px!important;width:calc(100% - 24px)!important;margin-top:14px!important;padding:0!important;border-radius:0!important}
        .catalog-detail-hero>div:first-child,.product-hero-copy{width:100%!important;padding:22px 18px!important;border-radius:22px!important}
        .catalog-detail-hero h1{font-size:clamp(32px,10vw,44px)!important;line-height:1!important}
        .catalog-detail-hero p,.product-hero-copy p{font-size:15px!important}
        .catalog-detail-hero>img{width:100%!important;height:auto!important;min-height:250px!important;max-height:390px!important;padding:12px!important;border-radius:22px!important}
        .catalog-detail-actions,.product-price-row{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
        .catalog-detail-actions a,.product-price-row a{width:100%!important;justify-content:center!important}
        .catalog-detail-content,.product-info-grid,.product-configurator,.standard-product-cta{width:calc(100% - 24px)!important;margin-left:auto!important;margin-right:auto!important;grid-template-columns:1fr!important;gap:12px!important}
        .catalog-detail-card,.product-info-grid article,.standard-product-cta>div{padding:20px 18px!important;border-radius:20px!important}
        .related-grid{grid-template-columns:1fr!important}
        .product-hero-copy h2{font-size:clamp(29px,9vw,40px)!important}
        .product-gallery-main,.product-gallery-open{min-height:270px!important}
        .product-gallery-image{max-height:290px!important;padding:12px!important}
        .product-gallery-thumbs{grid-template-columns:repeat(4,minmax(0,1fr))!important}
        .product-gallery-thumbs button{height:64px!important}
        .product-detail-page .line-form{width:calc(100% - 24px)!important;margin:0 auto 64px!important}
        .product-spec-table,.product-option-grid,.product-chip-row{grid-template-columns:1fr!important}
      }

      @media(max-width:640px){
        .catalog-section{padding-left:12px!important;padding-right:12px!important}
        .catalog-section .section-title-row,.catalog-section .catalog-grid{width:100%!important}
        .catalog-grid{grid-template-columns:1fr!important;gap:12px!important}
        .catalog-card{display:grid!important;grid-template-columns:minmax(118px,38%) minmax(0,1fr)!important;grid-template-rows:minmax(168px,auto)!important;min-height:168px!important;border-radius:20px!important}
        .catalog-card-visual{grid-column:1!important;grid-row:1!important;min-width:0!important;min-height:168px!important}
        .catalog-card-body{grid-column:2!important;grid-row:1!important;display:grid!important;grid-template-rows:auto 1fr auto!important;gap:8px!important;min-width:0!important;min-height:168px!important;padding:13px 13px 14px!important;border-top:0!important;border-left:1px solid rgba(203,213,223,.72)!important}
        .catalog-card-meta{gap:6px!important}
        .catalog-card small{min-height:24px!important;padding:0 7px!important;font-size:8px!important;line-height:1!important}
        .catalog-card-meta>span{min-width:27px!important;height:27px!important;font-size:10px!important}
        .catalog-card h3{min-height:0!important;margin:0!important;font-size:15px!important;line-height:1.16!important}
        .catalog-card b{align-self:end!important;gap:5px!important;font-size:12px!important;line-height:1.2!important}
        .catalog-zoom-pill{display:none!important}
        .catalog-image-main{padding:4px!important;object-fit:contain!important}
        .catalog-card:hover{transform:none!important}
      }

      @media(max-width:430px){
        .line-header .brand{max-width:148px!important}
        .line-header .brand img{width:138px!important}
        .social-btn{width:38px!important;height:38px!important}
        .mobile-menu-burger{width:42px!important;height:42px!important}
        .line-page .line-hero h1{font-size:clamp(36px,12.5vw,50px)!important}
        .catalog-card{grid-template-columns:112px minmax(0,1fr)!important}
        .catalog-card h3{font-size:14px!important}
        .catalog-card b{font-size:11px!important}
        .product-gallery-thumbs{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      }

      @media(max-width:350px){
        .line-header-contact .social-btn.max{display:none!important}
        .line-header .brand{max-width:142px!important}
        .catalog-card{grid-template-columns:104px minmax(0,1fr)!important}
      }

      @media(prefers-reduced-motion:reduce){
        .material-card-media img,.mobile-menu-catalog-title svg{transition:none!important}
      }
    `}</style>
  );
}
