# Layne's World Dashboard

A personal dashboard webapp that consolidates day-to-day information needs into a single, unified interface. The system aggregates news, manages tasks, integrates calendars, displays YouTube content, and tracks technology deals.

## Features

- **News Aggregator**: View aggregated news across business, technology, and entertainment categories
- **Task Manager**: Manage personal tasks and to-do items (coming soon)
- **Calendar Integration**: Sync with Gmail and Outlook calendars (coming soon)
- **YouTube Feed**: Display new releases and recommended videos
- **Deals Tracker**: Track current and upcoming technology deals

## Technology Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Testing**: Vitest with fast-check for property-based testing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local` with your API keys and configuration

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## Environment Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env.local` and configure the following:

### API Configuration

- `VITE_NEWS_API_URL`: Base URL for news API
- `VITE_YOUTUBE_API_URL`: YouTube Data API base URL
- `VITE_DEALS_API_URL`: Base URL for deals API
- `VITE_GOOGLE_CALENDAR_API_URL`: Google Calendar API base URL
- `VITE_OUTLOOK_CALENDAR_API_URL`: Microsoft Graph API base URL

### API Keys

- `VITE_NEWS_API_KEY`: API key for news service
- `VITE_YOUTUBE_API_KEY`: YouTube Data API key
- `VITE_DEALS_API_KEY`: API key for deals service

### OAuth Configuration

- `VITE_GOOGLE_CLIENT_ID`: Google OAuth 2.0 client ID
- `VITE_OUTLOOK_CLIENT_ID`: Microsoft OAuth 2.0 client ID
- `VITE_GOOGLE_REDIRECT_URI`: OAuth redirect URI for Google
- `VITE_OUTLOOK_REDIRECT_URI`: OAuth redirect URI for Microsoft

### Application Settings

- `VITE_APP_ENV`: Environment mode (`development` or `production`)
- `VITE_USE_MOCK_DATA`: Use mock data instead of real APIs (`true` or `false`)
- `VITE_API_TIMEOUT`: API request timeout in milliseconds (default: 10000)
- `VITE_MAX_RETRIES`: Maximum retry attempts for failed requests (default: 3)
- `VITE_RETRY_BASE_DELAY`: Base delay for exponential backoff in milliseconds (default: 1000)

### Environment Files

- `.env.example`: Template with all available configuration options
- `.env.local`: Local development configuration (not committed to git)
- `.env.production`: Production configuration (not committed to git)

## Project Structure

```
src/
├── components/       # React components
│   ├── Dashboard.tsx
│   ├── YouTubeWidget.tsx
│   ├── DealsWidget.tsx
│   └── ...
├── services/        # API clients and services
│   ├── APIClient.ts
│   ├── YouTubeAPIClient.ts
│   ├── DealsAPIClient.ts
│   └── ...
├── utils/           # Utility functions
│   ├── retryWithBackoff.ts
│   ├── errorLogger.ts
│   └── ...
├── types/           # TypeScript type definitions
│   └── index.ts
├── config/          # Configuration modules
│   └── environment.ts
└── tests/           # Test files
```

## Widget Refresh Intervals

- News: 15 minutes
- Tasks: Manual refresh only
- Calendar: 30 minutes
- YouTube: 1 hour
- Deals: 24 hours (daily)

## Deployment

### GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages.

#### Initial Setup

1. **Create a GitHub repository:**
   ```bash
   # On GitHub, create a new repository named "Laynes_World"
   ```

2. **Update the base path in `vite.config.ts`:**
   ```typescript
   base: '/Laynes_World/', // Replace with your actual repo name
   ```

3. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/Laynes_World.git
   git push -u origin main
   ```

4. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Under "Build and deployment", select "GitHub Actions" as the source
   - The workflow will automatically deploy on every push to main

5. **Access your deployed app:**
   - Your app will be available at: `https://YOUR_USERNAME.github.io/Laynes_World/`

#### Manual Deployment

You can also deploy manually using:
```bash
npm run deploy
```

This will build the project and push the dist folder to the gh-pages branch.

#### Environment Variables for Production

For production deployment, you'll need to set up environment variables:

1. Create a `.env.production` file (not committed to git)
2. Add your production API keys and configuration
3. For GitHub Actions, add secrets in your repository settings:
   - Go to Settings > Secrets and variables > Actions
   - Add your API keys as repository secrets

### Alternative Hosting Options

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

#### Netlify
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy`
3. Follow the prompts

## License

MIT

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
