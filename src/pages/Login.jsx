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
    
    toast.success('¡Bienvenido al taller!');
    navigate('/');
  };

  // ===================== LOGIN SCREEN (Split Layout) =====================
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

      </div>

      {/* ===== LADO DERECHO: Logo del Pistón (solo desktop) ===== */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden">
        
        {/* Glow rojo sutil de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]"></div>
        </div>

        {/* Logo del Pistón - mix-blend-mode hace invisible el fondo negro */}
        <img 
          src="/logo-dark.png" 
          alt="Mecánica Pistón - Mascota" 
          className="w-[500px] h-[500px] object-contain hover:scale-105 transition-transform duration-700 ease-out select-none mix-blend-lighten" 
          draggable="false"
        />
      </div>

    </div>
  );
}
