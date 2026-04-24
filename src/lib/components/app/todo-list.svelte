<script lang="ts">
  import { state as appState } from '@/state.svelte'
  import Button from '../ui/button/button.svelte';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  
  let newTodoText = $state('');
  
  function addTodo() {
    if (newTodoText.trim()) {
      appState.todoList = [...appState.todoList, newTodoText];
      localStorageWrite();
      newTodoText = '';
    }
  }
  
  function removeTodo(index: number) {
    appState.todoList = appState.todoList.filter((_, i) => i !== index);
    localStorageWrite();
  }

  function localStorageWrite() {
    localStorage.setItem('todoList', JSON.stringify(appState.todoList));
  }

  $effect(() => {
    const storedTodos = localStorage.getItem('todoList');
    if (storedTodos) {
      appState.todoList = JSON.parse(storedTodos);
    }
  })
</script>

<div class="flex gap-2 mb-6">
  <input
    bind:value={newTodoText}
    placeholder="Add a new task..."
    class="flex-1 pl-3 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-foreground placeholder:text-foreground placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-40"
    onkeypress={(e) => e.key === 'Enter' && addTodo()}
  />
  <Button onclick={addTodo} class="bg-white bg-opacity-20 hover:bg-opacity-30 text-foreground px-4 py-2 rounded-lg" size="icon"><Plus /></Button>
</div>

{#if appState.todoList.length === 0}
  <p class="text-foreground text-opacity-70 text-center py-4">No tasks yet. Add one above!</p>
{:else}
  <ul class="space-y-2">
    {#each appState.todoList as todo, index}
      <li class="flex items-center justify-between p-3 bg-white bg-opacity-10 rounded-lg group hover:bg-opacity-15 transition-all">
        <span class="text-foreground">{todo}</span>
        <button 
          onclick={() => removeTodo(index)}
          class="text-foreground hover:text-red-300 focus:outline-none"
          aria-label="Remove todo"
        >
          <X class="size-4" />
        </button>
      </li>
    {/each}
  </ul>
{/if}