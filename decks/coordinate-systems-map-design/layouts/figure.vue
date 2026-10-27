<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

// wide: no question, the image takes the full width.
// Without an image, the `::plate::` slot fills that space instead.
const props = defineProps<{ image?: string, credit?: string, wide?: boolean }>()
const { $page } = useSlideContext()
// Public files need the deck's base path once deployed
const src = computed(() => props.image && import.meta.env.BASE_URL + props.image.replace(/^\//, ''))
</script>

<template>
  <div class="slidev-layout figure" :class="{ wide }">
    <aside>
      <div class="num">{{ String($page - 1).padStart(2, '0') }}</div>
      <slot />
      <div v-if="credit" class="credit">{{ credit }}</div>
    </aside>
    <div class="plate">
      <slot name="plate">
        <img :src="src" alt="" />
      </slot>
    </div>
  </div>
</template>

<style scoped>
.figure {
  display: grid;
  grid-template-columns: 13.5rem 1fr;
  gap: 2.25rem;
  padding: 2.25rem 2.5rem;
}
aside {
  display: flex;
  flex-direction: column;
  border-top: 2px solid var(--ink);
  padding-top: 0.6rem;
}
.credit {
  margin-top: auto;
}
.plate {
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.plate img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.wide {
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  gap: 0;
}
.wide aside {
  width: 13.5rem;
}
.wide .plate {
  padding: 0.5rem 0 1.25rem;
}
.wide .credit {
  position: absolute;
  left: 2.5rem;
  bottom: 1.5rem;
}
</style>
