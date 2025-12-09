<template>
  <div id="app">
    <header class="app-header">
      <div class="app-header__brand">AG SaaS</div>
      <button
        v-if="isUamAuthenticated"
        class="app-header__logout"
        type="button"
        @click="handleLogout"
      >
        Logout
      </button>
    </header>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, logout } from './services/uamAuth';

const router = useRouter();
const isUamAuthenticated = ref(false);

onMounted(async () => {
  try {
    await getCurrentUser();
    isUamAuthenticated.value = true;
  } catch {
    isUamAuthenticated.value = false;
  }
});

async function handleLogout() {
  await logout();
  isUamAuthenticated.value = false;
  router.push({ name: 'Subscription' });
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.app-header__brand {
  font-weight: 600;
}

.app-header__logout {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-size: 0.9rem;
}

.app-header__logout:hover {
  text-decoration: underline;
}

.app-main {
  flex: 1;
}
</style>

