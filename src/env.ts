import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATA_DIR: {
		description: 'Folder for the SQLite database and uploaded photos.',
		schema: (value) => value || '.data'
	},
	ADMIN_OPEN: {
		description: 'Set to "true" to allow anyone who can reach /admin to start chains.',
		schema: (value) => value === 'true'
	}
});
