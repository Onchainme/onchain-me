# Onchain.me 🏝️

**Gamified Solana dashboard where your wallet activity builds your world.** Turn your transaction history into a living, collectible, pixel-art island.

## Features
- **Wallet View:** Visualize any Solana wallet address.
- **Asset Island:** Automatically generates an isometric grid based on protocols you've touched (Jito, Jupiter, Orca, etc.).
- **Collect & Edit:** Mint NFT badges for protocol activity and arrange them on your personal island (Editing mode powered by PixiJS).



## Tech Stack
- Framework: Next.js 15 (App Router)
- Graphics: PixiJS (via @pixi/react)
- Styling: Tailwind CSS & shadcn/ui
- Lang: TypeScript
- Chain: Solana (@solana/web3.js)
- Blockchain: Solana (@solana/web3.js)
- Wallet: @solana/wallet-adapter-react + @solana/wallet-adapter-react-ui
- Rules: Use Wallet Multi-Button from the adapter for the header.

## Getting Started
1. Clone the repo
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)