import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATA_DIR: {
		description: 'Folder for the SQLite database and uploaded photos.',
		schema: (value) => value || '.data'
	},
	GEOCODER: {
		description:
			'"nominatim" (default) to name places, or "none" to skip lookups (tests, offline).',
		schema: (value) => (value === 'none' ? 'none' : 'nominatim')
	},
	ADMIN_OPEN: {
		description: 'Set to "true" to allow anyone who can reach /admin to start chains.',
		schema: (value) => value === 'true'
	}
});
