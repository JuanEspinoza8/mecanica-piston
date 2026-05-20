import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Plus, ClipboardList, CarFront, TrendingUp } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-900 pb-safe">
      {/* FAB "Nueva Orden" — solo visible en Inicio, flotando sobre Finanzas */}
      {isHome && (
        <Link 
          to="/ordenes/nueva" 
          className="absolute right-4 -top-20 flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-red-600 to-red-700 shadow-[0_4px_15px_rgba(220,38,38,0.5)] text-white transition-transform active:scale-95 border-[3px] border-black z-10 animate-in fade-in zoom-in-50 duration-300"
        >
          <Plus className="h-7 w-7" />
        </Link>
      )}

      <div className="grid grid-cols-5 h-14">
        <NavItem path="/" icon={Home} label="Inicio" currentPath={location.pathname} />
        <NavItem path="/clientes" icon={Users} label="Clientes" currentPath={location.pathname} />
        <NavItem path="/vehiculos" icon={CarFront} label="Vehículos" currentPath={location.pathname} />
        <NavItem path="/ordenes" icon={ClipboardList} label="Órdenes" currentPath={location.pathname} />
        <NavItem path="/economia" icon={TrendingUp} label="Finanzas" currentPath={location.pathname} />
      </div>
    </nav>
  );
}

function NavItem({ path, icon: Icon, label, currentPath }) {
  const isActive = currentPath === path || (path !== '/' && currentPath.startsWith(path));
  
  return (
    <Link 
      to={path} 
      className={`flex flex-col items-center justify-center h-full ${
        isActive ? 'text-red-500' : 'text-neutral-500 active:text-neutral-300'
      } transition-colors`}
    >
      <Icon className={`h-[18px] w-[18px] ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''} transition-all`} />
      <span className="text-[9px] font-medium tracking-wide mt-0.5">{label}</span>
    </Link>
  );
}
