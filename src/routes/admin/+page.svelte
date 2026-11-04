<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
</script>

<svelte:head>
	<title>Admin · Traveling Camera</title>
</svelte:head>

<main class="admin">
	<p class="mono">Admin</p>
	<h1 class="serif">Start a <em>chain</em></h1>
	<p class="body">This phone becomes holder #1 of a new chain.</p>
	<form method="POST" action="?/start">
		<Button type="submit">Start a chain</Button>
	</form>
</main>

<style>
	.admin {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 480px;
		margin: 0 auto;
		padding: 96px 24px;
	}
</style>
