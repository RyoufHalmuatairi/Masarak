# Masarak on Replit

## Run
- Keep the existing Expo SDK 57 / React Native app and separate Node CV service.
- Node.js 22 is required by the installed Supabase client.
- Use the Run button to start `Masarak preview`, or run `EXPO_UNSTABLE_HEADLESS=1 npx expo start --web --host lan --port 5000`.
- The browser preview uses port 5000. Watch mode is enabled so edits refresh during development.
- Headless mode avoids installing the native desktop debugger in this browser-only environment.
- Choose «متابعة دون حساب» to try the existing guest experience.

## Optional services not yet configured
- Accounts require the existing Supabase project's `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Configure these using the environment/secrets UI, not source code. Account flows have not been verified.
- CV analysis requires server dependencies, the server-only `GROQ_API_KEY`, and a running `npm run cv-server` service. Do not expose the Groq key with an `EXPO_PUBLIC_` prefix.
- The imported CV client assumes a local-network backend on port 3001. Before enabling browser CV analysis on Replit, add a same-origin HTTPS API/proxy route and connect the client to it; do not send browsers to a localhost URL or an HTTPS page's HTTP backend.
- The CV service is documented as a local prototype in `server/README_AR.md`. Do not publish it publicly without authentication, request limits, and privacy safeguards.

## Checks
- `npm run lint`
- `npx tsc --noEmit`
- CV service tests, once its dependencies are installed: `npm run test:cv-server`.
