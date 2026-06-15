import localFont from "next/font/local";

export const ciscoSans = localFont({
  src: [
    {
      path: "../public/fonts/cisco-sans/CiscoSans-Thin.ttf",
      weight: "250",
      style: "normal",
    },
    {
      path: "../public/fonts/cisco-sans/CiscoSans-ExtraLight.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/cisco-sans/CiscoSans.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/cisco-sans/CiscoSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-cisco-sans",
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

export const helveticaNeue = localFont({
  src: [
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeue-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeue-Roman.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeue-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeue-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-helvetica-neue",
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});
