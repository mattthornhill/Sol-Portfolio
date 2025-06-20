# Important: Update Your Environment Variables

To fix the authentication error, you need to add your Alchemy API key to both environment variables in your `.env.local` file:

```
# For client-side code (browser)
NEXT_PUBLIC_SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# For server-side code (API routes) - SAME VALUE
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

Replace `YOUR_API_KEY` with your actual Alchemy API key.

After updating, restart your development server:
```bash
npm run dev
```

This is necessary because Next.js API routes (server-side) cannot access environment variables prefixed with `NEXT_PUBLIC_`.