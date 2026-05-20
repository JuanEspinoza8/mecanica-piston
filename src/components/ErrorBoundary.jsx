import { Component } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6 z-50">
          <div className="max-w-md w-full text-center">
            {/* Ícono */}
            <div className="mx-auto mb-6 w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            {/* Texto */}
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">
              Algo salió mal
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-sm leading-relaxed">
              Ocurrió un error inesperado. Podés intentar recargar la página o volver al inicio.
            </p>

            {/* Detalle del error (solo en desarrollo) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-left">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reintentar
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center px-6 py-3 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
