<script lang="ts">
  import { authClient } from '$lib';
  import { enhance } from '$app/forms';
  import type { PageServerData } from './$types';

  let { data }: { data: PageServerData } = $props();
  let passkeyMessage = $state('');
  let addingPasskey = $state(false);

  const addPasskey = async () => {
    addingPasskey = true;
    passkeyMessage = '';

    const result = await authClient.passkey.addPasskey({
      name: 'Primary passkey',
      authenticatorAttachment: 'platform',
    });

    addingPasskey = false;
    passkeyMessage = result.error
      ? result.error.message || 'Failed to add passkey'
      : 'Passkey added to your account.';
  };
</script>

<h1>Hi, {data.user.name}!</h1>
<p>Your user ID is {data.user.id}.</p>
<p>Your account number is {data.user.accountNumber}.</p>
<button onclick={addPasskey} disabled={addingPasskey}>
  {addingPasskey ? 'Waiting for passkey...' : 'Add a passkey'}
</button>
<p>{passkeyMessage}</p>
<form method="post" action="?/signOut" use:enhance>
  <button>Sign out</button>
</form>
