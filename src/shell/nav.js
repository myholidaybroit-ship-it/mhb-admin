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
  {
    title: "Travelers",
    items: [
      { to: "/travelers", label: "People", icon: "user" },
      { to: "/assignments", label: "Package Assignment", icon: "briefcase" },
    ],
  },
  {
    title: "People",
    items: [
      { to: "/enquiries", label: "Enquiries", icon: "inbox" },
      { to: "/users", label: "Users", icon: "users" },
    ],
  },
];
