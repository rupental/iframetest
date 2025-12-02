import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react';

function App() {
  // ============================================
  // KONFIGURACJA - ZMIEŃ TUTAJ
  // ============================================
  const MODELPASS_URL = 'https://model-chi-two.vercel.app/';
  
  // Symulowane dane użytkownika Gamivo (dla testów)
  const GAMIVO_USER = {
    email: 'test@gamivo.com',        // ← Email użytkownika do testów
    token: 'gamivo-mock-token-123',  // ← Token/hasło (musi być hasłem użytkownika w ModelPass)
    userId: 'gamivo-user-42'         // ← ID użytkownika (opcjonalnie)
  };
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Funkcja wysyłająca dane użytkownika do iframe
  const sendGamivoUserData = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) {
      console.warn('⚠️ Iframe nie jest gotowy, próba ponownie za chwilę...');
      setTimeout(sendGamivoUserData, 500);
      return;
    }
    
    // Format 1: user-data z payloadem (zalecany)
    iframe.contentWindow.postMessage({
      type: 'user-data',
      payload: GAMIVO_USER
    }, '*');
    
    // Format 2: gamivo-user bezpośrednio (alternatywny)
    iframe.contentWindow.postMessage({
      type: 'gamivo-user',
      email: GAMIVO_USER.email,
      token: GAMIVO_USER.token,
      userId: GAMIVO_USER.userId
    }, '*');
    
    console.log('📤 Wysłano dane użytkownika Gamivo:', GAMIVO_USER);
  };

  // Obsługa komunikacji postMessage
  useEffect(() => {
    if (!showIframe) return;

    const handleMessage = (event: MessageEvent) => {
      // W produkcji sprawdź event.origin!
      // if (event.origin !== 'https://your-modelpass.vercel.app') return;
      
      if (event.data && typeof event.data === 'object') {
        // Iframe prosi o dane użytkownika Gamivo
        if (event.data.type === 'request-user') {
          console.log('📥 Otrzymano prośbę o dane użytkownika');
          sendGamivoUserData();
        }
        
        // Obsługa odpowiedzi od iframe (opcjonalnie)
        if (event.data.type === 'auth-success') {
          console.log('✅ Użytkownik zalogowany! User ID:', event.data.userId);
        }
        
        if (event.data.type === 'auth-error') {
          console.error('❌ Błąd logowania:', event.data.message);
        }
        
        if (event.data.type === 'auth-logout') {
          console.log('👋 Użytkownik wylogowany');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const iframe = iframeRef.current;
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (iframe) {
      const handleLoad = () => {
        console.log('✅ Iframe załadowany, wysyłanie danych użytkownika...');
        setTimeout(sendGamivoUserData, 1000);
      };
      
      iframe.addEventListener('load', handleLoad);
      
      // Wyślij dane również po 2 sekundach (backup)
      timeoutId = setTimeout(sendGamivoUserData, 2000);
      
      console.log('🚀 ModelPass iframe załadowany:', MODELPASS_URL);

      return () => {
        window.removeEventListener('message', handleMessage);
        iframe.removeEventListener('load', handleLoad);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showIframe]);

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
                    ref={iframeRef}
                    id="modelpass-iframe"
                    src={MODELPASS_URL}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title="Test iframe"
                    allow="clipboard-read; clipboard-write"
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
