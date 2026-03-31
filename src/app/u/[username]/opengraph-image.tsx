import { ImageResponse } from "next/og";
import type { ProfileJSON } from "@/lib/schema";
import { getDemoPublicPageUser } from "@/lib/demo-public-pages";
import { getPublicPageUserByUsername } from "@/lib/public-page";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function OpenGraphImage({ params }: Props) {
  const { username } = await params;
  const user =
    (await getPublicPageUserByUsername(username)) ??
    (await getDemoPublicPageUser(username));

  const name = user?.name ?? username;
  const profile = user?.generatedProfiles[0]?.data as unknown as
    | ProfileJSON
    | undefined;
  const skillList = (profile?.skills ?? []).slice(0, 4).map((skill) => skill.tag);
  const stats = profile?.stats;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 18% 18%, rgba(121,229,210,0.18), transparent 26%), radial-gradient(circle at 78% 22%, rgba(243,178,118,0.16), transparent 24%), linear-gradient(180deg, #081117 0%, #0f171c 58%, #131b21 100%)",
          color: "#f5efe4",
          padding: "56px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            borderRadius: "32px",
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            padding: "40px",
            justifyContent: "space-between",
            gap: "36px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRadius: "999px",
                  border: "1px solid rgba(121,229,210,0.2)",
                  background: "rgba(121,229,210,0.09)",
                  padding: "10px 18px",
                  fontSize: "20px",
                  color: "#9ef3e4",
                }}
              >
                Public LifePage
              </div>
              <div
                style={{
                  fontSize: "68px",
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontSize: "30px",
                  lineHeight: 1.35,
                  color: "#bed0d8",
                  maxWidth: "680px",
                }}
              >
                {profile?.headline ?? "Proof-driven portfolio and public resume."}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  lineHeight: 1.45,
                  color: "#99abb5",
                  maxWidth: "720px",
                }}
              >
                {profile?.about?.slice(0, 180) ??
                  "Projects, proof, timeline, and a cleaner story of the work behind the profile."}
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {skillList.length > 0
                ? skillList.map((item) => (
                    <div
                      key={item}
                      style={{
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                        padding: "10px 16px",
                        fontSize: "20px",
                        color: "#d8e1e6",
                      }}
                    >
                      {item}
                    </div>
                  ))
                : [
                    <div
                      key="proof"
                      style={{
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                        padding: "10px 16px",
                        fontSize: "20px",
                        color: "#d8e1e6",
                      }}
                    >
                      Proof-backed profile
                    </div>,
                  ]}
            </div>
          </div>

          <div
            style={{
              width: "290px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {[
              ["Projects", stats?.projectsShipped ?? 0],
              ["Years building", stats?.yearsBuilding ?? 0],
              ["Competitions", stats?.competitions ?? 0],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  borderRadius: "24px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  padding: "20px",
                }}
              >
                <div style={{ fontSize: "44px", fontWeight: 700 }}>{String(value)}</div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "18px",
                    color: "#96a7b0",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
