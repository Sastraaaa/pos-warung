# POS Warung

POS Warung is a simple Point of Sale application designed for small shops (warung). It features a local-first architecture to ensure reliability even with intermittent internet connectivity.

## Features

- Local-first architecture: Works offline using IndexedDB (Dexie) and synchronizes with Supabase when online.
- Product management: Track inventory and stock levels.
- Customer management: Maintain customer records and track debt.
- Transaction handling:
  - LUNAS (Paid)
  - KASBON_FULL (Full debt)
  - SEBAGIAN (Partial payment)
- Daily reports: Summary of revenue, profit, and debt status.
- PWA support: Installable on mobile and desktop devices.

## Tech Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Supabase (Backend & Auth)
- Dexie.js (Local Database)
- React Router 7

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Sastraaaa/pos-warung.git
   cd pos-warung
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development Commands

- `npm run dev`: Start development server with HMR.
- `npm run build`: Build for production.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Run ESLint to check code quality.

## Deployment

### Supabase Setup

1. Create a new project on [Supabase](https://app.supabase.com/).
2. Set up your database schema (Postgres). Ensure RLS policies and triggers are configured as per the project requirements.
3. Obtain your Project URL and Anon Key from the API settings.

### Vercel Deployment

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/).
3. Add the following environment variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy the project. Vercel will automatically detect the Vite configuration and build the application.

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | The API URL of your Supabase project. |
| `VITE_SUPABASE_ANON_KEY` | The anonymous public key for your Supabase project. |

## License

This project is private and for educational purposes.
