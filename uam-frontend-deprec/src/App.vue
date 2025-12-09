<script setup lang="ts">
import { RouterView } from 'vue-router';
import '@/assets/styles.css';
</script>

<template>
  <div id="app" class="min-h-screen font-sans text-gray-900">
    <!-- Global background + subtle mesh gradient -->
    <div class="relative min-h-screen overflow-hidden bg-mesh-dark">
      <!-- Soft vignette overlay -->
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"
      ></div>

      <!-- Main app content -->
      <div class="relative z-10">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style>
/* Global styles are defined in assets/main.css and assets/styles.css */
</style>
