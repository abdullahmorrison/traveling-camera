<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '#lib/ui/Button.svelte';
	import Countdown from '#lib/ui/Countdown.svelte';
	import PhotoRow from '#lib/ui/PhotoRow.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import TrailMap from '#lib/ui/TrailMap.svelte';
	import ZoomLevels from '#lib/ui/ZoomLevels.svelte';
	import type { ZoomLevel } from '#lib/chain/trail.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let level = $state<ZoomLevel>('neighbourhood');
	const chain = $derived(data.chain);
	const id = $derived(String(data.chain.id));
	const chainLabel = $derived(`Chain ${String(chain.id).padStart(2, '0')}`);
	const day = $derived(
		Math.floor((Date.now() - new Date(chain.startedAt).getTime()) / 86_400_000) + 1
	);
</script>

<svelte:head>
	<title>{chainLabel} · Traveling Camera</title>
</svelte:head>

<main class="screen">
	<div class="map">
		<TrailMap photos={chain.photos} {level} highlight={chain.currentPosition} />
		<header class="top">
			<span class="chip dark mono">{chainLabel}</span>
			<span class="chip mono"
				>{chain.holderCount}
				{chain.holderCount === 1 ? 'holder' : 'holders'} · {chain.km.toLocaleString('en')} km · day {day}</span
			>
		</header>
		{#if chain.photos.length}
			<div class="zoom"><ZoomLevels bind:level /></div>
		{/if}
	</div>

	<Sheet>
		{#if chain.role === 'holder'}
			<div class="head">
				<h1 class="serif">You have the <em>camera</em></h1>
				<p class="body">There's one camera and it's yours. Only you can continue the chain.</p>
			</div>
			<Countdown msLeft={chain.msLeft} />
			<PhotoRow photo={chain.myPhoto} retakeHref={resolve('/c/[id]/camera', { id })} />
			{#if chain.myPhoto}
				<Button href={resolve('/c/[id]/pass', { id })}>Pass it on</Button>
			{:else}
				<Button href={resolve('/c/[id]/camera', { id })}>Take your photo</Button>
			{/if}
		{:else if chain.role === 'follower'}
			<div class="head">
				<p class="mono">Following {chainLabel}</p>
				<h1 class="serif">On the <em>move</em></h1>
				<p class="body">Someone has the camera. Their stop appears when they pass it on.</p>
			</div>
		{:else}
			<div class="head">
				<p class="mono">{chainLabel} · ended</p>
				<h1 class="serif">
					The chain {#if chain.isMine}ended with <em>you</em>{:else}<em>ended</em>{/if}
				</h1>
				<p class="body">{chain.holderCount} people held this camera.</p>
			</div>
		{/if}
	</Sheet>
</main>

<style>
	.screen {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	.map {
		position: relative;
		flex: 1;
		min-height: 320px;
		background: #ece5d6;
		overflow: hidden;
	}

	.top {
		position: absolute;
		inset: max(16px, env(safe-area-inset-top)) 16px auto;
		display: flex;
		justify-content: space-between;
		pointer-events: none;
	}

	.zoom {
		position: absolute;
		bottom: 22px;
		left: 50%;
		transform: translateX(-50%);
	}

	.chip {
		padding: 8px 12px;
		border-radius: 999px;
		background: var(--paper);
		color: var(--ink);
		box-shadow: var(--shadow-print);
	}

	.chip.dark {
		background: var(--ink);
		color: var(--paper);
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
</style>
