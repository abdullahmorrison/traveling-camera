<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { PHOTO_RESOLUTION } from '#lib/geo.js';
	import { LocationError, currentCell } from '#lib/client/location.js';
	import Button from '#lib/ui/Button.svelte';

	const MAX_EDGE = 1600;
	const chainHref = $derived(resolve('/c/[id]', { id: page.params.id ?? '' }));

	let video = $state<HTMLVideoElement>();
	let stream: MediaStream | null = null;
	let facing = $state<'environment' | 'user'>('environment');
	let shot = $state<{ blob: Blob; url: string } | null>(null);
	let caption = $state('');
	let problem = $state<string | null>(null);
	let saving = $state(false);

	async function startCamera() {
		stopCamera();
		problem = null;
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: facing, width: { ideal: 1920 } },
				audio: false
			});
			if (video) video.srcObject = stream;
		} catch {
			problem = 'Camera access is needed to take your photo.';
		}
	}

	function stopCamera() {
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
	}

	$effect(() => {
		if (!shot && video) void startCamera();
		return stopCamera;
	});

	function flip() {
		facing = facing === 'environment' ? 'user' : 'environment';
		void startCamera();
	}

	async function capture() {
		if (!video || !video.videoWidth) return;
		const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(video.videoWidth * scale);
		canvas.height = Math.round(video.videoHeight * scale);
		canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
		// Re-encoding through a canvas also drops EXIF, including any GPS tags.
		const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/jpeg', 0.85));
		if (!blob) return;
		stopCamera();
		shot = { blob, url: URL.createObjectURL(blob) };
	}

	function retake() {
		if (shot) URL.revokeObjectURL(shot.url);
		shot = null;
	}

	async function usePhoto() {
		if (!shot || saving) return;
		saving = true;
		problem = null;
		try {
			const cell = await currentCell(PHOTO_RESOLUTION);
			const form = new FormData();
			form.set('photo', shot.blob, 'photo.jpg');
			form.set('caption', caption);
			form.set('cell', cell);
			const response = await fetch('/api/photo', { method: 'POST', body: form });
			if (!response.ok) throw new Error(await response.text());
			await goto(chainHref, { invalidateAll: true });
		} catch (error) {
			problem =
				error instanceof LocationError
					? 'Location is needed to place your photo on the map. Only your neighbourhood is shared.'
					: 'Could not save your photo. Try again.';
		} finally {
			saving = false;
		}
	}

	onDestroy(() => {
		stopCamera();
		if (shot) URL.revokeObjectURL(shot.url);
	});
</script>

<svelte:head>
	<title>Camera · Traveling Camera</title>
</svelte:head>

{#if !shot}
	<main class="camera">
		<video bind:this={video} autoplay playsinline muted class:mirror={facing === 'user'}></video>
		<a class="close" href={chainHref} aria-label="Close camera">✕</a>
		{#if problem}<p class="problem on-dark">{problem}</p>{/if}
		<div class="controls">
			<span></span>
			<button type="button" class="shutter" aria-label="Take photo" onclick={capture}></button>
			<button type="button" class="flip" aria-label="Switch camera" onclick={flip}>⟲</button>
		</div>
	</main>
{:else}
	<main class="review">
		<nav class="nav">
			<button type="button" class="back" aria-label="Back to camera" onclick={retake}>‹</button>
			<span class="mono">Your photo</span>
		</nav>
		<figure class="print">
			<img src={shot.url} alt="Your shot" />
			<label class="sr-only" for="caption">Caption</label>
			<textarea
				id="caption"
				class="caption"
				rows="2"
				maxlength="500"
				placeholder="Add a caption…"
				bind:value={caption}></textarea>
		</figure>
		<div class="notes body">
			<p>Only your neighbourhood is shared.</p>
			<p>Everyone in the chain will see your caption.</p>
		</div>
		{#if problem}<p class="problem" role="alert">{problem}</p>{/if}
		<div class="actions">
			<Button onclick={usePhoto} disabled={saving}>{saving ? 'Saving…' : 'Use this photo'}</Button>
			<Button variant="text" onclick={retake}>Retake</Button>
		</div>
	</main>
{/if}

<style>
	.camera {
		position: fixed;
		inset: 0;
		background: #000;
	}

	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.mirror {
		transform: scaleX(-1);
	}

	.close {
		position: absolute;
		top: max(16px, env(safe-area-inset-top));
		left: 16px;
		padding: 8px;
		color: var(--white);
		font-size: 22px;
		text-decoration: none;
	}

	.controls {
		position: absolute;
		inset: auto 0 max(48px, env(safe-area-inset-bottom));
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: 0 40px;
	}

	.shutter {
		width: 78px;
		height: 78px;
		border-radius: 50%;
		border: 4px solid var(--white);
		background: var(--white);
		box-shadow: inset 0 0 0 4px #000;
		cursor: pointer;
	}

	.flip {
		justify-self: end;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.35);
		color: var(--white);
		font-size: 20px;
		cursor: pointer;
	}

	.review {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		max-width: 480px;
		margin: 0 auto;
		padding: max(16px, env(safe-area-inset-top)) 24px 34px;
	}

	.nav {
		align-self: stretch;
		display: flex;
		align-items: center;
		gap: 12px;
		height: 44px;
	}

	.back {
		border: 0;
		background: none;
		font-size: 28px;
		cursor: pointer;
	}

	.print {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: min(100%, 340px);
		margin: 12px 0 0;
		padding: 14px 14px 18px;
		background: var(--white);
		border-radius: 3px;
		box-shadow: 0 8px 24px rgb(51 38 26 / 0.18);
		transform: rotate(-2deg);
	}

	.print img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
	}

	.caption {
		border: 0;
		resize: none;
		background: none;
		font-family: var(--font-hand);
		font-size: 24px;
		line-height: 1.1;
		color: var(--ink);
		outline: none;
	}

	.notes {
		text-align: center;
		font-size: 14px;
	}

	.actions {
		align-self: stretch;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.problem {
		color: var(--accent);
		font-size: 14px;
		text-align: center;
	}

	.on-dark {
		position: absolute;
		inset: 120px 24px auto;
		color: var(--white);
	}
</style>
