# Setting Up Alchemy for Solana Wallet Inspector

## Why Alchemy?

Alchemy provides a reliable, fast Solana RPC endpoint with generous free tier limits:
- **300 Million compute units per month** (free tier)
- Better rate limits than public endpoints
- Enhanced APIs for NFT and token data
- Reliable uptime and low latency

## Quick Setup

1. **Create an Alchemy Account**
   - Go to [https://www.alchemy.com/](https://www.alchemy.com/)
   - Sign up for a free account

2. **Create a Solana App**
   - From your dashboard, click "Create App"
   - Choose "Solana" as the chain
   - Select "Solana Mainnet"
   - Give your app a name (e.g., "Solana Wallet Inspector")

3. **Get Your API Key**
   - Click on your app to view details
   - Copy the HTTPS endpoint URL (it looks like: `https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY`)

4. **Add to Your Project**
   - Open your `.env.local` file
   - Add your Alchemy endpoint:
   ```
   NEXT_PUBLIC_SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   ```

5. **Restart Your Dev Server**
   ```bash
   npm run dev
   ```

## Rate Limits

Alchemy's free tier includes:
- 300M compute units/month
- ~10 requests per second burst
- No daily limits

Typical usage:
- `getBalance`: 26 compute units
- `getTokenAccountsByOwner`: 263 compute units
- `getMultipleAccounts`: 101 compute units per account

With 300M units, you can make ~1M+ wallet queries per month!

## Monitoring Usage

You can monitor your usage in the Alchemy dashboard:
1. Go to your app dashboard
2. Click on "Metrics"
3. View compute units used, request count, and more

## Upgrading

If you need more capacity:
- Growth tier: $49/month for 1.5B compute units
- Scale tier: Custom pricing for higher volumes

## Troubleshooting

If you see 429 errors:
1. Check your Alchemy dashboard for usage
2. Ensure you're using your own API key (not the demo key)
3. The app already implements retry logic with exponential backoff

## Alternative RPC Providers

If you prefer other providers:
- **Helius**: 100k requests/day free
- **QuickNode**: 10M API credits/month free
- **Triton**: 100k requests/day free

Just replace the RPC URL in your `.env.local` file.