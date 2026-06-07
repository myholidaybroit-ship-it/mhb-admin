import {
  Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";
import { registerFonts, T } from "./theme.js";

registerFonts();

/* A4 = 595 x 842 pt. Everything below is sized for A4 so on-screen and on
   printed A4 paper the text stays readable (the old A3 page shrank ~70% and
   made the body text tiny). Body copy sits at 10pt, descriptions 10pt. */
const PAD = 36;

const s = StyleSheet.create({
  page: { fontFamily: "Poppins", fontSize: 10, color: T.ink, paddingBottom: 48, backgroundColor: "#fff", lineHeight: 1.45 },
  bodyPad: { paddingHorizontal: PAD },

  // ---- Cover ----
  hero: { position: "relative", height: 250, width: "100%" },
  heroImg: { width: "100%", height: "100%", objectFit: "cover" },
  heroFallback: { width: "100%", height: "100%", backgroundColor: T.ink },
  heroShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 160, backgroundColor: "rgba(17,17,17,0.45)" },
  brandBar: { position: "absolute", top: 0, left: 0, right: 0, height: 34, backgroundColor: "rgba(17,17,17,0.55)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: PAD },
  brandName: { color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 0.3 },
  brandTag: { color: T.accent, fontSize: 9, fontWeight: 600 },
  heroTextWrap: { position: "absolute", left: PAD, bottom: 26, right: 180 },
  heroKicker: { color: T.accent, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 3, textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: 600, fontStyle: "italic" },
  heroDates: { color: "#fff", fontSize: 12, fontWeight: 500, marginTop: 5 },
  pricePill: { position: "absolute", right: PAD, bottom: 28, backgroundColor: T.accent, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 16 },
  priceUnit: { color: T.accentInk, fontSize: 8, fontWeight: 600 },
  priceVal: { color: T.ink, fontSize: 16, fontWeight: 700 },

  // ---- Greeting ----
  greetWrap: { paddingTop: 18, paddingBottom: 4 },
  greetHi: { fontSize: 14, fontWeight: 700, marginBottom: 5 },
  greetBody: { fontSize: 10, color: T.ink2, lineHeight: 1.55 },
  greetSign: { fontSize: 10, color: T.accentInk, fontWeight: 600, marginTop: 7 },

  // ---- Trip facts ----
  factGrid: { borderWidth: 1, borderColor: T.line, borderRadius: 10, overflow: "hidden", marginTop: 14 },
  factRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: T.line },
  factCell: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: T.line },
  factCellLast: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  factLabel: { fontSize: 8, color: T.ink3, marginBottom: 3, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 },
  factVal: { fontSize: 12, fontWeight: 600 },
  priceBox: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: T.cream },
  priceBig: { fontSize: 22, fontWeight: 700, color: T.ink },
  gstTag: { fontSize: 8, fontWeight: 700, color: T.success, backgroundColor: T.successBg, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7 },
  tierRow: { flexDirection: "row", gap: 6, marginTop: 4, paddingHorizontal: 12 },
  tierAmt: { fontSize: 10, fontWeight: 700, color: T.accentInk },
  tierLbl: { fontSize: 10, color: T.ink2, flex: 1 },

  // ---- Trust badges ----
  trustRow: { flexDirection: "row", paddingTop: 14, gap: 10 },
  trustCell: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7 },
  trustDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: T.accentSoft, alignItems: "center", justifyContent: "center" },
  trustDotTxt: { color: T.accentInk, fontSize: 9, fontWeight: 700 },
  trustTxt: { fontSize: 9, color: T.ink2, flex: 1 },

  // ---- Section heading ----
  sectionTitle: { fontSize: 15, fontWeight: 700, marginTop: 22, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: T.accent },
  segTitle: { fontSize: 13, fontWeight: 600, fontStyle: "italic", color: T.accentInk, marginTop: 12 },
  segDates: { fontSize: 9, color: T.ink2, marginBottom: 6 },

  // ---- Hotels ----
  nightsLabel: { alignSelf: "flex-start", fontSize: 9.5, fontWeight: 600, color: T.accentInk, backgroundColor: T.accentSoft, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 9, marginBottom: 7, marginTop: 4 },
  accImgRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  accImgBig: { width: "44%", height: 132, borderRadius: 7, objectFit: "cover" },
  accGrid: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  accImgSm: { width: "47.5%", height: 63, borderRadius: 6, objectFit: "cover" },
  hotelName: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  hotelMeta: { fontSize: 9.5, color: T.ink2, marginTop: 4, flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" },
  stars: { color: T.accentInk, fontSize: 11 },
  roomRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" },
  roomType: { fontSize: 10.5, fontWeight: 600 },
  roomOcc: { fontSize: 9, color: T.ink2 },
  badge: { fontSize: 8, fontWeight: 600, borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
  badgeRed: { backgroundColor: T.dangerBg, color: T.danger },
  badgeGreen: { backgroundColor: T.successBg, color: T.success },
  badgeAccent: { backgroundColor: T.accentSoft, color: T.accentInk },

  // ---- Transport / Cabs ----
  transGroup: { marginBottom: 10 },
  transHead: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.accentSoft, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 5 },
  transHeadTxt: { fontSize: 10.5, fontWeight: 700, color: T.accentInk },
  transItem: { flexDirection: "row", gap: 7, marginBottom: 3, marginLeft: 4 },
  transBullet: { fontSize: 10, color: T.accent, fontWeight: 700, lineHeight: 1.4 },
  transItemTxt: { fontSize: 10, color: T.ink, flex: 1, lineHeight: 1.4 },
  visaBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: T.cream, borderRadius: 8, padding: 10, marginTop: 4 },
  visaTxt: { fontSize: 10, color: T.ink, flex: 1 },

  // ---- Inclusions / Exclusions (two columns) ----
  twoCol: { flexDirection: "row", gap: 12 },
  inclCol: { flex: 1, backgroundColor: T.successSoft, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: T.successBg },
  exclCol: { flex: 1, backgroundColor: T.dangerSoft, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: T.dangerBg },
  colHead: { fontSize: 11, fontWeight: 700, marginBottom: 8 },
  ieItem: { flexDirection: "row", gap: 6, marginBottom: 6 },
  ieMark: { fontSize: 10, lineHeight: 1.35, fontWeight: 700 },
  ieTxt: { fontSize: 9.5, color: T.ink, flex: 1, lineHeight: 1.4 },

  // ---- Day-wise ----
  dayHead: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 14, marginBottom: 8 },
  dayBadge: { backgroundColor: T.accent, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  dayBadgeTxt: { fontSize: 10, fontWeight: 700, color: T.ink },
  dayDate: { fontSize: 11.5, fontWeight: 600, color: T.ink },
  daySub: { fontSize: 9, color: T.ink2 },
  transferRow: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: T.accentSoft, borderRadius: 8, padding: 9, marginBottom: 4 },
  ico: { width: 16, height: 16, borderRadius: 8, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },
  icoTxt: { fontSize: 8, fontWeight: 700, color: T.ink },
  transferTitle: { fontSize: 10.5, fontWeight: 600, color: T.accentInk, flex: 1 },
  transferMeta: { fontSize: 9, color: T.ink2, marginBottom: 8, marginLeft: 6, lineHeight: 1.4 },

  actCard: { marginBottom: 14 },
  actImgBig: { width: "100%", height: 180, borderRadius: 8, objectFit: "cover", marginBottom: 7 },
  actImgFb: { width: "100%", height: 180, borderRadius: 8, backgroundColor: T.cream, marginBottom: 7 },
  actTitle: { fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 3 },
  actDur: { alignSelf: "flex-start", backgroundColor: T.accentSoft, color: T.accentInk, fontSize: 8, fontWeight: 600, borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8, marginBottom: 4 },
  actDesc: { fontSize: 10, color: T.ink2, lineHeight: 1.5 },
  actNote: { fontSize: 9.5, color: T.accentInk, fontWeight: 600, marginTop: 4 },
  galleryRow: { flexDirection: "row", gap: 6, marginTop: 7 },
  galleryImg: { flex: 1, height: 72, borderRadius: 6, objectFit: "cover" },

  // ---- Notes & Terms ----
  noteBox: { backgroundColor: T.cream, borderRadius: 10, padding: 14 },
  listItem: { flexDirection: "row", gap: 7, marginBottom: 5 },
  bullet: { fontSize: 10, lineHeight: 1.3, color: T.accentInk, fontWeight: 700 },
  listTxt: { fontSize: 10, color: T.ink, flex: 1, lineHeight: 1.45 },
  termBlock: { marginBottom: 9 },
  termHead: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  termBody: { fontSize: 10, color: T.ink2, lineHeight: 1.5 },

  // ---- Contact page ----
  contactWrap: { paddingTop: 24 },
  contactCols: { flexDirection: "row", gap: 16, marginTop: 12 },
  contactCard: { flex: 1, borderWidth: 1, borderColor: T.line, borderRadius: 12, padding: 16 },
  contactLabel: { fontSize: 9, color: T.ink3, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 },
  contactBrand: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  contactLine: { fontSize: 10.5, color: T.ink, marginBottom: 3, lineHeight: 1.5 },
  poweredBy: { textAlign: "center", marginTop: 26, fontSize: 9, color: T.ink3 },

  // ---- Footer ----
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, height: 30, backgroundColor: T.ink, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: PAD },
  footerTxt: { color: "rgba(255,255,255,0.7)", fontSize: 8 },
  footerTag: { color: T.accent, fontSize: 8, fontWeight: 600 },
});

function SafeImage({ src, style, fallbackStyle }) {
  if (!src) return <View style={fallbackStyle} />;
  return <Image src={src} style={style} />;
}

function Stars({ n = 0 }) {
  const full = "★".repeat(Math.max(0, Math.round(n)));
  const empty = "☆".repeat(Math.max(0, 5 - Math.round(n)));
  return <Text style={s.stars}>{full}{empty}</Text>;
}

const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
  "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th"];
const ordinal = (n) => ORD[n] || `${n}th`;

function resolveItem(item, placeMap) {
  if (item.type === "activity") {
    const p = item.placeId ? placeMap[item.placeId] : null;
    return {
      title: item.title || p?.name || "Activity",
      description: item.description ?? p?.description ?? "",
      image: item.image || p?.image || "",
      gallery: item.gallery?.length ? item.gallery : (p?.gallery || []),
      note: item.note ?? p?.note ?? "",
      duration: item.duration || p?.duration || "",
    };
  }
  return item;
}

function Footer({ brand, contact }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>{brand}</Text>
      <Text style={s.footerTag}>#hasslefreetravel</Text>
      <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}   ·   ${contact}`} />
    </View>
  );
}

export default function ItineraryDocument({ itinerary, places = [], settings = {} }) {
  const it = itinerary || {};
  const placeMap = Object.fromEntries(places.map((p) => [p.id, p]));
  const brand = settings.brandName || "MyHolidayBro";
  const phone = settings.supportPhone || "+91 96666 98990";
  const email = settings.supportEmail || "contact@myholidaybro.com";
  const days = it.days || [];
  const accs = it.accommodations || [];
  const transport = it.transport || [];
  const cur = settings.currency?.replace(/[A-Za-z\s]/g, "") || "₹";
  const segs = it.segments?.length ? it.segments : [{ name: it.destination, dateLabel: it.dateRangeLabel }];
  const paxText = it.paxLabel || (it.pax ? `${it.pax} ${it.pax > 1 ? "Travellers" : "Traveller"}` : "");

  return (
    <Document title={`${it.title || "Itinerary"} — ${it.clientName || ""}`} author={brand}>
      <Page size="A4" style={s.page} wrap>
        <Footer brand={brand} contact={phone} />

        {/* ---------- COVER ---------- */}
        <View style={s.hero}>
          <SafeImage src={it.heroImage} style={s.heroImg} fallbackStyle={s.heroFallback} />
          <View style={s.heroShade} />
          <View style={s.brandBar}>
            <Text style={s.brandName}>{brand}</Text>
            <Text style={s.brandTag}>#hasslefreetravel</Text>
          </View>
          <View style={s.heroTextWrap}>
            {it.destination ? <Text style={s.heroKicker}>{it.destination} Tour Package</Text> : null}
            <Text style={s.heroTitle}>{it.title}</Text>
            <Text style={s.heroDates}>{it.dateRangeLabel}</Text>
          </View>
          {it.priceLabel ? (
            <View style={s.pricePill}>
              <Text style={s.priceUnit}>Price {it.priceUnit || ""}</Text>
              <Text style={s.priceVal}>{cur} {it.priceLabel} /-</Text>
            </View>
          ) : null}
        </View>

        <View style={s.bodyPad}>
          {/* ---------- GREETING ---------- */}
          <View style={s.greetWrap}>
            {it.clientName ? <Text style={s.greetHi}>Dear {it.clientName},</Text> : null}
            {it.greeting ? <Text style={s.greetBody}>{it.greeting}</Text> : null}
            <Text style={s.greetSign}>Greetings from {brand} ✈</Text>
          </View>

          {/* ---------- TRIP FACTS ---------- */}
          <View style={s.factGrid}>
            <View style={s.factRow}>
              <View style={s.factCell}>
                <Text style={s.factLabel}>Destination</Text>
                <Text style={s.factVal}>{it.destination || "—"}</Text>
              </View>
              <View style={s.factCell}>
                <Text style={s.factLabel}>Start Date</Text>
                <Text style={s.factVal}>{it.startDate || it.dateRangeLabel || "—"}</Text>
              </View>
              <View style={s.factCellLast}>
                <Text style={s.factLabel}>Duration</Text>
                <Text style={s.factVal}>{it.duration || "—"}</Text>
              </View>
            </View>
            <View style={[s.factRow, { borderBottomWidth: it.priceLabel ? 1 : 0 }]}>
              <View style={s.factCell}>
                <Text style={s.factLabel}>Travellers</Text>
                <Text style={s.factVal}>{paxText || "—"}</Text>
              </View>
              <View style={s.factCellLast}>
                <Text style={s.factLabel}>Trip ID</Text>
                <Text style={s.factVal}>{it.tripId || "—"}</Text>
              </View>
            </View>
            {it.priceLabel ? (
              <View>
                <View style={s.priceBox}>
                  <Text style={s.factLabel}>Price ({cur})</Text>
                  <Text style={s.priceBig}>{it.priceLabel} /-</Text>
                  {it.gstIncluded ? <Text style={s.gstTag}>incl. GST</Text> : null}
                </View>
                {(it.priceTiers || []).map((t, i) => (
                  <View style={[s.tierRow, i === (it.priceTiers.length - 1) ? { paddingBottom: 10 } : null]} key={i}>
                    <Text style={s.tierAmt}>{cur} {t.amount} /-</Text>
                    <Text style={s.tierLbl}>{t.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* ---------- TRUST BADGES ---------- */}
          {(it.trustBadges || []).length ? (
            <View style={s.trustRow}>
              {it.trustBadges.map((b, i) => (
                <View style={s.trustCell} key={i}>
                  <View style={s.trustDot}><Text style={s.trustDotTxt}>✓</Text></View>
                  <Text style={s.trustTxt}>{b}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ---------- HOTELS ---------- */}
          {accs.length ? <Text style={s.sectionTitle}>Hotels</Text> : null}
          {accs.map((a) => (
            <View key={a.id} style={{ marginBottom: 16 }} wrap={false}>
              {a.nightsLabel ? <Text style={s.nightsLabel}>{a.nightsLabel}</Text> : null}
              <View style={s.accImgRow}>
                <SafeImage src={a.images?.[0]} style={s.accImgBig} fallbackStyle={[s.accImgBig, { backgroundColor: T.cream }]} />
                <View style={s.accGrid}>
                  {(a.images || []).slice(1, 5).map((im, i) => (
                    <SafeImage key={i} src={im} style={s.accImgSm} fallbackStyle={[s.accImgSm, { backgroundColor: T.cream }]} />
                  ))}
                </View>
              </View>
              <Text style={s.hotelName}>{a.name}</Text>
              <View style={s.hotelMeta}>
                {a.rating ? <Stars n={a.rating} /> : null}
                {a.score ? <Text>({a.score})</Text> : null}
                {a.location ? <Text>◉ {a.location}</Text> : null}
                {a.checkin ? <Text>Check-in {a.checkin}</Text> : null}
                {a.checkout ? <Text>Check-out {a.checkout}</Text> : null}
                {a.mealPlan ? <Text style={[s.badge, s.badgeAccent]}>{a.mealPlan}</Text> : null}
                {a.dateLabel ? <Text>{a.dateLabel}</Text> : null}
              </View>
              {(a.rooms || []).map((r, i) => (
                <View style={s.roomRow} key={i}>
                  <Text style={s.roomType}>{r.type}</Text>
                  {r.occupancy ? <Text style={s.roomOcc}>{r.occupancy}</Text> : null}
                  <Text style={[s.badge, r.refundable ? s.badgeGreen : s.badgeRed]}>{r.refundable ? "Refundable" : "Non-refundable"}</Text>
                  {r.breakfast ? <Text style={[s.badge, s.badgeGreen]}>Breakfast</Text> : null}
                </View>
              ))}
            </View>
          ))}

          {/* ---------- TRANSPORTATION / CABS ---------- */}
          {transport.length || it.visa ? <Text style={s.sectionTitle}>Transportation &amp; Cabs</Text> : null}
          {transport.map((g, gi) => (
            <View style={s.transGroup} key={gi} wrap={false}>
              <View style={s.transHead}>
                <View style={s.ico}><Text style={s.icoTxt}>→</Text></View>
                <Text style={s.transHeadTxt}>{g.vehicle}</Text>
              </View>
              {(g.items || []).map((line, li) => (
                <View style={s.transItem} key={li}>
                  <Text style={s.transBullet}>•</Text>
                  <Text style={s.transItemTxt}>{line}</Text>
                </View>
              ))}
            </View>
          ))}
          {it.visa ? (
            <View style={s.visaBox}>
              <View style={s.ico}><Text style={s.icoTxt}>✓</Text></View>
              <Text style={s.visaTxt}>{it.visa}</Text>
            </View>
          ) : null}

          {/* ---------- INCLUSIONS / EXCLUSIONS ---------- */}
          {(it.inclusions?.length || it.exclusions?.length) ? (
            <View wrap={false}>
              <Text style={s.sectionTitle}>Inclusions &amp; Exclusions</Text>
              <View style={s.twoCol}>
                <View style={s.inclCol}>
                  <Text style={[s.colHead, { color: T.success }]}>✓  Inclusions</Text>
                  {(it.inclusions || []).map((n, i) => (
                    <View style={s.ieItem} key={i}>
                      <Text style={[s.ieMark, { color: T.success }]}>✓</Text>
                      <Text style={s.ieTxt}>{n}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.exclCol}>
                  <Text style={[s.colHead, { color: T.danger }]}>✕  Exclusions</Text>
                  {(it.exclusions || []).map((n, i) => (
                    <View style={s.ieItem} key={i}>
                      <Text style={[s.ieMark, { color: T.danger }]}>✕</Text>
                      <Text style={s.ieTxt}>{n}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {/* ---------- DAY-WISE ITINERARY ---------- */}
          {days.length ? <Text style={s.sectionTitle}>Day-wise Itinerary</Text> : null}
          {segs.map((seg, si) => {
            const segDays = days.filter((d) => !d.segment || d.segment === seg.name);
            if (!segDays.length) return null;
            return (
              <View key={si}>
                {it.segments?.length ? (
                  <>
                    <Text style={s.segTitle}>{seg.name}</Text>
                    <Text style={s.segDates}>{seg.dateLabel}</Text>
                  </>
                ) : null}
                {segDays.map((d) => {
                  const dayNo = days.indexOf(d) + 1;
                  return (
                    <View key={d.id}>
                      <View style={s.dayHead}>
                        <View style={s.dayBadge}><Text style={s.dayBadgeTxt}>Day {dayNo}</Text></View>
                        <View>
                          <Text style={s.dayDate}>{d.weekdayLabel || d.dateLabel || `Day ${dayNo}`}</Text>
                          {d.weekdayLabel && d.dateLabel ? <Text style={s.daySub}>{d.dateLabel}</Text> : null}
                        </View>
                      </View>
                      {d.items.map((raw, ii) => {
                        const item = resolveItem(raw, placeMap);
                        if (raw.type === "transfer" || raw.type === "hotel") {
                          return (
                            <View key={ii} wrap={false}>
                              <View style={s.transferRow}>
                                <View style={s.ico}><Text style={s.icoTxt}>→</Text></View>
                                <Text style={s.transferTitle}>{item.title}{item.duration ? `   (${item.duration})` : ""}</Text>
                              </View>
                              {item.note ? <Text style={s.transferMeta}>{item.note}</Text> : null}
                            </View>
                          );
                        }
                        return (
                          <View style={s.actCard} key={ii} wrap={false}>
                            <SafeImage src={item.image} style={s.actImgBig} fallbackStyle={s.actImgFb} />
                            <Text style={s.actTitle}>{item.title}</Text>
                            {item.duration ? <Text style={s.actDur}>{item.duration}</Text> : null}
                            {item.description ? <Text style={s.actDesc}>{item.description}</Text> : null}
                            {item.note ? <Text style={s.actNote}>Note: {item.note}</Text> : null}
                            {item.gallery?.length ? (
                              <View style={s.galleryRow}>
                                {item.gallery.slice(0, 3).map((g, gi2) => (
                                  <SafeImage key={gi2} src={g} style={s.galleryImg} fallbackStyle={[s.galleryImg, { backgroundColor: T.cream }]} />
                                ))}
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* ---------- NOTES ---------- */}
          {it.notes?.length ? (
            <View>
              <Text style={s.sectionTitle}>Notes</Text>
              <View style={s.noteBox}>
                {it.notes.map((n, i) => (
                  <View style={s.listItem} key={i}>
                    <Text style={s.bullet}>•</Text>
                    <Text style={s.listTxt}>{n}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* ---------- TERMS ---------- */}
          {it.terms?.length ? (
            <View>
              <Text style={s.sectionTitle}>Terms &amp; Conditions</Text>
              {it.terms.map((t, i) => (
                <View style={s.termBlock} key={i} wrap={false}>
                  {t.heading ? <Text style={s.termHead}>{t.heading}</Text> : null}
                  <Text style={s.termBody}>{t.body}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ---------- CONTACT PAGE ---------- */}
          <View style={s.contactWrap} break>
            <Text style={s.sectionTitle}>Get in touch</Text>
            <View style={s.contactCols}>
              <View style={s.contactCard}>
                <Text style={s.contactLabel}>Contact us</Text>
                <Text style={s.contactBrand}>{settings.companyLegalName || brand}</Text>
                <Text style={s.contactLine}>Phone: {phone}</Text>
                <Text style={s.contactLine}>Email: {email}</Text>
                {settings.tagline ? <Text style={[s.contactLine, { color: T.ink2, marginTop: 6 }]}>{settings.tagline}</Text> : null}
              </View>
              <View style={s.contactCard}>
                <Text style={s.contactLabel}>Meet us</Text>
                {(settings.officeAddress || "").split("\n").map((line, i) => (
                  <Text style={s.contactLine} key={i}>{line}</Text>
                ))}
              </View>
            </View>
            <Text style={s.poweredBy}>Powered by {brand} · #hasslefreetravel</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
