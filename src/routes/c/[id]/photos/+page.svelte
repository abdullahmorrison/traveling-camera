<script lang="ts">
	import { resolve } from '$app/paths';
	import { placeLine } from '#lib/chain/format.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const id = $derived(String(data.chain.id));
</script>

<svelte:head>
	<title>Every photo · Traveling Camera</title>
</svelte:head>

<main class="all">
	<nav class="nav">
		<a href={resolve('/c/[id]', { id })} aria-label="Back to the map" class="icon">‹</a>
		<span class="mono">Chain {id.padStart(2, '0')} · {data.chain.photos.length} photos</span>
	</nav>
	<h1 class="serif">Every <em>photo</em></h1>
	<ul class="grid">
		{#each data.chain.photos as photo (photo.position)}
			<li>
				<a href={resolve('/c/[id]/p/[position]', { id, position: String(photo.position) })}>
					<img src={photo.url} alt={photo.caption || `Photo #${photo.position}`} />
					<span class="mono">#{photo.position} · {placeLine(photo.place)}</span>
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	.all {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 720px;
		margin: 0 auto;
		padding: max(16px, env(safe-area-inset-top)) 20px 34px;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: 12px;
		height: 44px;
	}

	.icon {
		font-size: 28px;
		text-decoration: none;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
		gap: 16px 12px;
		margin: 8px 0 0;
		padding: 0;
		list-style: none;
	}

	.grid a {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 5px 5px 7px;
		background: var(--white);
		border-radius: 2px;
		box-shadow: var(--shadow-print);
		text-decoration: none;
	}

	.grid img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
	}

	.grid .mono {
		overflow: hidden;
		font-size: 8px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
