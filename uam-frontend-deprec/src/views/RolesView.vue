<template>
  <div class="min-h-screen lg:flex">
    <Sidebar :is-open="isSidebarOpen" />

    <main class="flex-1 lg:pl-64">
      <!-- Mobile top bar -->
      <header
        class="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-slate-950/80 px-4 py-3 backdrop-blur lg:hidden"
      >
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500">
            <span class="text-xs font-semibold text-white">R</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Roles</span>
            <span class="text-sm font-semibold text-slate-50">Permissions</span>
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
              Authorization
            </p>
            <h1 class="text-2xl sm:text-3xl font-semibold text-slate-50">
              Roles &amp; permissions
            </h1>
            <p class="max-w-xl text-sm text-slate-300/80">
              Model how different personas operate in your product, then attach those roles to users and groups.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn btn-secondary inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              Role matrix
            </button>

            <button
              type="button"
              @click="showCreateModal = true"
              class="btn btn-primary inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs text-white"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New role
            </button>
          </div>
        </section>

        <!-- Loading / error / grid -->
        <section>
          <!-- Loading state -->
          <div
            v-if="loading"
            class="flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 py-16 text-xs text-slate-300 shadow-lg shadow-black/40 backdrop-blur"
          >
            <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <span
                class="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-purple-400/40 border-t-transparent text-purple-300"
              ></span>
              <span>Loading roles…</span>
            </div>
          </div>

          <!-- Error state -->
          <div
            v-else-if="error"
            class="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center text-sm text-red-100 shadow-lg shadow-red-900/40 backdrop-blur"
          >
            <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/30">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p class="font-medium">
              {{ error }}
            </p>
          </div>

          <!-- Roles grid -->
          <div
            v-else
            class="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <article
              v-for="role in roles"
              :key="role.id"
              class="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs text-slate-200 shadow-lg shadow-black/40 backdrop-blur"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold"
                    :class="role.isSystemRole ? 'bg-purple-500/20 text-purple-100' : 'bg-indigo-500/20 text-indigo-100'"
                  >
                    {{ role.roleName[0] || 'R' }}
                  </div>
                  <div class="space-y-0.5">
                    <h2 class="text-sm font-semibold text-slate-50">
                      {{ role.roleName }}
                    </h2>
                    <p class="text-[11px] text-slate-400">
                      Level {{ role.hierarchyLevel }} ·
                      <span v-if="role.isSystemRole">System role</span>
                      <span v-else>Custom role</span>
                    </p>
                  </div>
                </div>
                <span
                  class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  :class="role.isSystemRole ? 'border-purple-400/40 bg-purple-500/15 text-purple-100' : 'border-sky-400/40 bg-sky-500/15 text-sky-100'"
                >
                  {{ role.isSystemRole ? 'System' : 'Custom' }}
                </span>
              </div>

              <p class="mt-3 line-clamp-2 text-[11px] text-slate-300/90">
                {{ role.description || 'No description has been added for this role yet.' }}
              </p>

              <div class="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span class="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                  Scoped to tenant
                </span>
                <div class="flex gap-1.5">
                  <button
                    @click="openPermissionsModal(role)"
                    class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-100 hover:border-indigo-400/60 hover:bg-indigo-500/15"
                    title="Manage permissions"
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
                    Permissions
                  </button>

                  <button
                    v-if="!role.isSystemRole"
                    @click="deleteRole(role.id)"
                    class="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-100 hover:bg-red-500/20"
                    title="Delete role"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Create Role Modal -->
        <CreateRoleModal
          :is-open="showCreateModal"
          @close="showCreateModal = false"
          @created="handleRoleCreated"
        />

        <!-- Role Permissions Modal -->
        <RolePermissionsModal
          :is-open="showPermissionsModal"
          :role="selectedRole"
          :tenant-id="TENANT_ID"
          @close="showPermissionsModal = false"
          @saved="handlePermissionsSaved"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { rolesService } from '@/services/roles.service';
import CreateRoleModal from '@/components/CreateRoleModal.vue';
import RolePermissionsModal from '@/components/RolePermissionsModal.vue';
import Sidebar from '@/components/Sidebar.vue';
import type { Role } from '@/types/uam.types';

const TENANT_ID = '9f5c880c-8aa6-4127-9a7d-757ebd11c5cd';

const roles = ref<Role[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showCreateModal = ref(false);
const showPermissionsModal = ref(false);
const selectedRole = ref<Role | null>(null);
const isSidebarOpen = ref(true);

onMounted(async () => {
  await loadRoles();
});

async function loadRoles() {
  loading.value = true;
  error.value = null;

  try {
    roles.value = await rolesService.getRoles();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load roles';
    console.error('Error loading roles:', err);
  } finally {
    loading.value = false;
  }
}

function openPermissionsModal(role: Role) {
  selectedRole.value = role;
  showPermissionsModal.value = true;
}

async function handleRoleCreated() {
  await loadRoles();
}

async function handlePermissionsSaved() {
  // Optionally reload roles or show success message
}

async function deleteRole(roleId: string) {
  if (!confirm('Are you sure you want to delete this role?')) return;

  try {
    await rolesService.deleteRole(roleId);
    await loadRoles();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to delete role');
    console.error('Error deleting role:', err);
  }
}
</script>
