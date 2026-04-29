import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Plus, ClipboardList, Search, CarFront } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-900 pb-safe">
      <div className="flex justify-around items-center h-16 px-2 relative">
        
        <NavItem path="/" icon={Home} label="Inicio" currentPath={location.pathname} />
        <NavItem path="/clientes" icon={Users} label="Clientes" currentPath={location.pathname} />
        
        {/* Botón Central Destacado (Nueva Orden) */}
        <div className="flex flex-col items-center justify-center w-14 shrink-0">
          <Link 
            to="/ordenes/nueva" 
            className="absolute -top-6 flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-red-600 to-red-700 shadow-[0_4px_15px_rgba(220,38,38,0.5)] text-white transform transition-transform active:scale-95 border-4 border-neutral-100"
          >
            <Plus className="h-8 w-8" />
          </Link>
          {/* Label debajo del botón flotante */}
          <span className="text-[10px] font-medium tracking-wide text-neutral-500 mt-8">Nueva</span>
        </div>
        
        <NavItem path="/ordenes" icon={ClipboardList} label="Órdenes" currentPath={location.pathname} />
        <NavItem path="/vehiculos" icon={CarFront} label="Vehículos" currentPath={location.pathname} />

      </div>
    </nav>
  );
}

function NavItem({ path, icon: Icon, label, currentPath }) {
  const isActive = currentPath === path || (path !== '/' && currentPath.startsWith(path));
  
  return (
    <Link 
      to={path} 
      className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${
        isActive ? 'text-red-500' : 'text-neutral-500 active:text-neutral-300'
      } transition-colors`}
    >
      <Icon className={`h-5 w-5 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''} transition-all`} />
      <span className="text-[10px] sm:text-xs font-medium tracking-wide truncate max-w-full px-1 text-center">{label}</span>
    </Link>
  );
}
