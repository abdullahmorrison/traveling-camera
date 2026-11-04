<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '#lib/ui/Button.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Traveling Camera</title>
</svelte:head>

<main class="home">
	<h1 class="serif">Traveling Camera</h1>
	{#if data.chainId !== null}
		<Button href={resolve('/c/[id]', { id: String(data.chainId) })}>Open your chain</Button>
	{/if}
</main>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-width: 480px;
		margin: 0 auto;
		padding: 96px 24px;
	}
</style>
