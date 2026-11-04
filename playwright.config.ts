import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'retain-on-failure'
	},
	projects: [
		{
			name: 'mobile-chromium',
			use: {
				...devices['Pixel 7'],
				launchOptions: {
					args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
				}
			}
		}
	],
	webServer: {
		command:
			'rm -rf .data-e2e && npm run build && DATA_DIR=.data-e2e ADMIN_OPEN=true GEOCODER=none npm run preview -- --port 4173',
		port: 4173,
		reuseExistingServer: !process.env.CI
	}
});
