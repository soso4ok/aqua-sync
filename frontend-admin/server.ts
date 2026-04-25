import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Lightweight bootstrap for tsx -> tries common entry points and prints helpful errors.

(async () => {
	// Try entries in order. Dynamic imports so missing files are caught.
	const tryImport = async (path: string) => {
		try {
			const mod = await import(path);
			return mod;
		} catch {
			return null;
		}
	};

	// 1) src/server.ts (explicit dev server)
	let mod = await tryImport('./src/server.ts');
	if (mod) {
		if (typeof mod.default === 'function') {
			await mod.default();
		}
		return;
	}

	// 2) src/main.tsx (React entry)
	mod = await tryImport('./src/main.tsx');
	if (mod) {
		console.log('Loaded ./src/main.tsx — if you expect a dev server ensure your bundler (vite/webpack) starts here.');
		return;
	}

	// 3) src/index.tsx
	mod = await tryImport('./src/index.tsx');
	if (mod) {
		console.log('Loaded ./src/index.tsx — if you expect a dev server ensure your bundler (vite/webpack) starts here.');
		return;
	}

	// Nothing found — help the developer.
	console.error(`
No entry file found for frontend-admin.
Create one of:
  - ./src/server.ts      (export default function to start dev server)
  - ./src/main.tsx       (React entry)
  - ./src/index.tsx

This bootstrap file exists so "tsx server.ts" doesn't error with ERR_MODULE_NOT_FOUND.
`);
	process.exit(1);
})();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;

  app.use(express.json({ limit: '10mb' }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AquaSync Admin Dashboard running on http://localhost:${PORT}`);
  });
}

startServer();
