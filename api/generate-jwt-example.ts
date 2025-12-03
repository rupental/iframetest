/**
 * Przykładowy endpoint API do generowania JWT dla Gamivo SSO
 * 
 * Wdrożenie na Vercel:
 * 1. Utwórz folder `api/` w głównym katalogu projektu
 * 2. Skopiuj ten plik jako `api/generate-jwt.ts`
 * 3. Zainstaluj zależności: npm install jsonwebtoken @types/jsonwebtoken
 * 4. Skonfiguruj zmienne środowiskowe na Vercel
 * 5. Zdeployuj projekt
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// Mapowanie tier → domyślne kredyty
const TIER_CREDITS = {
  free: 10000,
  premium: 200000,
  enterprise: 1000000,
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Tylko POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, tier, credits_limit } = req.body;

    // Walidacja
    if (!email || !tier) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, tier' 
      });
    }

    if (!['free', 'premium', 'enterprise'].includes(tier)) {
      return res.status(400).json({ 
        error: 'Invalid tier. Must be: free, premium, or enterprise' 
      });
    }

    // Pobierz klucz prywatny z zmiennych środowiskowych
    const privateKey = process.env.GAMIVO_JWT_PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ GAMIVO_JWT_PRIVATE_KEY nie jest ustawiony');
      return res.status(500).json({ 
        error: 'Server configuration error' 
      });
    }

    // Ustaw kredyty (custom lub domyślne dla tier)
    const credits = credits_limit 
      ? parseInt(credits_limit.toString()) 
      : TIER_CREDITS[tier as keyof typeof TIER_CREDITS];

    // Generuj user ID (możesz użyć email jako base)
    const userId = `gamivo-${email.replace('@', '-').replace('.', '-')}`;

    // Payload JWT
    const payload = {
      sub: userId,
      email: email,
      tier: tier,
      credits_limit: credits,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 godziny
      iss: process.env.GAMIVO_JWT_ISSUER || 'gamivo.com',
    };

    // Generuj JWT (RS256)
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
    });

    console.log('✅ JWT wygenerowany dla:', email, 'tier:', tier);

    return res.status(200).json({
      token: token,
      payload: payload, // Opcjonalnie, dla debugowania
    });

  } catch (error) {
    console.error('❌ Błąd generowania JWT:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

