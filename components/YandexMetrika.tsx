import Script from "next/script";

export function YandexMetrika() {
  const counterId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
  if (!counterId) return null;

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
          ym(${counterId}, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true
          });
        `}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://mc.yandex.ru/watch/${counterId}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
        </div>
      </noscript>
    </>
  );
}
