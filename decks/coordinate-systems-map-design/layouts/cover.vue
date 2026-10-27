<script setup lang="ts">
import Globe from '../components/Globe.vue'
</script>

<template>
  <div class="slidev-layout cover">
    <Globe class="globe" />
    <slot />
  </div>
</template>

<style scoped>
.cover {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}
.globe {
  position: absolute;
  right: -9rem;
  top: 50%;
  width: 34rem;
  transform: translateY(-50%);
  opacity: 0.55;
}
.cover :deep(h1) {
  position: relative;
  max-width: 30rem;
  font-size: 3.6rem;
  line-height: 1.05;
}
.cover :deep(.course) {
  margin-top: 1.4rem;
  font-size: 1.3rem;
  color: var(--ink);
}
.cover :deep(.meta) {
  margin-top: 0.6rem;
  font-size: 0.95rem;
  color: var(--muted);
}
</style>
