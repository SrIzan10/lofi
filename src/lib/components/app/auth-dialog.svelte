<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { authClient } from '$lib';
  import LogIn from '@lucide/svelte/icons/log-in';
  import Settings from '@lucide/svelte/icons/settings-2';
  import { Button } from '../ui/button';
  import Label from '../ui/label/label.svelte';
  import Input from '../ui/input/input.svelte';
  import Key from '@lucide/svelte/icons/key';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Fingerprint from '@lucide/svelte/icons/fingerprint';
  import Plus from '@lucide/svelte/icons/plus';
  import Loader2 from '@lucide/svelte/icons/loader-2';
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
    passkeyMessage = 'Passkey added successfully';
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
    passkeyMessage = 'Passkey removed';
  };
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    <Button class="group relative overflow-hidden gap-2 font-medium tracking-wide">
      <span class="relative z-10 flex items-center gap-2">
        {#if user}
          <Settings class="size-4 transition-transform duration-300 group-hover:rotate-45" />
          Account
        {:else}
          <LogIn class="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          Sign in
        {/if}
      </span>
    </Button>
  </Dialog.Trigger>
  <Dialog.Content class="!p-0 !gap-0 overflow-hidden max-w-md w-[95vw]">
    <Dialog.Header class="p-5 border-b border-white/[0.06]">
      <Dialog.Title class="!text-lg !font-semibold tracking-tight">
        {user ? 'Account Settings' : 'Welcome Back'}
      </Dialog.Title>
      <p class="text-sm text-white/50 mt-1">
        {user ? 'Manage your account and security' : 'Sign in to sync your preferences'}
      </p>
    </Dialog.Header>

    <div class="p-6 pt-2 space-y-5">
      {#if user}
        <div
          class="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]"
        >
          <div
            class="flex-shrink-0 w-12 h-12 rounded-full bg-white/[0.1] flex items-center justify-center"
          >
            <span class="text-lg font-bold text-white">{user.name?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-white truncate">{user.name}</p>
            <p class="text-sm text-white/50 font-mono tracking-tight">#{user.accountNumber}</p>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-medium text-white/80">Passkeys</h3>

          <div class="space-y-2">
            {#each passkeys as passkey (passkey.id)}
              <div
                class="group flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.1]"
              >
                <div
                  class="flex-shrink-0 w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center"
                >
                  <Key class="size-4 text-white/70" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-white/90 truncate">{passkey.name}</p>
                  <p class="text-xs text-white/40">
                    {new Date(passkey.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  class="!size-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 !text-red-400/70 hover:!text-red-400 hover:!bg-red-500/10"
                  aria-label="Delete passkey"
                  onclick={() => deletePasskey(passkey.id)}
                  disabled={busyAction === `delete-passkey-${passkey.id}`}
                >
                  {#if busyAction === `delete-passkey-${passkey.id}`}
                    <Loader2 class="size-4 animate-spin" />
                  {:else}
                    <Trash2 class="size-3.5" />
                  {/if}
                </Button>
              </div>
            {:else}
              <div
                class="flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.1] text-white/40"
              >
                <Fingerprint class="size-5 opacity-50" />
                <p class="text-sm">No passkeys added yet</p>
              </div>
            {/each}
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex gap-2">
            <div class="flex-1">
              <Input
                type="text"
                id="passkeyName"
                bind:value={passkeyName}
                placeholder="Device name"
                class="!h-10"
              />
            </div>
            <Button onclick={addPasskey} disabled={busyAction === 'add-passkey'} class="!h-10 px-4">
              {#if busyAction === 'add-passkey'}
                <Loader2 class="size-4 animate-spin" />
              {:else}
                <Plus class="size-4" />
              {/if}
            </Button>
          </div>
          {#if passkeyMessage}
            <p
              class="text-xs px-3 py-2 rounded-lg {passkeyMessage.includes('success') ||
              passkeyMessage.includes('removed') ||
              passkeyMessage.includes('added')
                ? 'bg-white/[0.06] text-white/70 border border-white/[0.08]'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'}"
            >
              {passkeyMessage}
            </p>
          {/if}
        </div>

        <div class="pt-3 border-t border-white/[0.06]">
          <Button
            variant="ghost"
            onclick={signOut}
            disabled={busyAction === 'sign-out'}
            class="w-full justify-center gap-2 text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            {#if busyAction === 'sign-out'}
              <Loader2 class="size-4 animate-spin" />
            {:else}
              <LogIn class="size-4 rotate-180" />
            {/if}
            Sign out
          </Button>
        </div>
      {:else if authScreen === 'login'}
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="accountNumber" class="text-white/70">Account Number</Label>
            <Input
              type="text"
              id="accountNumber"
              bind:value={accountNumber}
              placeholder="Enter your account number"
              autocomplete="one-time-code webauthn"
            />
          </div>

          <div class="flex gap-2">
            <Button
              type="button"
              onclick={signInWithAccountNumber}
              disabled={busyAction === 'account-number' || !accountNumber}
              class="flex-1 disabled:opacity-50"
            >
              {#if busyAction === 'account-number'}
                <Loader2 class="size-4 animate-spin" />
                Signing in...
              {:else}
                Sign in
              {/if}
            </Button>
            <Button
              type="button"
              size="icon"
              onclick={signInWithPasskey}
              disabled={busyAction === 'passkey-sign-in'}
              class="!w-auto px-3"
              title="Sign in with passkey"
            >
              {#if busyAction === 'passkey-sign-in'}
                <Loader2 class="size-4 animate-spin" />
              {:else}
                <Fingerprint class="size-4" />
              {/if}
            </Button>
          </div>
        </div>

        <div class="relative flex items-center gap-3 py-2">
          <div
            class="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
          ></div>
          <span class="text-xs text-white/30 uppercase tracking-wider font-medium">or</span>
          <div
            class="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
          ></div>
        </div>

        <Button
          type="button"
          onclick={() => (authScreen = 'create')}
          disabled={busyAction === 'create-account'}
          variant="ghost"
          class="w-full justify-center text-white/60 hover:text-white hover:bg-white/[0.06]"
        >
          Create new account
        </Button>

        {#if authMessage}
          <p
            class="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20"
          >
            {authMessage}
          </p>
        {/if}
      {:else if authScreen === 'create'}
        <div class="space-y-4">
          <Button
            type="button"
            variant="ghost"
            onclick={() => (authScreen = 'login')}
            disabled={busyAction === 'create-account'}
            class="!p-0 h-auto text-white/50 hover:text-white hover:bg-transparent"
          >
            <ArrowLeft class="size-4 mr-1" />
            Back to sign in
          </Button>

          <div class="space-y-2">
            <Label for="name" class="text-white/70">Your Name</Label>
            <Input
              type="text"
              id="name"
              bind:value={name}
              placeholder="What should we call you?"
              autocomplete="name webauthn"
            />
          </div>

          <Button
            type="button"
            onclick={createAccount}
            disabled={busyAction === 'create-account' || !name}
            class="w-full disabled:opacity-50"
          >
            {#if busyAction === 'create-account'}
              <Loader2 class="size-4 animate-spin" />
              Creating account...
            {:else}
              Create Account
            {/if}
          </Button>

          {#if authMessage}
            <p
              class="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20"
            >
              {authMessage}
            </p>
          {/if}
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
