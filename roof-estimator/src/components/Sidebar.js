import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/jobs', label: 'Jobs', icon: 'briefcase' },
  { path: '/calendar', label: 'Calendar', icon: 'calendar' },
  { path: '/performance', label: 'Performance', icon: 'chart' },
  { path: '/jarvis', label: 'Jarvis AI', icon: 'jarvis', badge: 'AI' },
  { divider: true, label: 'Tools' },
  { path: '/measurements', label: 'Measurements', icon: 'ruler' },
  { path: '/proposals', label: 'Proposals', icon: 'file' },
  { path: '/pdf-signer', label: 'PDF Signer', icon: 'pen' },
  { path: '/material-orders', label: 'Material Orders', icon: 'package' },
  { path: '/work-orders', label: 'Work Orders', icon: 'clipboard' },
  { path: '/invoices', label: 'Invoices', icon: 'receipt' },
  { divider: true, label: 'Manage' },
  { path: '/contacts', label: 'Contacts', icon: 'contacts' },
  { path: '/file-manager', label: 'File Manager', icon: 'folder' },
  { path: '/communications', label: 'Communications', icon: 'communications' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="nav-sidebar">
      {/* Brand */}
      <div className="nav-brand">
        <div className="nav-brand-icon">T</div>
        <div className="nav-brand-info">
          <span className="nav-brand-name">Precision Roofing</span>
          <span className="nav-brand-email">admin@precision.com</span>
        </div>
        <svg className="nav-brand-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {/* Nav Items */}
      <nav className="nav-list">
        {NAV_ITEMS.map((item, i) => {
          if (item.divider) {
            return (
              <div key={i} className="nav-divider">
                <span>{item.label}</span>
              </div>
            );
          }
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <button
              key={i}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <NavIcon type={item.icon} />
              <span className="nav-item-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="nav-bottom">
<button className="nav-item nav-bottom-item" onClick={() => {}}>
          <NavIcon type="helpCenter" />
          <span className="nav-item-label">Help Center</span>
        </button>
        <button className="nav-item nav-bottom-item" onClick={() => navigate('/settings')}>
          <NavIcon type="settings" />
          <span className="nav-item-label">Settings</span>
          <svg className="nav-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function NavIcon({ type }) {
  const s = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
  const icons = {
    jarvis: <svg {...s}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
    home: <svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    briefcase: <svg {...s}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    calendar: <svg {...s}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    chart: <svg {...s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    globe: <svg {...s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    zap: <svg {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    ruler: <svg {...s}><path d="M21 3H3v18h18V3zM9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
    file: <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    pen: <svg {...s}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    package: <svg {...s}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
    clipboard: <svg {...s}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
    receipt: <svg {...s}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
    dollar: <svg {...s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    contacts: <svg {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    folder: <svg {...s}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    catalog: <svg {...s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    automations: <svg {...s}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    communications: <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    helpCenter: <svg {...s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    settings: <svg {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  };
  return icons[type] || null;
}
