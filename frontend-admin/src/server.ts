// Minimal programmatic Vite dev server. Export default async function so the existing bootstrap can call it.

export default async function startDevServer() {
	// Try to load Vite dynamically so this file doesn't hard-fail if vite isn't installed.
	try {
		const { createServer } = await import('vite');
		const server = await createServer({
			root: process.cwd(),
			logLevel: 'info',
		});
		await server.listen();
		console.log('Vite dev server started — open http://localhost:5173');
		// keep process alive; Vite will handle shutdown on SIGINT/SIGTERM
	} catch (err) {
		console.error('Vite is not installed or failed to load.');
		console.error('Install dev dependency and retry:');
		console.error('  npm install -D vite');
		process.exit(1);
	}
}
