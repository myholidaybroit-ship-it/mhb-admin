import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./shell/auth.jsx";
import { StoreProvider } from "./lib/store.jsx";
import { ToastProvider } from "./ui/kit.jsx";
import AdminShell from "./shell/AdminShell.jsx";
import Login from "./shell/Login.jsx";

import HomePage from "./pages/Home.jsx";
import Contact from "./pages/Contact.jsx";
import Destinations from "./pages/Destinations.jsx";
import Weekends from "./pages/Weekends.jsx";
import AdventureStyles from "./pages/AdventureStyles.jsx";
import Content from "./pages/Content.jsx";
import Media from "./pages/Media.jsx";
import Moments from "./pages/Moments.jsx";
import Blogs from "./pages/Blogs.jsx";
import Careers from "./pages/Careers.jsx";
import Policies from "./pages/Policies.jsx";
import Queries from "./pages/Queries.jsx";
import QueryDetail from "./pages/QueryDetail.jsx";
import Newsletter from "./pages/Newsletter.jsx";
import Navigation from "./pages/Navigation.jsx";
import Itineraries from "./pages/Itineraries.jsx";

function Gate() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="login-screen"><div className="spinner" /></div>;
  if (!user) return <Login />;
  return (
    <ToastProvider>
      <StoreProvider>
        <Routes>
          <Route element={<AdminShell />}>
            {/* Land on Destinations — the most-used content surface. */}
            <Route index element={<Navigate to="/destinations" replace />} />

            {/* Website content */}
            <Route path="destinations" element={<Destinations />} />
            <Route path="weekends" element={<Weekends />} />
            <Route path="adventure-styles" element={<AdventureStyles />} />
            <Route path="moments" element={<Moments />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="content" element={<Content />} />
            <Route path="policies" element={<Policies />} />
            <Route path="careers" element={<Careers />} />
            <Route path="home" element={<HomePage />} />
            <Route path="navigation" element={<Navigation />} />
            <Route path="contact" element={<Contact />} />
            <Route path="media" element={<Media />} />

            {/* Itinerary + PDF builder */}
            <Route path="itineraries" element={<Itineraries />} />

            {/* Query inbox + newsletter */}
            <Route path="queries" element={<Queries />} />
            <Route path="queries/:id" element={<QueryDetail />} />
            <Route path="newsletter" element={<Newsletter />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </StoreProvider>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
