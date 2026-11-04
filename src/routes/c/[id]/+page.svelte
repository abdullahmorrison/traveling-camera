<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '#lib/ui/Button.svelte';
	import Countdown from '#lib/ui/Countdown.svelte';
	import PhotoRow from '#lib/ui/PhotoRow.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import TrailMap from '#lib/ui/TrailMap.svelte';
	import ZoomLevels from '#lib/ui/ZoomLevels.svelte';
	import Print from '#lib/ui/Print.svelte';
	import { placeLine } from '#lib/chain/format.js';
	import type { Stop, ZoomLevel } from '#lib/chain/trail.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let level = $state<ZoomLevel>('neighbourhood');
	const chain = $derived(data.chain);
	const id = $derived(String(data.chain.id));
	const chainLabel = $derived(`Chain ${String(chain.id).padStart(2, '0')}`);
	let selected = $state<Stop | null>(null);
	const stackPhotos = $derived(
		selected ? chain.photos.filter((p) => selected!.positions.includes(p.position)) : []
	);
	const recent = $derived([...chain.photos].reverse().slice(0, 3));

	function ago(iso: string): string {
		const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
		return days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
	}

	const day = $derived(
		Math.floor((Date.now() - new Date(chain.startedAt).getTime()) / 86_400_000) + 1
	);
</script>

<svelte:head>
	<title>{chainLabel} · Traveling Camera</title>
</svelte:head>

<main class="screen">
	<div class="map">
		<TrailMap
			photos={chain.photos}
			{level}
			highlight={chain.currentPosition}
			onselect={(stop) => (selected = stop)}
		/>
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
		{#if selected}
			<div class="stack-head">
				<div class="head">
					<p class="mono">
						{stackPhotos.length}
						{stackPhotos.length === 1 ? 'photo' : 'photos'}
					</p>
					<h2 class="serif">{selected.label}</h2>
				</div>
				<button type="button" class="close" aria-label="Close" onclick={() => (selected = null)}
					>✕</button
				>
			</div>
			<ul class="strip">
				{#each stackPhotos as photo, i (photo.position)}
					<li>
						<a href={resolve('/c/[id]/p/[position]', { id, position: String(photo.position) })}>
							<Print {photo} size="small" tilt={i % 2 ? 1.5 : -1.5} />
						</a>
					</li>
				{/each}
			</ul>
		{:else if chain.role === 'holder'}
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
			<p class="links">
				<a href={resolve('/c/[id]/reminder.ics', { id })} download>Remind me before it ends</a>
				<span aria-hidden="true">·</span>
				<a class="ink" href={resolve('/how')}>How this works</a>
			</p>
		{:else if chain.role === 'follower'}
			<div class="head">
				<p class="mono">Following {chainLabel}</p>
				<h1 class="serif">On the <em>move</em></h1>
				<p class="body">Someone has the camera. Their stop appears when they pass it on.</p>
			</div>
			{#if recent.length}
				<ul class="recent" aria-label="Recent stops">
					{#each recent as photo (photo.position)}
						<li>
							<a href={resolve('/c/[id]/p/[position]', { id, position: String(photo.position) })}>
								<img src={photo.url} alt="" />
								<span>
									<strong>{placeLine(photo.place)}</strong>
									<span class="mono">#{photo.position} · {ago(photo.takenAt)}</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		{:else}
			<div class="head">
				<p class="mono">{chainLabel} · ended</p>
				<h1 class="serif">
					The chain {#if chain.isMine}ended with <em>you</em>{:else}<em>ended</em>{/if}
				</h1>
				<p class="body">{chain.holderCount} people held this camera.</p>
			</div>
			<dl class="stats">
				<div>
					<dt class="mono">Holders</dt>
					<dd>{chain.holderCount}</dd>
				</div>
				<div>
					<dt class="mono">Km</dt>
					<dd>{chain.km.toLocaleString('en')}</dd>
				</div>
				<div>
					<dt class="mono">Days</dt>
					<dd>{day}</dd>
				</div>
			</dl>
			{#if chain.photos.length}
				<Button href={resolve('/c/[id]/photos', { id })}>See every photo</Button>
			{/if}
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

	.links {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-top: -10px;
		font-size: 14px;
		color: var(--muted);
	}

	.links a {
		font-weight: 500;
		text-decoration: none;
	}

	.links .ink {
		color: var(--ink);
		text-decoration: underline;
	}

	.stack-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.close {
		border: 0;
		background: none;
		font-size: 20px;
		cursor: pointer;
	}

	.strip {
		display: flex;
		gap: 14px;
		margin: 0 -24px;
		padding: 6px 24px 10px;
		overflow-x: auto;
		list-style: none;
	}

	.strip a,
	.recent a {
		text-decoration: none;
	}

	.recent {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin: 0;
		padding: 22px 0 0;
		border-top: 1px solid var(--rule);
		list-style: none;
	}

	.recent a {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.recent img {
		width: 44px;
		height: 50px;
		padding: 3px 3px 9px;
		background: var(--white);
		box-shadow: var(--shadow-print);
		object-fit: cover;
	}

	.recent strong {
		display: block;
		font-weight: 600;
		font-size: 15px;
	}

	.stats {
		display: flex;
		margin: 0;
	}

	.stats div {
		flex: 1;
	}

	.stats dd {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 32px;
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
</style>
