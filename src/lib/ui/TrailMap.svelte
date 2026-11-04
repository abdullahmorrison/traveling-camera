<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { GeoJSONSource, LngLatBoundsLike, Map as MapLibre, Marker } from 'maplibre-gl';
	import { onMount } from 'svelte';
	// Bundled as a separate file; MapLibre loads it into its web workers.
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
	import {
		buildTrail,
		focusStops,
		type Stop,
		type TrailPhoto,
		type ZoomLevel
	} from '#lib/chain/trail.js';

	interface Props {
		photos: TrailPhoto[];
		level: ZoomLevel;
		/** Holder position whose stop is marked as "you" / the camera's latest stop. */
		highlight?: number | null;
		onselect?: (stop: Stop) => void;
	}

	let { photos, level, highlight = null, onselect }: Props = $props();

	const STYLE = 'https://tiles.openfreemap.org/styles/positron';
	const SINGLE_STOP_ZOOM: Record<ZoomLevel, number> = {
		neighbourhood: 12.5,
		region: 7,
		country: 4,
		world: 1.3
	};
	const MAX_ZOOM: Record<ZoomLevel, number> = {
		neighbourhood: 14,
		region: 9,
		country: 5.5,
		world: 3
	};

	let container: HTMLDivElement;
	let map = $state<MapLibre | null>(null);
	let maplibre: typeof import('maplibre-gl') | null = null;
	let styleReady = $state(false);
	let markers: Marker[] = [];

	const trail = $derived(buildTrail(photos, level));
	const focus = $derived(focusStops(photos, trail, level));

	onMount(() => {
		let instance: MapLibre | undefined;
		void import('maplibre-gl').then((module) => {
			maplibre = module;
			module.setWorkerUrl(workerUrl);
			instance = new module.Map({
				container,
				style: STYLE,
				center: [0, 20],
				zoom: 1,
				attributionControl: false,
				dragRotate: false,
				pitchWithRotate: false,
				touchPitch: false
			});
			instance.touchZoomRotate.disableRotation();
			instance.on('load', () => {
				instance!.addSource('trail', { type: 'geojson', data: line([]) });
				instance!.addLayer({
					id: 'trail-casing',
					type: 'line',
					source: 'trail',
					paint: { 'line-color': '#ffffff', 'line-width': 5, 'line-opacity': 0.85 },
					layout: { 'line-join': 'round', 'line-cap': 'round' }
				});
				instance!.addLayer({
					id: 'trail',
					type: 'line',
					source: 'trail',
					paint: { 'line-color': '#1b1a17', 'line-width': 2 },
					layout: { 'line-join': 'round', 'line-cap': 'round' }
				});
				styleReady = true;
			});
			map = instance;
		});
		return () => instance?.remove();
	});

	function line(coordinates: [number, number][]) {
		return {
			type: 'Feature' as const,
			properties: {},
			geometry: { type: 'LineString' as const, coordinates }
		};
	}

	function pinElement(stop: Stop, isLatest: boolean): HTMLElement {
		const pin = document.createElement('button');
		pin.type = 'button';
		pin.className = 'pin';
		pin.dataset.stop = stop.label;
		pin.setAttribute(
			'aria-label',
			`${stop.label}: ${stop.positions.length} ${stop.positions.length === 1 ? 'photo' : 'photos'}`
		);
		const prints = document.createElement('span');
		prints.className = 'prints';
		[...stop.urls].reverse().forEach((url, i, all) => {
			const img = document.createElement('img');
			img.src = url;
			img.alt = '';
			img.style.setProperty('--tilt', `${(all.length - 1 - i) * 9 - (all.length > 1 ? 9 : 0)}deg`);
			prints.append(img);
		});
		if (stop.positions.length > 1) {
			const count = document.createElement('span');
			count.className = 'count';
			count.textContent = String(stop.positions.length);
			prints.append(count);
		}
		const label = document.createElement('span');
		label.className = 'label';
		label.textContent = stop.label;
		const anchor = document.createElement('span');
		anchor.className = isLatest ? 'anchor latest' : 'anchor';
		pin.append(prints, label, anchor);
		pin.addEventListener('click', () => onselect?.(stop));
		return pin;
	}

	// Markers and framing follow the trail and zoom level.
	$effect(() => {
		if (!map || !maplibre) return;
		markers.forEach((marker) => marker.remove());
		markers = trail.stops.map((stop) =>
			new maplibre!.Marker({
				element: pinElement(stop, stop.positions.includes(highlight ?? -1)),
				anchor: 'bottom',
				offset: [0, 6]
			})
				.setLngLat([stop.lng, stop.lat])
				.addTo(map!)
		);
		frame(map, focus);
	});

	// The trail line needs the style loaded first.
	$effect(() => {
		if (!map || !styleReady) return;
		const coordinates = trail.path.map((i) => {
			const stop = trail.stops[i]!;
			return [stop.lng, stop.lat] as [number, number];
		});
		(map.getSource('trail') as GeoJSONSource | undefined)?.setData(line(coordinates));
	});

	function frame(target: MapLibre, stops: Stop[]) {
		if (stops.length === 0) return;
		if (stops.length === 1) {
			target.jumpTo({ center: [stops[0]!.lng, stops[0]!.lat], zoom: SINGLE_STOP_ZOOM[level] });
			return;
		}
		const lngs = stops.map((s) => s.lng);
		const lats = stops.map((s) => s.lat);
		const bounds: LngLatBoundsLike = [
			[Math.min(...lngs), Math.min(...lats)],
			[Math.max(...lngs), Math.max(...lats)]
		];
		target.fitBounds(bounds, {
			padding: { top: 140, bottom: 40, left: 60, right: 60 },
			maxZoom: MAX_ZOOM[level],
			animate: false
		});
	}
</script>

<div class="map" bind:this={container}></div>
<p class="attribution">
	<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>
	<a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>
	<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"
		>© OpenStreetMap</a
	>
</p>

<style>
	.map {
		position: absolute;
		inset: 0;
		background: #ece5d6;
	}

	.attribution {
		position: absolute;
		right: 6px;
		bottom: 4px;
		display: flex;
		gap: 6px;
		margin: 0;
		font: 400 8px var(--font-mono);
		color: var(--muted);
	}

	.attribution a {
		text-decoration: none;
	}

	.map :global(.maplibregl-canvas) {
		filter: sepia(0.22) saturate(0.75);
	}

	.map :global(.pin) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}

	.map :global(.prints) {
		position: relative;
		display: grid;
		width: 46px;
		height: 46px;
	}

	.map :global(.prints img) {
		grid-area: 1 / 1;
		width: 40px;
		height: 40px;
		margin: 3px;
		border: 3px solid var(--white);
		border-radius: 2px;
		box-shadow: var(--shadow-print);
		object-fit: cover;
		transform: rotate(var(--tilt));
		background: var(--white);
	}

	.map :global(.count) {
		position: absolute;
		top: -6px;
		right: -10px;
		min-width: 18px;
		padding: 1px 5px;
		border: 1.5px solid var(--white);
		border-radius: 999px;
		background: var(--ink);
		color: var(--paper);
		font: 500 10px var(--font-mono);
	}

	.map :global(.label) {
		padding: 2px 6px;
		border-radius: 999px;
		background: var(--paper);
		box-shadow: 0 1px 3px rgb(51 38 26 / 0.18);
		font: 500 9px var(--font-mono);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.map :global(.anchor) {
		width: 10px;
		height: 10px;
		border: 2px solid var(--white);
		border-radius: 50%;
		background: var(--ink);
		box-sizing: content-box;
	}

	.map :global(.anchor.latest) {
		background: var(--accent);
		box-shadow: 0 0 0 10px rgb(255 92 31 / 0.2);
	}
</style>
