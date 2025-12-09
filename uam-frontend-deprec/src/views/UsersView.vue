<template>
  <div class="min-h-screen lg:flex">
    <Sidebar :is-open="isSidebarOpen" />

    <main class="flex-1 lg:pl-64">
      <!-- Mobile top bar -->
      <header
        class="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-slate-950/80 px-4 py-3 backdrop-blur lg:hidden"
      >
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-sky-500">
            <span class="text-xs font-semibold text-white">U</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Users</span>
            <span class="text-sm font-semibold text-slate-50">Directory</span>
          </div>
        </div>
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <div class="container py-8 space-y-6">
        <!-- Header -->
        <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
              Identity
            </p>
            <h1 class="text-2xl sm:text-3xl font-semibold text-slate-50">
              Users
            </h1>
            <p class="max-w-xl text-sm text-slate-300/80">
              Every person with access to your tenants, along with their roles and current status.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn btn-secondary inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7a5 5 0 1110 0v4a5 5 0 11-10 0V7z" />
              </svg>
              Export
            </button>

            <button
              type="button"
              class="btn btn-primary inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs text-white"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add user
            </button>
          </div>
        </section>

        <!-- Table + states -->
        <section class="rounded-2xl border border-white/10 bg-slate-950/70 shadow-lg shadow-black/40 backdrop-blur">
          <div class="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
            <div class="flex items-center gap-2 text-xs text-slate-300">
              <span class="hidden text-slate-400 sm:inline">Directory</span>
              <span class="h-1 w-1 rounded-full bg-slate-500 sm:hidden" />
            </div>
            <div class="flex flex-1 justify-end gap-2">
              <input
                type="search"
                placeholder="Search users"
                class="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-xs text-slate-200">
              <thead class="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold">User</th>
                  <th class="px-4 py-3 text-left font-semibold">Roles</th>
                  <th class="px-4 py-3 text-left font-semibold">Status</th>
                  <th class="px-4 py-3 text-left font-semibold">Last login</th>
                  <th class="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr v-if="loading">
                  <td colspan="5" class="px-4 py-10 text-center">
                    <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <span
                        class="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-indigo-400/40 border-t-transparent text-indigo-300"
                      ></span>
                      <span class="text-xs text-slate-300">Loading users…</span>
                    </div>
                  </td>
                </tr>

                <tr v-else-if="error">
                  <td colspan="5" class="px-4 py-10 text-center">
                    <div class="inline-flex max-w-md items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left text-[11px] text-red-100">
                      <svg class="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{{ error }}</span>
                    </div>
                  </td>
                </tr>

                <tr v-else-if="users.length === 0">
                  <td colspan="5" class="px-4 py-10 text-center text-xs text-slate-400">
                    No users found for this tenant yet.
                  </td>
                </tr>

                <tr
                  v-else
                  v-for="user in users"
                  :key="user.id"
                  class="hover:bg-slate-900/60"
                >
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-semibold text-white"
                      >
                        {{ user.firstName?.[0] || 'U' }}
                      </div>
                      <div class="space-y-0.5">
                        <p class="text-xs font-medium text-slate-50">
                          {{ user.fullName }}
                        </p>
                        <p class="text-[11px] text-slate-400">
                          {{ user.email }}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        v-for="roleId in userRolesMap[user.id] || []"
                        :key="roleId"
                        class="inline-flex items-center rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-100"
                      >
                        {{ getRoleName(roleId) }}
                      </span>
                      <span
                        v-if="!userRolesMap[user.id] || userRolesMap[user.id].length === 0"
                        class="text-[11px] italic text-slate-500"
                      >
                        No roles
                      </span>
                    </div>
                  </td>

                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                      :class="user.isActive ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' : 'border-red-500/40 bg-red-500/10 text-red-100'"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full"
                        :class="user.isActive ? 'bg-emerald-400' : 'bg-red-400'"
                      />
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>

                  <td class="px-4 py-3 text-[11px] text-slate-400">
                    {{ user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never' }}
                  </td>

                  <td class="px-4 py-3 text-right">
                    <button
                      @click="openRolesModal(user)"
                      class="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-1 text-[11px] font-medium text-indigo-50 hover:bg-indigo-500/25"
                    >
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0A1.724 1.724 0 0016.248 5.3c1.543-.94 3.31.826 2.37 2.37A1.724 1.724 0 0019.683 10.5c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.065 2.572c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0A1.724 1.724 0 007.752 18.2c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35A1.724 1.724 0 005.93 7.67c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.025-.983z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Roles
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- User Roles Modal -->
      <UserRolesModal
        :is-open="showRolesModal"
        :user="selectedUser"
        @close="showRolesModal = false"
        @saved="handleRolesSaved"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { usersService } from '@/services/users.service';
import { rolesService } from '@/services/roles.service';
import UserRolesModal from '@/components/UserRolesModal.vue';
import Sidebar from '@/components/Sidebar.vue';
import type { User, Role, UserRole } from '@/types/uam.types';

const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const userRoles = ref<UserRole[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showRolesModal = ref(false);
const selectedUser = ref<User | null>(null);
const isSidebarOpen = ref(true);

// Map of userId to array of roleIds
const userRolesMap = computed(() => {
  const map: Record<string, string[]> = {};
  userRoles.value.forEach(ur => {
    if (!map[ur.userId]) {
      map[ur.userId] = [];
    }
    map[ur.userId].push(ur.roleId);
  });
  return map;
});

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    // Load users and roles in parallel
    [users.value, roles.value] = await Promise.all([
      usersService.getUsers(),
      rolesService.getRoles(),
    ]);

    // Load roles for each user
    const userRolesPromises = users.value.map(user => 
      usersService.getUserRoles(user.id).catch(() => [])
    );
    const allUserRoles = await Promise.all(userRolesPromises);
    userRoles.value = allUserRoles.flat();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load users';
    console.error('Error loading data:', err);
  } finally {
    loading.value = false;
  }
}

function getRoleName(roleId: string): string {
  const role = roles.value.find(r => r.id === roleId);
  return role?.roleName || 'Unknown';
}

function openRolesModal(user: User) {
  selectedUser.value = user;
  showRolesModal.value = true;
}

async function handleRolesSaved() {
  await loadData();
}
</script>
