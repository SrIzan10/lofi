<script lang="ts">
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import { authClient } from '$lib';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
  let passkeyError = $state('');
  let signingInWithPasskey = $state(false);

  const signInWithPasskey = async () => {
    signingInWithPasskey = true;
    passkeyError = '';

    const result = await authClient.signIn.passkey({
      autoFill: true,
    });

    signingInWithPasskey = false;

    if (result.error) {
      passkeyError = result.error.message || 'Passkey sign-in failed';
      return;
    }

    await goto('/demo/better-auth');
  };
</script>

<h1>Account Login</h1>
<form method="post" action="?/signInAccountNumber" use:enhance>
  <label>
    Account number
    <input name="accountNumber" inputmode="numeric" maxlength="16" autocomplete="one-time-code" />
  </label>
  <button>Sign in with account number</button>
  <button formaction="?/createAccount">Create account number</button>
</form>
<p style="color: red">{form?.message ?? ''}</p>
<button onclick={signInWithPasskey} disabled={signingInWithPasskey}>
  {signingInWithPasskey ? 'Waiting for passkey...' : 'Sign in with passkey'}
</button>
<p style="color: red">{passkeyError}</p>
