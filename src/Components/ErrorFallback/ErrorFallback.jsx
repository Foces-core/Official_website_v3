import PropTypes from 'prop-types';

export function ErrorFallback({ error, resetError }) {
  const handleReload = () => {
    if (resetError) resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    if (resetError) resetError();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-[#141416] border border-white/10 rounded-2xl p-8 shadow-2xl text-center relative z-10">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          An unexpected glitch occurred. Don&apos;t worry, you can easily reload the page or return
          home.
        </p>

        {import.meta.env.DEV && error?.message && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-left text-xs font-mono text-red-300 overflow-x-auto max-h-32">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReload}
            className="w-full sm:w-auto px-6 py-2.5 bg-white text-black font-semibold text-sm rounded-xl shadow-lg hover:bg-cyan-400 hover:text-black transition-all duration-200"
          >
            Refresh Page
          </button>
          <button
            type="button"
            onClick={handleGoHome}
            className="w-full sm:w-auto px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 transition-all duration-200"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

ErrorFallback.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  resetError: PropTypes.func,
};

export default ErrorFallback;
