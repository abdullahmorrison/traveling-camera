<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
</script>

<svelte:head>
	<title>How this works · Traveling Camera</title>
</svelte:head>

<main class="how">
	<h1 class="serif">How this <em>works</em></h1>
	<p class="body">One camera, passed person to person. See how far it goes.</p>
	<ol class="rules">
		<li>
			<strong>Take one photo. Anything you want.</strong>
			<span>Add a caption if you like. Everyone in the chain sees it.</span>
		</li>
		<li>
			<strong>Pass it on in person.</strong>
			<span
				>Choose wisely: someone who'll keep it going. Ask if they want to continue the chain, then
				they scan your code.</span
			>
		</li>
		<li>
			<strong>You have 7 days.</strong>
			<span>If it isn't passed on by then, the chain ends with you.</span>
		</li>
	</ol>
	<p class="body small">
		Only your neighbourhood and caption are shared. Never your exact location.
	</p>
	<Button onclick={() => history.back()}>Got it</Button>
</main>

<style>
	.how {
		display: flex;
		flex-direction: column;
		gap: 20px;
		max-width: 480px;
		margin: 0 auto;
		padding: 72px 24px 34px;
	}

	.rules {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin: 0;
		padding: 0 0 0 20px;
	}

	.rules li {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.rules strong {
		font-weight: 500;
		font-size: 16px;
	}

	.rules span,
	.small {
		font-size: 14px;
		color: var(--muted);
	}
</style>
