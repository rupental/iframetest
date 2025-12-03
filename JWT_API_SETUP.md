# 🔐 Instrukcja - API do generowania JWT

## 📋 Co jest potrzebne

Aby strona testowa mogła generować JWT tokeny, potrzebujesz endpoint API. Oto jak to skonfigurować na Vercel.

## 🚀 Opcja 1: Vercel Serverless Function (ZALECANE)

### Krok 1: Utwórz nowy projekt na Vercel lub dodaj do istniejącego

### Krok 2: Utwórz strukturę plików

```
your-jwt-api/
├── api/
│   └── generate-jwt.ts
├── package.json
└── vercel.json (opcjonalnie)
```

### Krok 3: Zainstaluj zależności

```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

### Krok 4: Skopiuj klucz prywatny

Skopiuj `gamivo_test_private_key.pem` do projektu (lub użyj zmiennej środowiskowej).

### Krok 5: Skopiuj kod API (patrz plik `api/generate-jwt-example.ts`)

### Krok 6: Skonfiguruj zmienne środowiskowe na Vercel

W ustawieniach projektu Vercel dodaj:
- `GAMIVO_JWT_PRIVATE_KEY` - zawartość pliku `gamivo_test_private_key.pem`
- `GAMIVO_JWT_ISSUER` - `gamivo.com`

### Krok 7: Zaktualizuj URL w App.tsx

W `src/App.tsx` zmień:
```typescript
const JWT_API_URL = 'https://your-jwt-api.vercel.app/api/generate-jwt';
```

## 📝 Przykładowy kod API

Zobacz plik `api/generate-jwt-example.ts` w tym projekcie.

## 🔄 Alternatywa: Użyj istniejącego API

Jeśli masz już API endpoint, który generuje JWT, po prostu zaktualizuj `JWT_API_URL` w `App.tsx`.

---

## ✅ Checklist

- [ ] Endpoint API utworzony i zdeployowany
- [ ] Klucz prywatny skonfigurowany (w zmiennych środowiskowych lub pliku)
- [ ] `JWT_API_URL` zaktualizowany w `App.tsx`
- [ ] API zwraca JSON z `{ token: "..." }`
- [ ] API akceptuje POST z `{ email, tier, credits_limit? }`

