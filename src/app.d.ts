// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			/** The device's holder token from its cookie, if it has ever held a camera. */
			holderToken: string | null;
		}
	}
}

export {};
