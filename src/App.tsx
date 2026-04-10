import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";
import InventoryPage from "./pages/InventoryPage";
import { DashboardPage } from "./pages/DashboardPage";
import { KasbonPage } from "./pages/KasbonPage";
import { PosPage } from "./pages/PosPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-surface-base)] text-white">
        <header className="border-b border-[var(--color-surface-border)] bg-[var(--color-surface-panel)]/80 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-bold text-white shadow-lg shadow-blue-500/20">
                P
              </div>
              <div className="text-xl font-bold tracking-tight text-white">
                POS Warung
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-300 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50">
              {[
                { to: "/kasir", label: "Kasir" },
                { to: "/kasbon", label: "Kasbon" },
                { to: "/inventaris", label: "Inventaris" },
                { to: "/dashboard", label: "Dashboard" },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "rounded-xl px-4 py-2 transition-all duration-200",
                      isActive
                        ? "bg-blue-500 text-white shadow-md"
                        : "hover:bg-slate-700 hover:text-white",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/kasir" replace />} />
            <Route path="/kasir" element={<PosPage />} />
            <Route path="/kasbon" element={<KasbonPage />} />
            <Route path="/inventaris" element={<InventoryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
