import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, ClipboardList, Search, CarFront, Moon, Sun, LogOut } from 'lucide-react';
import BottomNav from './BottomNav';
import useAppStore from '../store/useAppStore';
import GlobalSearch from './GlobalSearch';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, openSearch, logout, user } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Vehículos', path: '/vehiculos', icon: CarFront },
    { name: 'Órdenes', path: '/ordenes', icon: ClipboardList },
  ];

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-950 font-sans transition-colors duration-300">
      <GlobalSearch />
      
      {/* Sidebar (Solo en Desktop) */}
      <aside className="hidden w-64 flex-col bg-black dark:bg-black/95 text-neutral-300 md:flex border-r border-neutral-900 dark:border-red-900/30 shadow-2xl z-20">
        {/* Logo / Nombre de la App */}
        <div className="flex h-24 items-center border-b border-neutral-800 dark:border-red-900/50 px-5 font-bold text-white bg-black dark:bg-black/90">
          <img 
            src="/logo-dark.png?v=2" 
            alt="Pistón Logo" 
            className="mr-3 h-12 w-auto object-contain mix-blend-lighten drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]" 
          />
          <div className="flex flex-col justify-center overflow-hidden">
            <span className="text-sm md:text-base tracking-widest font-extrabold uppercase leading-none text-neutral-100 truncate">
              Mecánica
            </span>
            <span className="text-lg md:text-xl tracking-wider font-black uppercase text-red-600 leading-tight truncate">
              Pistón
            </span>
          </div>
        </div>
        
        {/* Links de Navegación */}
        <nav className="flex-1 space-y-2 p-4 mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center rounded-xl px-4 py-3.5 transition-all duration-300 ease-in-out ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 dark:shadow-red-600/10 dark:border dark:border-red-600/50' 
                    : 'hover:bg-neutral-900 dark:hover:bg-red-950/20 hover:text-white hover:translate-x-1'
                }`}
              >
                <Icon 
                  className={`mr-3 h-5 w-5 transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-red-500'
                  }`} 
                />
                <span className="font-medium tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Botón Cerrar Sesión */}
        <div className="p-4 border-t border-neutral-800 dark:border-red-900/30">
          <button
            onClick={handleLogout}
            className="group flex items-center w-full rounded-xl px-4 py-3 text-neutral-500 hover:bg-red-950/30 hover:text-red-400 transition-all duration-300"
          >
            <LogOut className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium tracking-wide text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenedor Principal (Header + Contenido) */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        
        {/* Header (Visible en Desktop y Mobile) */}
        <header className="flex h-20 items-center justify-between bg-black md:bg-white dark:md:bg-neutral-950 px-4 shadow-md md:px-8 border-b border-neutral-900 md:border-neutral-100 dark:md:border-red-900/30 z-10 transition-colors duration-300">
          {/* Logo en Mobile */}
          <div className="flex items-center md:hidden overflow-hidden">
            <img 
              src="/logo-dark.png?v=2" 
              alt="Pistón Logo" 
              className="mr-2 h-10 w-auto object-contain mix-blend-lighten drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] shrink-0" 
            />
            <div className="flex flex-col justify-center overflow-hidden">
              <span className="text-xs sm:text-sm tracking-widest font-extrabold uppercase leading-none text-neutral-100 truncate">
                Mecánica
              </span>
              <span className="text-xs sm:text-sm tracking-wider font-black uppercase text-red-600 leading-tight truncate">
                Pistón
              </span>
            </div>
          </div>
          
          <div className="flex-1 md:hidden flex justify-end">
            {/* Botón Theme Mobile */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-neutral-400 hover:text-white transition-colors mr-2"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-red-500" /> : <Moon className="w-5 h-5" />}
            </button>
            {/* Botón Buscar Mobile */}
            <button 
              onClick={() => navigate('/buscar')}
              className="p-2 text-neutral-400 hover:text-white transition-colors mr-2"
            >
              <Search className="w-5 h-5" />
            </button>
            {/* Botón Logout Mobile */}
            <button 
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* Barra de búsqueda interactiva Desktop */}
          <div className="hidden max-w-2xl flex-1 md:flex items-center space-x-4">
            <button 
              onClick={openSearch}
              className="group flex h-12 w-full max-w-md items-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-5 text-sm text-neutral-400 transition-all hover:border-red-500 dark:hover:border-red-500/50 hover:bg-white dark:hover:bg-neutral-800"
            >
              <Search className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-red-500 transition-colors" />
              <span className="text-neutral-400 font-medium">Buscar clientes o vehículos (Ctrl+K)...</span>
            </button>

            {/* Botón Theme Desktop */}
            <button 
              onClick={toggleTheme}
              className="p-3 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-red-950/30 rounded-full transition-colors border border-transparent dark:hover:border-red-900/50 text-neutral-600 dark:text-red-500"
              title="Cambiar Modo"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Contenido de la página actual */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8 bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* BottomNav (Solo en Mobile) */}
        <BottomNav />
      </div>
    </div>
  );
}
