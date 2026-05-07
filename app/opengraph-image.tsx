import { ImageResponse } from "next/og";

export const alt = "КБ Парус — системы хранения металла";
export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0b1219 0%, #18222c 46%, #fc5413 140%)",
          color: "#fff",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)",
            backgroundSize: "86px 86px"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -110,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "rgba(252,84,19,.34)",
            filter: "blur(10px)"
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "72px 84px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 126,
                height: 74,
                borderRadius: 22,
                background: "#fff",
                color: "#fc5413",
                fontSize: 34,
                fontWeight: 900
              }}
            >
              П
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <strong style={{ fontSize: 38, color: "#fc5413", letterSpacing: ".02em" }}>ПАРУС</strong>
              <span style={{ fontSize: 24, color: "rgba(255,255,255,.78)" }}>конструкторское бюро</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 820 }}>
            <span style={{ color: "#fc5413", fontSize: 24, fontWeight: 800, textTransform: "uppercase" }}>
              Здесь будет изображение
            </span>
            <h1 style={{ margin: 0, fontSize: 76, lineHeight: .94, fontWeight: 900 }}>
              Системы хранения металла
            </h1>
            <p style={{ margin: 0, fontSize: 30, lineHeight: 1.25, color: "rgba(255,255,255,.82)" }}>
              Каталог, калькулятор стоимости и инженерный подбор под производство
            </p>
          </div>

          <div style={{ display: "flex", gap: 18 }}>
            {["лист", "трубы", "профиль", "склад"].map((item) => (
              <span
                key={item}
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.1)",
                  border: "1px solid rgba(255,255,255,.22)",
                  fontSize: 22,
                  fontWeight: 800
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
