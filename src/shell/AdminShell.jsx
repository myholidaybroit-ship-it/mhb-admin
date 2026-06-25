import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "./nav.js";
import { useAuth } from "./auth.jsx";
import Icon from "../ui/icons.jsx";
import { IconButton } from "../ui/kit.jsx";

const LOGO_WHITE = "https://res.cloudinary.com/dyxxkrq8r/image/upload/v1779211833/MHB_Logo_white_b2exxe.avif";

function flatTitle(pathname) {
  for (const it of NAV_ITEMS) {
    if (it.to !== "/" && pathname.startsWith(it.to)) return it.label;
  }
  return "MyHolidayBro";
}

export default function AdminShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img className="sidebar-brand-logo" src={LOGO_WHITE} alt="MyHolidayBro" />
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon name={it.icon} size={18} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <span className="avatar">{(user?.name || "A").charAt(0)}</span>
            <div className="grow truncate">
              <div className="sidebar-user-name truncate">{user?.name}</div>
              <div className="sidebar-user-mail truncate">{user?.email}</div>
            </div>
            <button className="sidebar-logout" title="Log out" onClick={logout}>
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen(true)} aria-label="Menu">
            <Icon name="menu" size={20} />
          </button>
          <div className="topbar-title">{flatTitle(loc.pathname)}</div>
          <div className="grow" />
          <a className="topbar-link" href="http://localhost:3000" target="_blank" rel="noreferrer">
            <Icon name="external" size={15} />
            View site
          </a>
          <span className="topbar-avatar">{(user?.name || "A").charAt(0)}</span>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
