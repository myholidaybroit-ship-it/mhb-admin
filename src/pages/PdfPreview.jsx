import { useState } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import ItineraryDocument from "../pdf/ItineraryDocument.jsx";
import { Button } from "../ui/kit.jsx";

export default function PdfPreview({ itinerary, places, settings }) {
  const [show, setShow] = useState(false);
  const fileName = `${(itinerary.clientName || "itinerary").replace(/\s+/g, "-")}-${(itinerary.destination || "trip").replace(/\s+/g, "-")}.pdf`;
  const doc = <ItineraryDocument itinerary={itinerary} places={places} settings={settings} />;

  return (
    <div className="col gap-4">
      <div className="row-between wrap gap-3">
        <p className="muted" style={{ fontSize: 13, maxWidth: 480 }}>
          Generates an A3 PDF from the current itinerary. Remote images must allow cross-origin loading; if a photo is blank, re-upload it or use a Cloudinary URL.
        </p>
        <div className="row gap-2">
          <PDFDownloadLink document={doc} fileName={fileName} className="btn btn-primary">
            {({ loading }) => (loading ? "Preparing…" : "⬇  Download PDF")}
          </PDFDownloadLink>
        </div>
      </div>

      {show ? (
        <div style={{ height: "72vh", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <PDFViewer width="100%" height="100%" showToolbar style={{ border: "none" }}>
            {doc}
          </PDFViewer>
        </div>
      ) : (
        <div className="card text-center" style={{ padding: "var(--sp-12)" }}>
          <p className="muted" style={{ marginBottom: "var(--sp-4)" }}>The live preview renders the full document with fonts and images. It may take a few seconds.</p>
          <Button variant="accent" icon="eye" onClick={() => setShow(true)}>Render live preview</Button>
        </div>
      )}
    </div>
  );
}
