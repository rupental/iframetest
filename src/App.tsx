import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, ExternalLink, Key } from 'lucide-react';
import { SignJWT, importPKCS8 } from 'jose';

function App() {
  // ============================================
  // KONFIGURACJA - ZMIEŃ TUTAJ
  // ============================================
  const MODELPASS_URL = 'https://model-chi-two.vercel.app/';
  const GAMIVO_JWT_ISSUER = 'gamivo.com'; // Issuer dla JWT
  
  // Mapowanie tier → domyślne kredyty
  const TIER_CREDITS = {
    free: 10000,
    premium: 200000,
    enterprise: 1000000,
  };
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [isGeneratingJWT, setIsGeneratingJWT] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Formularz JWT
  const [jwtForm, setJwtForm] = useState({
    email: 'rupental@red-sky.pl',
    tier: 'premium' as 'free' | 'premium' | 'enterprise',
    creditsLimit: '', // Opcjonalnie, jeśli puste użyje domyślnych
    privateKey: '' // Klucz prywatny RSA (tylko do testów!)
  });

  // Funkcja generująca JWT lokalnie (tylko do testów!)
  const generateJWT = async () => {
    if (!jwtForm.privateKey.trim()) {
      alert('⚠️ Wklej klucz prywatny RSA do pola "Klucz prywatny RSA"');
      return;
    }

    setIsGeneratingJWT(true);
    try {
      // Walidacja email
      if (!jwtForm.email || !jwtForm.email.includes('@')) {
        throw new Error('Podaj poprawny email');
      }

      // Ustaw kredyty (custom lub domyślne dla tier)
      const credits = jwtForm.creditsLimit 
        ? parseInt(jwtForm.creditsLimit) 
        : TIER_CREDITS[jwtForm.tier];

      // Generuj user ID
      const userId = `gamivo-${jwtForm.email.replace('@', '-').replace(/\./g, '-')}`;

      // Przygotuj klucz prywatny używając jose
      let privateKey: CryptoKey;
      try {
        // jose wymaga klucza w formacie PEM (z nagłówkami)
        const pemKey = jwtForm.privateKey.trim();
        
        // Sprawdź czy klucz ma odpowiednie nagłówki
        if (!pemKey.includes('BEGIN') || !pemKey.includes('END')) {
          throw new Error('Klucz musi być w formacie PEM z nagłówkami BEGIN/END');
        }
        
        // Importuj klucz używając jose
        privateKey = await importPKCS8(pemKey, 'RS256');
      } catch (keyError) {
        console.error('Błąd importu klucza:', keyError);
        throw new Error(`Błąd parsowania klucza prywatnego: ${keyError instanceof Error ? keyError.message : 'Nieznany błąd'}. Upewnij się, że klucz jest w formacie PKCS8 PEM.`);
      }

      // Payload JWT
      const payload = {
        sub: userId,
        email: jwtForm.email,
        tier: jwtForm.tier,
        credits_limit: credits,
        iss: GAMIVO_JWT_ISSUER,
      };

      // Generuj JWT używając jose
      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer(GAMIVO_JWT_ISSUER)
        .sign(privateKey);

      setJwtToken(jwt);
      console.log('✅ JWT wygenerowany lokalnie:', jwt);
      console.log('📋 Payload:', payload);
      
      // Automatycznie wyślij JWT do iframe jeśli jest już otwarty
      if (showIframe && iframeRef.current) {
        sendGamivoJWT(jwt);
      }
    } catch (error) {
      console.error('❌ Błąd generowania JWT:', error);
      alert(`Błąd generowania JWT: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    } finally {
      setIsGeneratingJWT(false);
    }
  };

  // Funkcja wysyłająca JWT do iframe
  const sendGamivoJWT = (token: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) {
      console.warn('⚠️ Iframe nie jest gotowy, próba ponownie za chwilę...');
      setTimeout(() => sendGamivoJWT(token), 500);
      return;
    }
    
    iframe.contentWindow.postMessage({
      type: 'gamivo-jwt',
      token: token
    }, '*');
    
    console.log('📤 Wysłano JWT do ModelPass');
  };

  // Obsługa komunikacji postMessage
  useEffect(() => {
    if (!showIframe) return;

    const handleMessage = (event: MessageEvent) => {
      // W produkcji sprawdź event.origin!
      // if (event.origin !== 'https://model-chi-two.vercel.app') return;
      
      if (event.data && typeof event.data === 'object') {
        // Iframe prosi o JWT
        if (event.data.type === 'request-jwt' || event.data.type === 'request-user') {
          console.log('📥 Otrzymano prośbę o JWT');
          if (jwtToken) {
            sendGamivoJWT(jwtToken);
          } else {
            console.warn('⚠️ JWT nie został jeszcze wygenerowany');
          }
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
        console.log('✅ Iframe załadowany');
        // Wyślij JWT jeśli jest już wygenerowany
        if (jwtToken) {
          setTimeout(() => sendGamivoJWT(jwtToken), 1000);
        }
      };
      
      iframe.addEventListener('load', handleLoad);
      
      // Wyślij JWT również po 2 sekundach (backup) jeśli jest dostępny
      if (jwtToken) {
        timeoutId = setTimeout(() => sendGamivoJWT(jwtToken), 2000);
      }
      
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
  }, [showIframe, jwtToken]);

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
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                  Konfiguracja JWT SSO
                </h2>
                <p className="text-slate-600 mb-6">
                  Skonfiguruj dane użytkownika i wygeneruj JWT token do logowania SSO
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email użytkownika
                    </label>
                    <input
                      type="email"
                      value={jwtForm.email}
                      onChange={(e) => setJwtForm({ ...jwtForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="test@gamivo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tier subskrypcji
                    </label>
                    <select
                      value={jwtForm.tier}
                      onChange={(e) => setJwtForm({ ...jwtForm, tier: e.target.value as 'free' | 'premium' | 'enterprise' })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      <option value="free">Free (10,000 kredytów)</option>
                      <option value="premium">Premium (200,000 kredytów)</option>
                      <option value="enterprise">Enterprise (1,000,000 kredytów)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Custom limit kredytów (opcjonalnie)
                    </label>
                    <input
                      type="number"
                      value={jwtForm.creditsLimit}
                      onChange={(e) => setJwtForm({ ...jwtForm, creditsLimit: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="Pozostaw puste dla domyślnych wartości"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Jeśli puste, użyje domyślnych wartości dla wybranego tier
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Klucz prywatny RSA (tylko do testów!) ⚠️
                    </label>
                    <textarea
                      value={jwtForm.privateKey}
                      onChange={(e) => setJwtForm({ ...jwtForm, privateKey: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-xs"
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                      rows={6}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      ⚠️ Wklej klucz prywatny RSA w formacie PEM (PKCS8). Tylko do testów!
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={generateJWT}
                      disabled={isGeneratingJWT}
                      className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Key size={18} />
                      {isGeneratingJWT ? 'Generowanie...' : '🔐 Wygeneruj JWT'}
                    </button>
                    
                    {jwtToken && (
                      <button
                        onClick={() => setShowIframe(true)}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={18} />
                        Otwórz ModelPass
                      </button>
                    )}
                  </div>
                  
                  {jwtToken && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        ✅ JWT wygenerowany pomyślnie!
                      </p>
                      <p className="text-xs text-green-700 font-mono break-all">
                        {jwtToken.substring(0, 50)}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {!jwtToken && (
                <div className="text-center">
                  <p className="text-slate-600 mb-4">
                    Wygeneruj JWT token, aby kontynuować
                  </p>
                </div>
              )}
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
