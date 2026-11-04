<script lang="ts">
	import { HOLD_DURATION_MS } from '#lib/chain/deadline.js';
	import { formatTimeLeft } from '#lib/chain/format.js';

	let { msLeft }: { msLeft: number } = $props();

	const DAY = 24 * 60 * 60 * 1000;
	const lastDay = $derived(msLeft < DAY);
	const elapsed = $derived(HOLD_DURATION_MS - msLeft);
	const segments = $derived(
		Array.from({ length: 7 }, (_, i) => Math.min(1, Math.max(0, (elapsed - i * DAY) / DAY)))
	);
</script>

<div class="countdown" class:last-day={lastDay}>
	<div class="row">
		<span class="mono label">Chain ends in</span>
		<span class="left">{formatTimeLeft(msLeft)}</span>
	</div>
	<div class="days" aria-hidden="true">
		{#each segments as filled, i (i)}
			<span class="day"><span class="fill" style:width="{filled * 100}%"></span></span>
		{/each}
	</div>
</div>

<style>
	.countdown {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.left {
		font-family: var(--font-mono);
		font-weight: 500;
		font-size: 22px;
	}

	.days {
		display: flex;
		gap: 4px;
	}

	.day {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: var(--rule);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--ink);
	}

	.last-day .label,
	.last-day .left {
		color: var(--accent);
	}

	.last-day .day:last-child .fill {
		background: var(--accent);
	}
</style>
