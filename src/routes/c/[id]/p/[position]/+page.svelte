<script lang="ts">
	import { resolve } from '$app/paths';
	import Print from '#lib/ui/Print.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const id = $derived(String(data.chainId));
</script>

<svelte:head>
	<title>#{data.photo.position} · Traveling Camera</title>
</svelte:head>

<main class="photo">
	<nav class="nav">
		<a href={resolve('/c/[id]', { id })} aria-label="Back to the map" class="icon">‹</a>
		<span class="mono">#{data.photo.position} of {data.holderCount}</span>
		<span class="icon" aria-hidden="true"></span>
	</nav>
	<Print photo={data.photo} tilt={1} />
	<nav class="pager">
		{#if data.previous !== null}
			<a
				class="step"
				href={resolve('/c/[id]/p/[position]', { id, position: String(data.previous) })}
				aria-label="Previous photo">‹</a
			>
		{:else}<span></span>{/if}
		<a class="mono" href={resolve('/c/[id]/photos', { id })}>Every photo</a>
		{#if data.next !== null}
			<a
				class="step"
				href={resolve('/c/[id]/p/[position]', { id, position: String(data.next) })}
				aria-label="Next photo">›</a
			>
		{:else}<span></span>{/if}
	</nav>
</main>

<style>
	.photo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 32px;
		max-width: 480px;
		margin: 0 auto;
		padding: max(16px, env(safe-area-inset-top)) 24px 34px;
	}

	.nav,
	.pager {
		align-self: stretch;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav {
		height: 44px;
	}

	.icon {
		width: 24px;
		font-size: 28px;
		text-decoration: none;
	}

	.step {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border: 1.5px solid var(--ink);
		border-radius: 50%;
		font-size: 24px;
		text-decoration: none;
	}

	.pager span {
		width: 52px;
	}
</style>
