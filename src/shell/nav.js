// Sidebar navigation config — grouped sections mapping to admin routes.
export const NAV_GROUPS = [
  {
    title: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: "dashboard", end: true }],
  },
  {
    title: "Website",
    items: [
      { to: "/home", label: "Home Page", icon: "dashboard" },
      { to: "/contact", label: "Contact Page", icon: "inbox" },
      { to: "/navigation", label: "Header & Footer", icon: "navigation" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { to: "/destinations", label: "Destinations", icon: "map" },
      { to: "/weekends", label: "Weekend Trips", icon: "calendar" },
      { to: "/adventure-styles", label: "Adventure Styles", icon: "compass" },
      { to: "/moments", label: "Moments", icon: "star" },
    ],
  },
  {
    title: "Sales CRM",
    items: [
      { to: "/sales", label: "Overview", icon: "compass" },
      { to: "/queries", label: "Queries", icon: "inbox" },
      { to: "/followups", label: "Follow-ups", icon: "bell" },
      { to: "/payments", label: "Payments", icon: "tag" },
    ],
  },
  {
    title: "Itineraries",
    items: [
      { to: "/itineraries", label: "Itineraries", icon: "doc" },
      { to: "/library", label: "Library", icon: "sparkle" },
    ],
  },
  {
    title: "Content",
    items: [
      { to: "/content", label: "FAQs & Trip Content", icon: "doc" },
      { to: "/policies", label: "Policies", icon: "newspaper" },
      { to: "/careers", label: "Careers", icon: "briefcase" },
      { to: "/media", label: "Media Library", icon: "image" },
    ],
  },
];
