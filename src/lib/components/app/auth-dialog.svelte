<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { authClient } from '$lib';
  import LogIn from '@lucide/svelte/icons/log-in';
  import Settings from '@lucide/svelte/icons/settings-2';
  import UserRound from '@lucide/svelte/icons/user-round';
  import { Button } from '../ui/button';
  import Label from '../ui/label/label.svelte';
  import Input from '../ui/input/input.svelte';
  import Key from '@lucide/svelte/icons/key';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import type { Passkey } from '@better-auth/passkey';
 
  const session = authClient.useSession();

  let open = $state(false);
  let accountNumber = $state('');
  let authMessage = $state('');
  let busyAction = $state<string | null>(null);
  let passkeyMessage = $state('');
  const user = $derived($session.data?.user);
  let passkeys = $state<Passkey[]>([]);
  let loadedPasskeysForUserId = $state<string | null>(null);

  let passkeyName = $state('');

  const loadPasskeys = async () => {
    if (!user) {
      passkeys = [];
      loadedPasskeysForUserId = null;
      return;
    }

    const result = await authClient.passkey.listUserPasskeys();
    passkeys = result.data ?? [];
    loadedPasskeysForUserId = user.id;
  };

  $effect(() => {
    if (!user) {
      passkeys = [];
      loadedPasskeysForUserId = null;
      return;
    }

    if (loadedPasskeysForUserId !== user.id) {
      loadPasskeys();
    }
  });


  const runAuthAction = async (
    action: string,
    request: () => Promise<{ error?: { message?: string | null } | null }>,
    fallbackMessage: string,
    onSuccess?: () => void,
  ) => {
    busyAction = action;
    authMessage = '';

    const result = await request();

    busyAction = null;

    if (result.error) {
      authMessage = result.error.message || fallbackMessage;
      return;
    }

    onSuccess?.();
    open = false;
  };

  const signInWithAccountNumber = () =>
    runAuthAction(
      'account-number',
      () => authClient.signInAccountNumber(accountNumber.replace(/\D/g, '')),
      'Account number sign-in failed',
      () => {
        accountNumber = '';
      },
    );

  const createAccount = () =>
    runAuthAction('create-account', () => authClient.signIn.anonymous(), 'Account creation failed');

  const signInWithPasskey = () =>
    runAuthAction(
      'passkey-sign-in',
      () =>
        authClient.signIn.passkey({
          autoFill: true,
        }),
      'Passkey sign-in failed',
    );

  const signOut = () => runAuthAction('sign-out', () => authClient.signOut(), 'Sign out failed');

  const addPasskey = async () => {
    if (!passkeyName) {
      passkeyMessage = 'Please enter a name for your passkey';
      return;
    }

    busyAction = 'add-passkey';
    passkeyMessage = '';

    const result = await authClient.passkey.addPasskey({
      name: passkeyName,
      authenticatorAttachment: 'platform',
    });

    busyAction = null;
    if (result.error) {
      passkeyMessage = result.error.message || 'Failed to add passkey';
      return;
    }

    await loadPasskeys();
    passkeyMessage = 'Passkey added to your account.';
    passkeyName = '';
  };

  const deletePasskey = async (id: string) => {
    busyAction = `delete-passkey-${id}`;
    passkeyMessage = '';

    const result = await authClient.passkey.deletePasskey({ id });

    busyAction = null;
    if (result.error) {
      passkeyMessage = result.error.message || 'Failed to delete passkey';
      return;
    }

    await loadPasskeys();
    passkeyMessage = 'Passkey removed from your account.';
  };
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    <Button class="flex items-center gap-2">
      {#if user}
        <Settings />
        Settings
      {:else}
        <LogIn />
        Sign in
      {/if}
    </Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {user ? 'Your account' : 'Log into lofi.srizan.dev'}
      </Dialog.Title>
    </Dialog.Header>
    {#if user}
      <div class="flex flex-col gap-4">
        <div class="rounded-lg border border-white/10 bg-white/5 p-4">
          <div class="flex items-start gap-3">
            <div class="rounded-full bg-white/10 p-2">
              <UserRound class="size-4" />
            </div>
            <div class="min-w-0">
              <p class="font-medium">{user.name}</p>
                <p class="text-sm opacity-70">Account #{user.accountNumber}</p>
            </div>
          </div>
        </div>

        {#if passkeys.length > 0}
          <div class="flex flex-col gap-2">
            <p class="text-sm font-medium">Your passkeys</p>
            <div class="flex flex-col gap-1">
              {#each passkeys as passkey (passkey.id)}
          <div class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
            <Key class="size-4" />
            <div class="min-w-0 flex-1">
              <p>{passkey.name}</p>
              <p class="text-sm opacity-70">Added on {new Date(passkey.createdAt).toLocaleDateString()}</p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Delete passkey ${passkey.name}`}
              onclick={() => deletePasskey(passkey.id)}
              disabled={busyAction === `delete-passkey-${passkey.id}`}
            >
              {#if busyAction === `delete-passkey-${passkey.id}`}
                ...
              {:else}
                <Trash2 class="size-4" />
              {/if}
            </Button>
          </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium">Security</p>
          <Input
            type="text"
            id="passkeyName"
            bind:value={passkeyName}
            placeholder="Passkey name (e.g. 'My phone')"
          />
          <Button onclick={addPasskey} disabled={busyAction === 'add-passkey'}>
            {busyAction === 'add-passkey' ? 'Waiting for passkey...' : 'Add a passkey'}
          </Button>
          {#if passkeyMessage}
            <p class="text-sm opacity-80">{passkeyMessage}</p>
          {/if}
        </div>

        <Button variant="ghost" onclick={signOut}>Sign out</Button>
      </div>
    {:else}
      <div class="flex flex-col gap-4">
        <div class="flex w-full flex-col gap-1.5">
          <Label for="accountNumber">Account Number</Label>
          <div class="flex items-center gap-2">
            <Input
              type="text"
              id="accountNumber"
              bind:value={accountNumber}
              placeholder="7276769420"
              autocomplete="one-time-code webauthn"
              class="flex-1"
            />
            <Button
              type="button"
              size="icon"
              aria-label="Sign in with account number"
              onclick={signInWithAccountNumber}
              disabled={busyAction === 'account-number'}
            >
              <Key />
            </Button>
          </div>
        </div>
        <Button type="button" onclick={signInWithAccountNumber} disabled={busyAction === 'account-number'}>
          {busyAction === 'account-number' ? 'Signing in...' : 'Sign in with account number'}
        </Button>
        <Button type="button" onclick={signInWithPasskey} disabled={busyAction === 'passkey-sign-in'} variant="ghost">
          {busyAction === 'passkey-sign-in' ? 'Waiting for passkey...' : 'Sign in with passkey'}
        </Button>
        <Button type="button" onclick={createAccount} disabled={busyAction === 'create-account'} variant="ghost">
          {busyAction === 'create-account' ? 'Creating account...' : 'Create account number'}
        </Button>
        {#if authMessage}
          <p class="text-sm text-red-400">{authMessage}</p>
        {/if}
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
