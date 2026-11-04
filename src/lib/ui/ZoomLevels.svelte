<script lang="ts">
	import { ZOOM_LEVELS, type ZoomLevel } from '#lib/chain/trail.js';

	let { level = $bindable() }: { level: ZoomLevel } = $props();
</script>

<div class="levels" role="radiogroup" aria-label="Zoom level">
	{#each ZOOM_LEVELS as option (option)}
		<button
			type="button"
			role="radio"
			aria-checked={level === option}
			class:active={level === option}
			onclick={() => (level = option)}>{option}</button
		>
	{/each}
</div>

<style>
	.levels {
		display: flex;
		gap: 2px;
		padding: 4px;
		border-radius: 999px;
		background: var(--paper);
		box-shadow: 0 2px 8px rgb(51 38 26 / 0.15);
	}

	button {
		padding: 5px 8px;
		border: 0;
		border-radius: 999px;
		background: none;
		font: 500 9px var(--font-mono);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		cursor: pointer;
	}

	.active {
		background: var(--ink);
		color: var(--paper);
	}
</style>
