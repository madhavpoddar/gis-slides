<script setup lang="ts">
import { useSlideContext } from '@slidev/client'

const { $page } = useSlideContext()
</script>

<template>
  <div class="slidev-layout prompt">
    <div class="num">{{ String($page - 1).padStart(2, '0') }}</div>
    <div class="body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.prompt {
  display: flex;
  flex-direction: column;
  padding: 2.25rem 2.5rem;
}
.num {
  border-top: 2px solid var(--ink);
  padding-top: 0.6rem;
  width: 13.5rem;
}
.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 44rem;
}
.prompt :deep(h1) {
  font-size: 2.7rem;
  line-height: 1.12;
}
</style>
