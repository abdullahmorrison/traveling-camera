<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { ResolvedPathname } from '$app/types';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'text';
		/** Pass a path from `resolve()`. */
		href?: ResolvedPathname;
		children: Snippet;
	}

	let { variant = 'primary', href, children, type = 'button', ...rest }: Props = $props();
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is typed as already resolved -->
	<a class="button {variant}" {href}>
		{#if variant === 'primary'}<span class="dot" aria-hidden="true"></span>{/if}
		{@render children()}
	</a>
{:else}
	<button class="button {variant}" {type} {...rest}>
		{#if variant === 'primary'}<span class="dot" aria-hidden="true"></span>{/if}
		{@render children()}
	</button>
{/if}

<style>
	.button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		border: 0;
		border-radius: 999px;
		text-decoration: none;
		cursor: pointer;
	}

	.primary {
		padding: 18px;
		background: var(--ink);
		color: var(--paper);
		font-weight: 600;
		font-size: 17px;
	}

	.primary:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.text {
		padding: 6px;
		background: none;
		color: var(--muted);
		font-weight: 500;
		font-size: 15px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
	}
</style>
