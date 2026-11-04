<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<section class="sheet">
	{@render children()}
</section>

<style>
	.sheet {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 22px;
		padding: 28px 24px max(34px, env(safe-area-inset-bottom));
		background: var(--paper);
		border-radius: 28px 28px 0 0;
		box-shadow: var(--shadow-sheet);
	}
</style>
