import { Link, useLocation } from 'react-router-dom';
import { Home, Users, ClipboardList, Search, CarFront } from 'lucide-react';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Vehículos', path: '/vehiculos', icon: CarFront },
    { name: 'Órdenes', path: '/ordenes', icon: ClipboardList },
  ];

  return (
    <div className="flex h-screen bg-neutral-100 font-sans">
      {/* Sidebar (Solo en Desktop) */}
      <aside className="hidden w-64 flex-col bg-black text-neutral-300 md:flex border-r border-neutral-900 shadow-2xl z-20">
        {/* Logo / Nombre de la App */}
        <div className="flex h-24 items-center border-b border-neutral-800 px-5 font-bold text-white bg-black">
          <img 
            src="/logo.png" 
            alt="Pistón Logo" 
            className="mr-3 h-12 w-12 object-contain mix-blend-screen drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]" 
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
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30' 
                    : 'hover:bg-neutral-900 hover:text-white hover:translate-x-1'
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
      </aside>

      {/* Contenedor Principal (Header + Contenido) */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        
        {/* Header (Visible en Desktop y Mobile) */}
        <header className="flex h-20 items-center justify-between bg-black px-4 shadow-md md:px-8 border-b border-neutral-900 z-10 md:bg-white md:shadow-[0_4px_30px_rgba(0,0,0,0.05)] md:border-neutral-100">
          {/* Logo en Mobile */}
          <div className="flex items-center md:hidden overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Pistón Logo" 
              className="mr-2 h-10 w-10 object-contain mix-blend-screen drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] shrink-0" 
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
          
          <div className="flex-1 md:hidden"></div>
          
          {/* Barra de búsqueda interactiva */}
          <div className="hidden max-w-2xl flex-1 md:block">
            <div className="group flex h-12 w-full items-center rounded-full border border-neutral-200 bg-neutral-50 px-5 text-sm text-neutral-400 transition-all focus-within:border-red-500 focus-within:bg-white focus-within:shadow-md focus-within:shadow-red-500/10 hover:bg-white hover:border-neutral-300">
              <Search className="mr-3 h-5 w-5 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="text"
                placeholder="Buscar por patente, modelo, nombre o teléfono..." 
                className="w-full bg-transparent outline-none text-neutral-800 placeholder:text-neutral-400 font-medium"
              />
            </div>
          </div>
        </header>

        {/* Contenido de la página actual */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8 bg-neutral-50/50">
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
