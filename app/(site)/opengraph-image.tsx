import { ImageResponse } from "next/og";
import { SITE_BRAND } from "@/data/site/brand";

export const runtime = "edge";
export const alt = SITE_BRAND.defaultTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #05080C 0%, #0d1b2a 60%, #1b263b 100%)",
          padding: "72px",
          color: "#FFFFFF",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "12px",
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: 700,
              color: "#05080C",
            }}
          >
            O
          </div>
          <div style={{ fontSize: "30px", fontWeight: 600, letterSpacing: "-0.5px" }}>
            {SITE_BRAND.companyName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "68px",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              maxWidth: "980px",
            }}
          >
            Premium Office Solutions
          </div>
          <div style={{ fontSize: "30px", fontWeight: 400, color: "#B8C4D6", maxWidth: "900px" }}>
            Ergonomic office furniture in Patna, Bihar &amp; Jharkhand.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.18)",
            paddingTop: "28px",
            fontSize: "24px",
            color: "#B8C4D6",
          }}
        >
          <div>oando.co.in</div>
          <div style={{ display: "flex", gap: "16px" }}>
            <span>Workstations</span>
            <span>·</span>
            <span>Seating</span>
            <span>·</span>
            <span>Storage</span>
            <span>·</span>
            <span>Tables</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
