<!-- BEGIN:nextjs-agent-rules -->
# Onchain.me Project Rules (Retro-Futuristic Design)

## 🚀 Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Nova Preset, Radix UI)
- **Graphics:** PixiJS + @pixi/react (Isometric rendering)
- **Blockchain:** Solana (@solana/web3.js & @solana/wallet-adapter)

## 📂 Project Structure
- `src/app/`: Pages & Routing
- `src/components/ui/`: Base shadcn components
- `src/components/dashboard/`: Dashboard-specific UI (Cards, Filters, Stats)
- `src/components/edit/`: Editor logic and Sidebar
- `src/components/canvas/`: PixiJS engine, Scene, and Isometric Grid
- `src/hooks/`: Custom React hooks (Wallet, Onchain data)

## 🛠️ Architecture Rules
1. **SSR & Client:** Default to Server Components. Use `'use client'` ONLY for PixiJS scenes, wallet-adapter buttons, and interactive UI elements.
2. **Graphics Safety:** Always use dynamic imports with `{ ssr: false }` for any PixiJS-related components to prevent hydration errors.
3. **Styles:** Use Tailwind CSS only. No custom `.css` files unless strictly necessary for global animations.
4. **Imports:** Use `@/*` alias for all internal imports (e.g., `@/components/ui/button`).

## 🎨 Visual Identity & UI
- **Theme:** Forced Dark Mode (Slate/Zinc palette).
- **Accents:** Neon Pink (#FF00FF), Neon Cyan (#00FFFF), Neon Yellow (#FFFF00).
- **Effects:** Heavy glow/bloom borders (using Tailwind `drop-shadow` or `box-shadow` variables).
- **Surface:** Pastel multi-level isometric grid. Objects must align with 3D-pixel coordinates.
- **Icons:** Lucide React (standard with shadcn).

## 📝 General Coding Principles
- Write clean, functional TypeScript code.
- No `any` type allowed. Define interfaces for all Solana-related data.
- Keep components small and reusable.
- Follow kebab-case for folder names and PascalCase for React components.
<!-- END:nextjs-agent-rules -->
