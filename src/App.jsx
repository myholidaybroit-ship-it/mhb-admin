import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./shell/auth.jsx";
import { StoreProvider } from "./lib/store.jsx";
import { ToastProvider } from "./ui/kit.jsx";
import AdminShell from "./shell/AdminShell.jsx";
import Login from "./shell/Login.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import HomePage from "./pages/Home.jsx";
import Contact from "./pages/Contact.jsx";
import Destinations from "./pages/Destinations.jsx";
import Weekends from "./pages/Weekends.jsx";
import AdventureStyles from "./pages/AdventureStyles.jsx";
import Content from "./pages/Content.jsx";
import Media from "./pages/Media.jsx";
import Enquiries from "./pages/Enquiries.jsx";
import Users from "./pages/Users.jsx";
import Itineraries from "./pages/Itineraries.jsx";
import Library from "./pages/Library.jsx";
import Moments from "./pages/Moments.jsx";
import Careers from "./pages/Careers.jsx";
import Policies from "./pages/Policies.jsx";
import Travelers from "./pages/Travelers.jsx";
import PackageAssignments from "./pages/PackageAssignments.jsx";

function Gate() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="login-screen"><div className="spinner" /></div>;
  if (!user) return <Login />;
  return (
    <ToastProvider>
      <StoreProvider>
        <Routes>
          <Route element={<AdminShell />}>
            <Route index element={<Dashboard />} />
            <Route path="home" element={<HomePage />} />
            <Route path="contact" element={<Contact />} />
            <Route path="destinations" element={<Destinations />} />
            <Route path="weekends" element={<Weekends />} />
            <Route path="itineraries" element={<Itineraries />} />
            <Route path="library" element={<Library />} />
            <Route path="adventure-styles" element={<AdventureStyles />} />
            <Route path="moments" element={<Moments />} />
            <Route path="content" element={<Content />} />
            <Route path="careers" element={<Careers />} />
            <Route path="policies" element={<Policies />} />
            <Route path="travelers" element={<Travelers />} />
            <Route path="assignments" element={<PackageAssignments />} />
            <Route path="media" element={<Media />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="users" element={<Users />} />
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
