import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <img 
        src="/404-icon.png" 
        alt="Engranaje Roto" 
        className="w-48 h-48 md:w-64 md:h-64 object-contain mb-8 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse" 
      />
      
      <h1 className="text-6xl font-black text-black tracking-tighter mb-2">
        Error <span className="text-red-600">404</span>
      </h1>
      
      <h2 className="text-2xl font-bold text-neutral-800 mb-4">
        ¡Ups! Parece que fundimos motor.
      </h2>
      
      <p className="text-neutral-500 max-w-md mb-10">
        La página que estás buscando no existe, fue movida o el enlace está roto. Mejor volvamos al taller antes de que empeore.
      </p>
      
      <Link 
        to="/" 
        className="group flex items-center justify-center bg-black hover:bg-neutral-900 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
      >
        <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        Volver al Inicio
      </Link>
    </div>
  );
}
