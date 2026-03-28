import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bed,
  Stethoscope,
  UsersRound,
  FileText,
  Bot,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { seedDatabase } from '../lib/seed';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/beds', label: 'Bed Management', icon: Bed },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/families', label: 'Family Portal', icon: UsersRound },
  { to: '/discharge', label: 'Discharge Records', icon: FileText },
  { to: '/dr-obvi', label: 'Dr. Obvi', icon: Bot },
];

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await seedDatabase();
        setSeeded(true);
      } catch (error) {
        console.error('Failed to seed database:', error);
      }
    };
    initializeDB();
  }, []);

  if (!seeded) {
    return (
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#2D7DD2] border-t-transparent mb-4"></div>
          <p className="text-white text-lg">Initializing DoctorVault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0F2C] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#2D7DD2] rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">DoctorVault</h1>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Because every hospital is overbooked.
            </p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#2D7DD2] text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              v1.0.0
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1 lg:flex-none"></div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
