import { ImageResponse } from "next/og";

export const alt = "LifePage";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 18% 18%, rgba(121,229,210,0.22), transparent 26%), radial-gradient(circle at 80% 16%, rgba(143,169,255,0.22), transparent 24%), linear-gradient(180deg, #071117 0%, #0d161c 58%, #11191f 100%)",
          color: "#f5efe4",
          padding: "60px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "28px",
            borderRadius: "32px",
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >
              <div
                style={{
                  height: "56px",
                  width: "56px",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, rgba(121,229,210,1), rgba(207,255,246,0.95))",
                  color: "#041117",
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                }}
              >
                LP
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "42px", fontWeight: 700 }}>LifePage</div>
                <div
                  style={{
                    fontSize: "18px",
                    color: "#9bacb7",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Proof-driven personal brand builder
                </div>
              </div>
            </div>
            <div
              style={{
                maxWidth: "850px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "74px",
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "-0.05em",
                }}
              >
                Turn real work into a portfolio people can verify.
              </div>
              <div
                style={{
                  fontSize: "30px",
                  lineHeight: 1.35,
                  color: "#b6c2cb",
                }}
              >
                Import GitHub, websites, docs, and videos. Generate a public brand site, resume, and shareable proof trail.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {["GitHub + website import", "Public portfolio + resume", "Shareable proof gallery"].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    padding: "12px 22px",
                    fontSize: "22px",
                    color: "#d5dde3",
                  }}
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    size
  );
}
