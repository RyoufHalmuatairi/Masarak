import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { createCvApp } from './cv-app.mjs';

// Read only the server environment. Never include this module in the app bundle.
try { process.loadEnvFile(fileURLToPath(new URL('.env', import.meta.url))); } catch { /* Existing process environment is also supported. */ }
const app = createCvApp();
const port = Number(process.env.PORT || 3001);
app.listen(port, '0.0.0.0', () => {
  console.log(`Masarak CV server running on port ${port}. Groq key: ${process.env.GROQ_API_KEY?.trim() ? 'configured' : 'missing'}`);
  for (const entries of Object.values(networkInterfaces())) for (const entry of entries || []) if (entry.family === 'IPv4' && !entry.internal) console.log(`Local network: http://${entry.address}:${port}`);
});
