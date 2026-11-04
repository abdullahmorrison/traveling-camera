<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { HANDOFF_RESOLUTION } from '#lib/geo.js';
	import { LocationError, currentCell } from '#lib/client/location.js';
	import Button from '#lib/ui/Button.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Step = 'intro' | 'checking' | 'not_together' | 'expired' | 'declined' | 'location';
	let step = $state<Step>(untrack(() => (data.status === 'open' ? 'intro' : 'expired')));

	const days = $derived(
		Math.max(1, Math.round((Date.now() - new Date(data.startedAt).getTime()) / 86_400_000))
	);
	const story = $derived(
		`You're #${data.before + 1}. This camera started ` +
			(data.origin ? `in ${data.origin} ` : '') +
			`${days} ${days === 1 ? 'day' : 'days'} ago. There is only one, and it stops if you don't pass it on.`
	);

	async function post(path: string, body: object) {
		return fetch(path, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
	}

	async function accept() {
		step = 'checking';
		try {
			const cell = await currentCell(HANDOFF_RESOLUTION);
			const response = await post('/api/handoff/accept', { code: data.code, cell });
			if (response.ok) {
				const { chainId } = (await response.json()) as { chainId: number };
				await goto(resolve('/c/[id]', { id: String(chainId) }), { invalidateAll: true });
				return;
			}
			const reason = (await response.json().catch(() => ({}))) as { message?: string };
			step = reason.message === 'not_together' ? 'not_together' : 'expired';
		} catch (error) {
			step = error instanceof LocationError ? 'location' : 'expired';
		}
	}

	async function decline() {
		await post('/api/handoff/decline', { code: data.code }).catch(() => {});
		step = 'declined';
	}
</script>

<svelte:head>
	<title>You've been handed the camera · Traveling Camera</title>
</svelte:head>

{#if step === 'intro'}
	<main class="intro">
		<div class="map"></div>
		<Sheet>
			<div class="head">
				{#if data.faces.length}
					<div class="faces" aria-hidden="true">
						{#each data.faces as face (face)}<img src={face} alt="" />{/each}
					</div>
				{/if}
				<p class="mono">
					Chain {String(data.chainId).padStart(2, '0')} · {data.before}
					{data.before === 1 ? 'person' : 'people'} before you
				</p>
				<h1 class="serif">Only you can continue the <em>chain</em></h1>
				<p class="body">{story}</p>
			</div>
			<ol class="rules">
				<li>
					<strong>Take one photo. Anything you want.</strong>
					<span>Add a caption if you like. Everyone in the chain sees it.</span>
				</li>
				<li>
					<strong>Pass it on in person.</strong>
					<span
						>Choose wisely: someone who'll keep it going. Ask if they want to continue the chain,
						then they scan your code.</span
					>
				</li>
				<li>
					<strong>You have 7 days.</strong>
					<span>If it isn't passed on by then, the chain ends with you.</span>
				</li>
			</ol>
			<div class="actions">
				<Button onclick={accept}>Continue the chain</Button>
				<Button variant="text" onclick={decline}>Not for me</Button>
				<p class="body small">
					Only your neighbourhood and caption are shared. Your location is checked once to confirm
					you are together.
				</p>
			</div>
		</Sheet>
	</main>
{:else}
	<main class="center" aria-live="polite">
		{#if step === 'checking'}
			<p class="mono">Confirming handoff</p>
			<h1 class="serif">Checking you're <em>together</em></h1>
			<p class="body">Keep both phones close for a second.</p>
		{:else if step === 'not_together'}
			<p class="mono accent">Handoff not confirmed</p>
			<h1 class="serif">Couldn't <em>confirm</em></h1>
			<p class="body">The camera only moves in person. Stand together and scan a fresh code.</p>
		{:else if step === 'location'}
			<p class="mono accent">Location needed</p>
			<h1 class="serif">Couldn't <em>confirm</em></h1>
			<p class="body">
				Allow location so we can check you are together. Only a rough area is used, and it is never
				stored.
			</p>
			<Button onclick={accept}>Try again</Button>
		{:else if step === 'expired'}
			<p class="mono accent">Code expired</p>
			<h1 class="serif">Scan a fresh <em>code</em></h1>
			<p class="body">Codes change every few seconds. Ask them to show theirs again.</p>
		{:else}
			<p class="mono">No problem</p>
			<h1 class="serif">Not this <em>time</em></h1>
			<p class="body">
				The camera stays with them, so the chain keeps going. You can close this page.
			</p>
		{/if}
	</main>
{/if}

<style>
	.intro {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	.map {
		flex: 1;
		min-height: 120px;
		background: #ece5d6;
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.faces {
		display: flex;
		margin-bottom: 4px;
	}

	.faces img {
		width: 34px;
		height: 34px;
		margin-right: -10px;
		border-radius: 50%;
		border: 2.5px solid var(--paper);
		object-fit: cover;
	}

	.rules {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: rule;
	}

	.rules li {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-left: 38px;
		counter-increment: rule;
	}

	.rules li::before {
		content: counter(rule);
		position: absolute;
		left: 0;
		top: 0;
		width: 26px;
		height: 26px;
		display: grid;
		place-items: center;
		border: 1.25px solid var(--ink);
		border-radius: 50%;
		font-family: var(--font-mono);
		font-size: 11px;
	}

	.rules strong {
		font-weight: 500;
		font-size: 16px;
	}

	.rules span {
		font-size: 14px;
		color: var(--muted);
	}

	.actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.small {
		font-size: 13px;
		text-align: center;
	}

	.center {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-height: 100dvh;
		max-width: 480px;
		margin: 0 auto;
		padding: 24px;
		text-align: center;
	}

	.accent {
		color: var(--accent);
	}
</style>
