import { useState } from 'react';
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react';

function App() {
  const IFRAME_URL = 'https://model-chi-two.vercel.app/';
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Iframe Tester
            </h1>
            <p className="text-slate-600">
              Testowanie zawartości iframe
            </p>
          </header>

          {!showIframe ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <button
                onClick={() => setShowIframe(true)}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
              >
                <ExternalLink size={18} />
                Otwórz zawartość
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                  title={isFullscreen ? 'Normalny widok' : 'Pełny ekran'}
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>

              <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                isFullscreen ? 'fixed inset-4 z-50' : ''
              }`}>
                <div className="relative w-full" style={{ paddingBottom: isFullscreen ? 'calc(100vh - 2rem)' : '75%' }}>
                  <iframe
                    src={IFRAME_URL}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title="Test iframe"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
