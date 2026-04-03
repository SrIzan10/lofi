<script lang="ts">
  import { authClient } from "@/auth-client";
  import Button from "../ui/button/button.svelte";

  const session = authClient.useSession();
  const getAccountNumber = () => {
    const user = $session.data?.user as
      | {
          accountNumber?: string;
          account_number?: string;
        }
      | undefined;

    return user?.accountNumber ?? user?.account_number ?? null;
  };
</script>

<div
  class="flex absolute top-0 right-0 items-center p-4 bg-white/10 backdrop-blur-lg rounded-bl-xl shadow-lg *:text-bold space-x-2"
>
  {#if $session.data}
    <div class="text-right">
      <p>Signed in as {$session.data.user.name}</p>
      {#if getAccountNumber()}
        <p class="text-xs opacity-80">#{getAccountNumber()}</p>
      {/if}
    </div>
    <button
      class="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
      on:click={() => authClient.signOut()}
    >
      Sign out
    </button>
  {:else}
    <Button href="/demo/better-auth/login">
      Sign in
    </Button>
  {/if}
</div>
