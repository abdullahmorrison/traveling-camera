<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Button from '#lib/ui/Button.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const id = $derived(page.params.id ?? '');
</script>

<svelte:head>
	<title>Passed on · Traveling Camera</title>
</svelte:head>

<main class="passed">
	<div class="prints" aria-hidden="true">
		{#if data.photoUrl}<img class="print mine" src={data.photoUrl} alt="" />{/if}
		<span class="print next">?</span>
	</div>
	<p class="mono">You were #{data.position} in chain {id.padStart(2, '0')}</p>
	<h1 class="serif">Passed <em>on</em></h1>
	<p class="body">Their stop shows up on the map once they pass it on too.</p>
	<Button href={resolve('/c/[id]', { id })}>Follow the chain</Button>
</main>

<style>
	.passed {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		min-height: 100dvh;
		max-width: 480px;
		margin: 0 auto;
		padding: 24px;
		text-align: center;
	}

	.prints {
		position: relative;
		width: 230px;
		height: 190px;
		margin-bottom: 12px;
	}

	.print {
		position: absolute;
		width: 120px;
		height: 136px;
		padding: 8px 8px 24px;
		background: var(--white);
		border-radius: 3px;
		box-shadow: 0 4px 12px rgb(51 38 26 / 0.18);
		object-fit: cover;
	}

	.mine {
		left: 10px;
		top: 40px;
		transform: rotate(-8deg);
	}

	.next {
		right: 10px;
		top: 20px;
		display: grid;
		place-items: center;
		background: var(--white);
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 48px;
		color: var(--muted);
		transform: rotate(7deg);
	}
</style>
