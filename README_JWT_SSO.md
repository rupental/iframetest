# 🔐 Integracja JWT SSO - Strona Testowa

## ✅ Co zostało zaimplementowane

### 1. Frontend (App.tsx)
- ✅ Formularz do konfiguracji JWT (email, tier, credits)
- ✅ Integracja z API do generowania JWT
- ✅ Wysyłanie JWT do iframe przez `postMessage` z typem `gamivo-jwt`
- ✅ Obsługa odpowiedzi od ModelPass (auth-success, auth-error)
- ✅ UI z przyciskiem do generowania JWT i otwierania ModelPass

### 2. Przykładowy API Endpoint
- ✅ Plik `api/generate-jwt-example.ts` - gotowy kod do wdrożenia na Vercel
- ✅ Instrukcje w `JWT_API_SETUP.md`

## 🚀 Jak używać

### Krok 1: Wygeneruj klucze RSA (jeśli jeszcze nie masz)

```bash
openssl genrsa -out gamivo_test_private_key.pem 2048
openssl rsa -in gamivo_test_private_key.pem -pubout -out gamivo_test_public_key.pem
```

### Krok 2: Skonfiguruj klucz publiczny w ModelPass

W ModelPass, w zmiennych środowiskowych (`.env`), ustaw:
```env
GAMIVO_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
GAMIVO_JWT_ISSUER=gamivo.com
```

### Krok 3: Uruchom stronę testową

```bash
npm run dev
```

### Krok 4: Użyj formularza

1. **Wklej klucz prywatny RSA** do pola "Klucz prywatny RSA" (z pliku `gamivo_test_private_key.pem`)
2. Wpisz email użytkownika
3. Wybierz tier (free/premium/enterprise)
4. Opcjonalnie: ustaw custom limit kredytów
5. Kliknij "🔐 Wygeneruj JWT"
6. Po wygenerowaniu, kliknij "Otwórz ModelPass"
7. JWT automatycznie wyśle się do iframe i użytkownik się zaloguje!

⚠️ **UWAGA:** Klucz prywatny jest używany tylko lokalnie w przeglądarce (tylko do testów!). W produkcji NIGDY nie wklejaj klucza prywatnego w kodzie frontendowym!

## 📋 Flow działania

1. **Użytkownik wypełnia formularz** → email, tier, credits
2. **Kliknięcie "Wygeneruj JWT"** → wywołanie API endpoint
3. **API generuje JWT** → zawiera email, tier, credits_limit, sub, iss, exp
4. **JWT zapisuje się w stanie** → `jwtToken` w React
5. **Kliknięcie "Otwórz ModelPass"** → iframe się ładuje
6. **Automatyczne wysłanie JWT** → `postMessage({ type: 'gamivo-jwt', token })`
7. **ModelPass weryfikuje JWT** → backend `/api/auth/gamivo-jwt-sso`
8. **ModelPass loguje użytkownika** → tworzy/loguje w Supabase
9. **Użytkownik widzi dashboard** → ✅ sukces!

## 🔧 Konfiguracja

### Zmienne w App.tsx:
- `MODELPASS_URL` - URL aplikacji ModelPass (już ustawiony: `https://model-chi-two.vercel.app/`)
- `GAMIVO_JWT_ISSUER` - Issuer dla JWT (ustawiony na `gamivo.com`)

### Lokalne generowanie JWT:
- JWT jest generowany lokalnie w przeglądarce używając biblioteki `jose`
- Klucz prywatny jest wklejany w formularzu (tylko do testów!)
- Nie wymaga zewnętrznego API endpoint

### Format JWT Payload:
```json
{
  "sub": "gamivo-user-123",
  "email": "test@gamivo.com",
  "tier": "premium",
  "credits_limit": 200000,
  "iat": 1234567890,
  "exp": 1234567890,
  "iss": "gamivo.com"
}
```

## ✅ Checklist

### Strona Testowa:
- [x] Formularz JWT zaimplementowany
- [x] Lokalne generowanie JWT (używając `jose`)
- [x] Pole do wklejenia klucza prywatnego RSA
- [x] Wysyłanie `gamivo-jwt` do iframe
- [ ] Klucz prywatny RSA wygenerowany
- [ ] Klucz publiczny skonfigurowany w ModelPass

### ModelPass (musisz sprawdzić):
- [ ] Endpoint `/api/auth/gamivo-jwt-sso` działa
- [ ] Klucz publiczny RSA skonfigurowany w `.env`
- [ ] Frontend obsługuje `type: 'gamivo-jwt'` w postMessage
- [ ] Mapowanie tier → plan_type działa
- [ ] Kredyty są ustawiane poprawnie

## 🐛 Debugowanie

### Problem: JWT się nie generuje
- Sprawdź czy klucz prywatny jest wklejony poprawnie (musi mieć nagłówki BEGIN/END)
- Sprawdź czy klucz jest w formacie PKCS8 PEM
- Sprawdź konsolę przeglądarki (F12) - czy są błędy?
- Upewnij się, że klucz nie ma dodatkowych znaków/spacji

### Problem: JWT się nie wysyła do iframe
- Sprawdź czy iframe jest załadowany (konsola: "✅ Iframe załadowany")
- Sprawdź czy `jwtToken` jest ustawiony (powinien być widoczny w UI)
- Sprawdź konsolę - czy są logi "📤 Wysłano JWT do ModelPass"?

### Problem: ModelPass nie loguje użytkownika
- Sprawdź konsolę ModelPass (w iframe)
- Sprawdź czy endpoint `/api/auth/gamivo-jwt-sso` działa
- Sprawdź czy klucz publiczny jest poprawny
- Sprawdź czy JWT jest poprawny (możesz go zdekodować na jwt.io)

## 📝 Notatki

- JWT jest ważny 24 godziny (możesz zmienić w API)
- Klucz prywatny NIE powinien być w kodzie frontendowym!
- W produkcji sprawdź `event.origin` w postMessage dla bezpieczeństwa

