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
      <div className="min-h-screen bg-slate-900 text-white">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <div className="text-lg font-semibold tracking-wide text-white">
              POS Warung
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-300">
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
                      "rounded-full px-3 py-2 transition-colors",
                      isActive
                        ? "bg-slate-700 text-white"
                        : "hover:bg-slate-800 hover:text-white",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6">
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
