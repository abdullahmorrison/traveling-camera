<script lang="ts">
	import { placeLine } from '#lib/chain/format.js';
	import type { ResolvedPathname } from '$app/types';
	import type { PhotoView } from '#lib/server/views.js';

	let { photo, retakeHref }: { photo: PhotoView | null; retakeHref: ResolvedPathname } = $props();
</script>

<div class="row">
	{#if photo}
		<img class="print" src={photo.url} alt="Your shot" />
		<div class="text">
			<p class="title">Your photo is in</p>
			<p class="mono">{placeLine(photo.place)}</p>
		</div>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is typed as already resolved -->
		<a class="retake" href={retakeHref}>Retake</a>
	{:else}
		<span class="print empty" aria-hidden="true"></span>
		<div class="text">
			<p class="title">No photo yet</p>
			<p class="mono">Take one before you pass it on</p>
		</div>
	{/if}
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding-top: 22px;
		border-top: 1px solid var(--rule);
	}

	.print {
		width: 46px;
		height: 52px;
		padding: 3px 3px 9px;
		background: var(--white);
		border-radius: 2px;
		box-shadow: var(--shadow-print);
		object-fit: cover;
		transform: rotate(-5deg);
	}

	.empty {
		background: none;
		box-shadow: none;
		border: 1.25px dashed var(--muted);
		transform: none;
	}

	.text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.title {
		font-weight: 600;
		font-size: 16px;
	}

	.retake {
		font-weight: 500;
		font-size: 15px;
	}
</style>
