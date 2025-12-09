<template>
  <aside class="fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out glass border-r border-white/20" :class="{ '-translate-x-full': !isOpen, 'translate-x-0': isOpen }">
    <!-- Logo Section -->
    <div class="h-20 flex items-center px-8 border-b border-white/10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          UAM
        </span>
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="p-4 space-y-2 mt-4">
      <router-link 
        to="/" 
        class="flex items-center px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="[isActive('/') ? 'bg-indigo-50/50 text-indigo-600 shadow-sm' : 'text-gray-600 hover:bg-white/40 hover:text-indigo-600']"
      >
        <svg class="w-5 h-5 mr-3 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span class="font-medium">Dashboard</span>
      </router-link>

      <router-link 
        to="/users" 
        class="flex items-center px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="[isActive('/users') ? 'bg-indigo-50/50 text-indigo-600 shadow-sm' : 'text-gray-600 hover:bg-white/40 hover:text-indigo-600']"
      >
        <svg class="w-5 h-5 mr-3 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span class="font-medium">Users</span>
      </router-link>

      <router-link 
        to="/roles" 
        class="flex items-center px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="[isActive('/roles') ? 'bg-indigo-50/50 text-indigo-600 shadow-sm' : 'text-gray-600 hover:bg-white/40 hover:text-indigo-600']"
      >
        <svg class="w-5 h-5 mr-3 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span class="font-medium">Roles</span>
      </router-link>
    </nav>

    <!-- User Profile Section -->
    <div class="absolute bottom-0 left-0 w-full p-4 border-t border-white/10 bg-white/30 backdrop-blur-md">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
          {{ userInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 truncate">
            {{ (authStore.user?.firstName && authStore.user?.lastName) ? `${authStore.user.firstName} ${authStore.user.lastName}` : (authStore.user?.email || 'User') }}
          </p>
          <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
        </div>
      </div>
      <button 
        @click="handleLogout"
        class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50/50 hover:bg-red-100/80 rounded-lg transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

defineProps<{
  isOpen: boolean;
}>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isActive = (path: string) => route.path === path;

const userInitials = computed(() => {
  const name = authStore.user?.firstName && authStore.user?.lastName 
    ? `${authStore.user.firstName} ${authStore.user.lastName}`
    : authStore.user?.email || 'User';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
});

const handleLogout = () => {
  authStore.logout();
  router.push({ name: 'login' });
};
</script>
