<script lang="ts">
	import { placeLine } from '#lib/chain/format.js';
	import type { PhotoView } from '#lib/server/views.js';

	let {
		photo,
		size = 'large',
		tilt = 0
	}: { photo: PhotoView; size?: 'large' | 'small'; tilt?: number } = $props();

	const date = $derived(
		new Date(photo.takenAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
	);
</script>

<figure class="print {size}" style:--tilt="{tilt}deg">
	<img src={photo.url} alt={photo.caption || `Photo #${photo.position}`} />
	{#if photo.caption}<figcaption class="caption">{photo.caption}</figcaption>{/if}
	<p class="mono meta">
		{size === 'small' ? `#${photo.position}` : placeLine(photo.place)} · {date}
	</p>
</figure>

<style>
	.print {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0;
		background: var(--white);
		border-radius: 3px;
		transform: rotate(var(--tilt));
	}

	.large {
		width: min(100%, 360px);
		padding: 14px 14px 20px;
		box-shadow: 0 8px 24px rgb(51 38 26 / 0.18);
	}

	.small {
		flex: none;
		width: 156px;
		padding: 8px 8px 10px;
		gap: 6px;
		box-shadow: 0 4px 10px rgb(51 38 26 / 0.18);
	}

	img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
	}

	.caption {
		font-family: var(--font-hand);
		font-size: 24px;
		line-height: 1.1;
		overflow-wrap: anywhere;
	}

	.small .caption {
		font-size: 17px;
	}

	.small .meta {
		font-size: 9px;
	}
</style>
