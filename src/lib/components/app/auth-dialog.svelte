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
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import type { Passkey } from '@better-auth/passkey';

  const session = authClient.useSession();

  let open = $state(false);
  let accountNumber = $state('');
  let name = $state('');
  let authMessage = $state('');
  let busyAction = $state<string | null>(null);
  let passkeyMessage = $state('');
  const user = $derived($session.data?.user);
  let passkeys = $state<Passkey[]>([]);
  let loadedPasskeysForUserId = $state<string | null>(null);
  let authScreen = $state<'login' | 'create'>('login');

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
    onSuccess?: () => void | Promise<void>
  ) => {
    busyAction = action;
    authMessage = '';

    const result = await request();

    busyAction = null;

    if (result.error) {
      authMessage = result.error.message || fallbackMessage;
      return;
    }

    await onSuccess?.();
    open = false;
  };

  const signInWithAccountNumber = () =>
    runAuthAction(
      'account-number',
      () => authClient.signInAccountNumber(accountNumber.replace(/\D/g, '')),
      'Account number sign-in failed',
      () => {
        accountNumber = '';
      }
    );

  const createAccount = () =>
    runAuthAction(
      'create-account',
      () => authClient.createAccount(name),
      'Account creation failed',
      async () => {
        await session.get().refetch();
        name = '';
        authScreen = 'login';
      }
    );

  const signInWithPasskey = () =>
    runAuthAction(
      'passkey-sign-in',
      () =>
        authClient.signIn.passkey({
          autoFill: true,
        }),
      'Passkey sign-in failed'
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
        Account
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
      <div class="flex flex-col gap-5">
        <div class="rounded-xl border border-white/[0.1] bg-white/[0.04] backdrop-blur-sm p-4 shadow-lg">
          <div class="flex items-start gap-3">
            <div class="rounded-full bg-white/10 p-2.5 backdrop-blur-sm">
              <UserRound class="size-4 text-white/90" />
            </div>
            <div class="min-w-0">
              <p class="font-medium text-white">{user.name}</p>
              <p class="text-sm text-white/60">Account #{user.accountNumber}</p>
            </div>
          </div>
        </div>

        {#if passkeys.length > 0}
          <div class="flex flex-col gap-2.5">
            <p class="text-sm font-medium text-white/80">Your passkeys</p>
            <div class="flex flex-col gap-2">
              {#each passkeys as passkey (passkey.id)}
                <div
                  class="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-3 transition-colors hover:bg-white/[0.06]"
                >
                  <Key class="size-4 text-white/70" />
                  <div class="min-w-0 flex-1">
                    <p class="text-white/90">{passkey.name}</p>
                    <p class="text-sm text-white/50">
                      Added on {new Date(passkey.createdAt).toLocaleDateString()}
                    </p>
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

        <div class="flex flex-col gap-2.5">
          <p class="text-sm font-medium text-white/80">Security</p>
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
            <p class="text-sm text-white/70 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">{passkeyMessage}</p>
          {/if}
        </div>

        <Button variant="ghost" onclick={signOut} class="text-white/70 hover:text-white hover:bg-white/10">Sign out</Button>
      </div>
    {:else}
      <div class="flex flex-col gap-4 pt-2">
        {#if authScreen === 'login'}
          <div class="flex w-full flex-col gap-2">
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
                onclick={signInWithPasskey}
                disabled={busyAction === 'passkey-sign-in'}
              >
                <Key />
              </Button>
            </div>
          </div>
          <Button
            type="button"
            onclick={signInWithAccountNumber}
            disabled={busyAction === 'account-number'}
          >
            {busyAction === 'account-number' ? 'Signing in...' : 'Sign in with account number'}
          </Button>

          <div class="relative my-3 flex items-center gap-4">
            <div class="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span class="text-sm text-white/50">or</span>
            <div class="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          <Button
            type="button"
            onclick={() => (authScreen = 'create')}
            disabled={busyAction === 'create-account'}
            variant="ghost"
          >
            {busyAction === 'create-account' ? 'Creating account...' : 'Create account number'}
          </Button>
          {#if authMessage}
            <p class="text-sm text-red-400/90 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">{authMessage}</p>
          {/if}
        {:else if authScreen === 'create'}
          <div class="flex flex-col gap-2">
            <Label for="name">Your name</Label>
            <Input
              type="text"
              id="name"
              bind:value={name}
              placeholder="Steve Jobs"
              autocomplete="name webauthn"
            />
          </div>

          <div class="flex w-full items-center gap-2">
            <Button
              type="button"
              onclick={createAccount}
              disabled={busyAction === 'create-account'}
              class="flex-1"
            >
              {busyAction === 'create-account' ? 'Creating account...' : 'Create account number'}
            </Button>
            <Button
              variant="ghost"
              onclick={() => (authScreen = 'login')}
              disabled={busyAction === 'passkey-sign-in'}
              aria-label="Go back"
            >
              <ArrowLeft />
            </Button>
          </div>
        {/if}
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
