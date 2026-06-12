// ShareActions — the standard trio for sending anything to a traveller:
//   [WhatsApp] [Mail] [Copy]
// WhatsApp opens wa.me with the text prefilled; Mail opens a mailto draft;
// Copy puts the text on the clipboard. `onShared(channel)` fires so callers
// can mark things as sent/shared.

import { Button, useToast } from "./kit.jsx";
import { waHref, mailHref } from "../lib/crm.js";

export default function ShareActions({
  phone, email, subject = "", text = "",
  onShared, size = "sm", labels = true, primary = false,
}) {
  const toast = useToast();
  const wa = waHref(phone, text);
  const mail = email
    ? `${mailHref(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
    : null;

  const openWa = () => {
    if (!wa) return toast("No WhatsApp number on this traveller", "error");
    window.open(wa, "_blank");
    onShared?.("whatsapp");
  };
  const openMail = () => {
    if (!mail) return toast("No email on this traveller", "error");
    window.open(mail, "_blank");
    onShared?.("mail");
  };
  const copy = () => {
    navigator.clipboard?.writeText(text)
      .then(() => toast("Message copied — paste anywhere"))
      .catch(() => toast("Couldn't copy — select the preview text instead", "error"));
    onShared?.("copy");
  };

  return (
    <div className="row gap-2" style={{ flexWrap: "wrap" }}>
      <Button variant={primary ? "primary" : "ghost"} size={size} icon="phone" onClick={openWa} title={wa ? "Send on WhatsApp" : "Add a phone number first"}>
        {labels ? "WhatsApp" : ""}
      </Button>
      <Button variant={primary ? "secondary" : "ghost"} size={size} icon="mail" onClick={openMail} title={mail ? "Send by email" : "Add an email first"}>
        {labels ? "Mail" : ""}
      </Button>
      <Button variant="ghost" size={size} icon="copy" onClick={copy} title="Copy message">
        {labels ? "Copy" : ""}
      </Button>
    </div>
  );
}
