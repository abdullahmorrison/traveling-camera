<script lang="ts">
	import QRCode from 'qrcode';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { HANDOFF_RESOLUTION } from '#lib/geo.js';
	import { LocationError, currentCell } from '#lib/client/location.js';

	/** How often the QR changes. Codes stay valid a little longer so a slow scan still works. */
	const ROTATE_MS = 5_000;
	const id = $derived(page.params.id ?? '');

	let svg = $state<string | null>(null);
	let code = $state<string | null>(null);
	let secondsLeft = $state(ROTATE_MS / 1000);
	let declined = $state(false);
	let problem = $state<string | null>(null);
	const openedAt = Date.now();

	interface CodeResponse {
		passed: boolean;
		code?: string;
		url?: string;
		lastDeclinedAt?: string | null;
	}

	async function refresh(cell: string) {
		const response = await fetch('/api/handoff/code', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ cell })
		});
		if (!response.ok) {
			problem =
				response.status === 409
					? 'This camera can not be passed on right now.'
					: 'Could not reach the server.';
			return;
		}
		const data = (await response.json()) as CodeResponse;
		if (data.passed) {
			await goto(resolve('/c/[id]/passed', { id }));
			return;
		}
		declined = !!data.lastDeclinedAt && new Date(data.lastDeclinedAt).getTime() >= openedAt;
		code = data.code ?? null;
		svg = await QRCode.toString(data.url ?? '', {
			type: 'svg',
			margin: 0,
			color: { dark: '#1b1a17', light: '#ffffff' }
		});
		secondsLeft = ROTATE_MS / 1000;
	}

	$effect(() => {
		let cell: string | null = null;
		let stopped = false;
		const tick = setInterval(() => (secondsLeft = Math.max(0, secondsLeft - 1)), 1000);
		const rotate = async () => {
			if (stopped) return;
			try {
				cell ??= await currentCell(HANDOFF_RESOLUTION);
				await refresh(cell);
			} catch (error) {
				problem =
					error instanceof LocationError
						? 'Location is needed to check you are together. It is never stored.'
						: 'Could not reach the server.';
			}
		};
		void rotate();
		const timer = setInterval(rotate, ROTATE_MS);
		return () => {
			stopped = true;
			clearInterval(timer);
			clearInterval(tick);
		};
	});
</script>

<svelte:head>
	<title>Pass it on · Traveling Camera</title>
</svelte:head>

<main class="pass">
	<nav class="nav">
		<a href={resolve('/c/[id]', { id })} aria-label="Close" class="close">✕</a>
	</nav>
	<div class="head">
		<h1 class="serif">Pass it <em>on</em></h1>
		<p class="choose">Choose wisely. Pick someone who'll keep it going.</p>
		<p class="body">
			Ask: "I'm part of a photo chain. Want to continue it?" If yes, they scan this.
		</p>
	</div>

	{#if declined}
		<p class="declined" role="status">
			<span class="dot" aria-hidden="true"></span>They passed on it. Ask someone else.
		</p>
	{/if}

	<div class="card">
		{#if svg}
			<div class="qr" data-code={code} role="img" aria-label="QR code to receive the camera">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG generated locally by qrcode -->
				{@html svg}
			</div>
		{:else}
			<div class="qr placeholder" aria-hidden="true"></div>
		{/if}
		<div class="timer">
			<span class="segments" aria-hidden="true">
				{#each [1, 2, 3, 4, 5] as n (n)}<span class:on={n <= secondsLeft}></span>{/each}
			</span>
			<span class="mono">New code in {secondsLeft}s</span>
		</div>
	</div>

	{#if problem}<p class="problem" role="alert">{problem}</p>{/if}
	<p class="body note">No app needed. Their phone camera opens it and explains the rest.</p>
</main>

<style>
	.pass {
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-width: 480px;
		margin: 0 auto;
		padding: max(16px, env(safe-area-inset-top)) 24px 34px;
	}

	.nav {
		height: 44px;
		display: flex;
		align-items: center;
	}

	.close {
		font-size: 22px;
		text-decoration: none;
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.choose {
		font-weight: 600;
		font-size: 16px;
	}

	.declined {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border-radius: 14px;
		background: rgb(255 92 31 / 0.12);
		font-weight: 500;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 18px;
		padding: 28px 28px 22px;
		border-radius: 28px;
		background: var(--white);
		box-shadow: 0 6px 20px rgb(51 38 26 / 0.12);
	}

	.qr {
		width: min(250px, 70vw);
		aspect-ratio: 1;
	}

	.qr :global(svg) {
		width: 100%;
		height: 100%;
	}

	.placeholder {
		background: var(--rule);
		border-radius: 8px;
	}

	.timer {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.segments {
		display: flex;
		gap: 3px;
	}

	.segments span {
		width: 14px;
		height: 4px;
		border-radius: 2px;
		background: var(--rule);
	}

	.segments .on {
		background: var(--ink);
	}

	.problem {
		color: var(--accent);
		font-size: 14px;
	}

	.note {
		font-size: 14px;
	}
</style>
