// Shared theme + font registration for the itinerary PDF.
// Poppins only (per brand). Colors are the MyHolidayBro palette.
import { Font } from "@react-pdf/renderer";

let registered = false;
export function registerFonts() {
  if (registered) return;
  registered = true;
  // TTFs from the Google Fonts repo (raw.githubusercontent serves CORS *).
  const base = "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins";
  Font.register({
    family: "Poppins",
    fonts: [
      { src: `${base}/Poppins-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/Poppins-Medium.ttf`, fontWeight: 500 },
      { src: `${base}/Poppins-SemiBold.ttf`, fontWeight: 600 },
      { src: `${base}/Poppins-Bold.ttf`, fontWeight: 700 },
      { src: `${base}/Poppins-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${base}/Poppins-SemiBoldItalic.ttf`, fontWeight: 600, fontStyle: "italic" },
    ],
  });
  // Avoid hyphenation breaking words awkwardly
  Font.registerHyphenationCallback((word) => [word]);
}

export const T = {
  ink: "#111111",
  ink2: "#5a5a5a",
  ink3: "#8a8576",
  accent: "#ffde5f",
  accentHover: "#ffd633",
  accentSoft: "#fff4c2",
  accentInk: "#7a5b00",
  surface: "#ffffff",
  cream: "#faf7ee",
  line: "#ebe7d8",
  lineSoft: "#f1eddf",
  success: "#15803d",
  successBg: "#dcfce7",
  successSoft: "#f0faf3",
  danger: "#b91c1c",
  dangerBg: "#fee2e2",
  dangerSoft: "#fdf3f3",
};
