import { Loader2 } from 'lucide-react';

export default function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
      <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">Cargando...</p>
    </div>
  );
}
