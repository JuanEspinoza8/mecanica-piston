import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import useAppStore from '../store/useAppStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Completá todos los campos');
      return;
    }

    setIsLoading(true);

    // Simular validación (Juan reemplazará con supabase.auth.signInWithPassword)
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Simulamos login exitoso
    login({ email, nombre: email.split('@')[0] });
    setIsLoading(false);
    
    // Mostrar splash screen antes del dashboard
    setShowSplash(true);
    
    await new Promise(resolve => setTimeout(resolve, 2800));
    
    toast.success('¡Bienvenido al taller!');
    navigate('/');
  };

  // ===================== SPLASH SCREEN =====================
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-[200] overflow-hidden">
        
        {/* Partículas decorativas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Logo del Pistón animado */}
        <div className="relative mb-8">
          <div className="w-32 h-32 border-4 border-red-600/30 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
            <div className="w-28 h-28 border-4 border-transparent border-t-red-600 rounded-full"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <img src="/logo.png" alt="Pistón" className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          </div>
        </div>

        {/* Texto animado */}
        <h1 className="text-4xl font-black text-white tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          MECÁNICA PISTÓN
        </h1>
        <p className="text-neutral-500 text-sm tracking-[0.3em] uppercase animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
          Preparando el taller...
        </p>

        {/* Barra de progreso */}
        <div className="w-48 h-1 bg-neutral-800 rounded-full mt-8 overflow-hidden animate-in fade-in duration-500" style={{ animationDelay: '600ms' }}>
          <div className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full animate-loading-bar"></div>
        </div>

        {/* SVG del auto en movimiento */}
        <div className="absolute bottom-16 w-full overflow-hidden">
          <div className="animate-drive-car">
            <svg width="120" height="50" viewBox="0 0 120 50" className="text-red-600/40">
              <path d="M20,35 L25,20 L45,15 L55,10 L80,10 L95,15 L100,25 L105,30 L105,35 Z" fill="currentColor" />
              <circle cx="35" cy="40" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="35" cy="40" r="3" fill="currentColor" />
              <circle cx="90" cy="40" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="90" cy="40" r="3" fill="currentColor" />
              <rect x="55" y="15" width="15" height="10" rx="2" fill="currentColor" opacity="0.5" />
              <rect x="38" y="17" width="12" height="8" rx="2" fill="currentColor" opacity="0.5" />
              {/* Humo del escape */}
              <circle cx="10" cy="32" r="4" fill="currentColor" opacity="0.15" className="animate-pulse" />
              <circle cx="3" cy="28" r="3" fill="currentColor" opacity="0.1" className="animate-pulse" style={{ animationDelay: '200ms' }} />
              <circle cx="-3" cy="25" r="2" fill="currentColor" opacity="0.05" className="animate-pulse" style={{ animationDelay: '400ms' }} />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // ===================== LOGIN SCREEN (Split Layout) =====================
  return (
    <div className="fixed inset-0 bg-neutral-950 flex overflow-hidden">
      
      {/* ===== LADO IZQUIERDO: Formulario ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 relative z-10">
        
        {/* Fondo decorativo izquierdo */}
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <div className="relative w-full max-w-md">
          
          {/* Logo pequeño + Marca (solo visible en mobile donde no se ve el lado derecho) */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-4 lg:hidden">
              <img 
                src="/logo.png" 
                alt="Mecánica Pistón" 
                className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" 
              />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              MECÁNICA
            </h1>
            <h2 className="text-4xl sm:text-5xl font-black text-red-500 tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              PISTÓN
            </h2>
            <p className="text-neutral-500 text-sm mt-3 tracking-widest uppercase">Sistema de Gestión del Taller</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm"
                    placeholder="mecanico@pistontaller.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Botón de Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-neutral-700 disabled:to-neutral-800 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/30 hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-wide"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Verificando credenciales...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Ingresar al Taller
                </>
              )}
            </button>

            <p className="text-center text-neutral-600 text-xs mt-6">
              ¿Olvidaste tu contraseña? Contacta al administrador del taller.
            </p>
          </form>

        </div>

        {/* Línea divisoria vertical con brillo rojo */}
        <div className="hidden lg:block absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-red-600/30 to-transparent"></div>
      </div>

      {/* ===== LADO DERECHO: Logo del Pistón (solo desktop) ===== */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden">
        
        {/* Glow rojo de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/8 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-red-500/5 rounded-full blur-[80px]"></div>
        </div>

        {/* Líneas decorativas de fondo */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="absolute top-20 left-10 w-32 h-32 border border-white rounded-full"></div>
          <div className="absolute bottom-32 right-16 w-48 h-48 border border-white rounded-full"></div>
          <div className="absolute top-1/3 right-1/4 w-20 h-20 border border-white rotate-45"></div>
        </div>

        {/* Logo del Pistón grande */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-radial pointer-events-none z-10" 
               style={{ background: 'radial-gradient(circle, transparent 40%, #0a0a0a 75%)' }}>
          </div>
          <img 
            src="/logo-dark.png" 
            alt="Mecánica Pistón - Mascota" 
            className="w-[500px] h-[500px] object-contain hover:scale-105 transition-transform duration-700 ease-out select-none" 
            draggable="false"
          />
        </div>

        {/* Líneas decorativas de taller */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-transparent to-red-600/20"></div>
      </div>

    </div>
  );
}
