<template>
  <div class="min-h-screen lg:flex">
    <!-- Sidebar / navigation -->
    <Sidebar :is-open="isSidebarOpen" />

    <!-- Main content -->
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
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Dashboard</span>
            <span class="text-sm font-semibold text-slate-50">UAM Console</span>
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

      <div class="container py-8 space-y-8">
        <!-- Greeting + overview -->
        <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
              Overview
            </p>
            <h1 class="text-2xl sm:text-3xl font-semibold text-slate-50">
              Welcome, <span class="text-gradient">{{ authStore.user?.firstName || 'Admin' }}</span>
            </h1>
            <p class="max-w-xl text-sm text-slate-300/80">
              Monitor how access is being used across your tenants and quickly jump into users, roles, and
              invitations.
            </p>
          </div>

          <div class="flex gap-2 text-xs text-slate-300/80">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
              Live environment
            </div>
          </div>
        </section>

        <!-- Key metrics -->
        <section class="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
          <router-link
            to="/users"
            class="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-black/40 backdrop-blur transition hover:border-indigo-400/60 hover:bg-slate-950"
          >
            <div class="flex items-center justify-between">
              <div class="space-y-2">
                <p class="text-xs font-medium text-slate-400">People directory</p>
                <p class="text-lg font-semibold text-slate-50">Users</p>
                <p class="text-xs text-slate-400">Manage identities and status.</p>
              </div>
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 group-hover:bg-indigo-500/20"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-1a4 4 0 00-4-4h-3m-4 5H2v-1a4 4 0 014-4h3m3-4a4 4 0 100-8 4 4 0 000 8zm0 0v1a4 4 0 01-4 4"
                  />
                </svg>
              </div>
            </div>
          </router-link>

          <router-link
            to="/roles"
            class="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-black/40 backdrop-blur transition hover:border-purple-400/60 hover:bg-slate-950"
          >
            <div class="flex items-center justify-between">
              <div class="space-y-2">
                <p class="text-xs font-medium text-slate-400">Policy surface</p>
                <p class="text-lg font-semibold text-slate-50">Roles</p>
                <p class="text-xs text-slate-400">Configure what each persona can do.</p>
              </div>
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300 group-hover:bg-purple-500/20"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m4.618-4.016A11.955 11.955 0 0012 2.944 11.955 11.955 0 003.382 5.984 12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
          </router-link>

          <div
            class="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-black/40 backdrop-blur"
          >
            <div class="flex items-center justify-between">
              <div class="space-y-2">
                <p class="text-xs font-medium text-slate-400">Invitations</p>
                <p class="text-lg font-semibold text-slate-50">Pending access</p>
                <p class="text-xs text-slate-400">Track invites waiting to be accepted.</p>
              </div>
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5A2 2 0 003 7v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            class="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-lg shadow-emerald-900/40 backdrop-blur xl:col-span-1 md:col-span-3 xl:col-auto"
          >
            <div class="flex items-center justify-between">
              <div class="space-y-1.5">
                <p class="text-xs font-medium text-emerald-300">Access health</p>
                <p class="text-lg font-semibold text-emerald-50">No critical alerts</p>
                <p class="text-xs text-emerald-100/80">
                  All role assignments are within configured boundaries.
                </p>
              </div>
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-100">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <!-- Activity + quick links -->
        <section class="grid gap-6 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr)]">
          <!-- Recent activity -->
          <div class="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-lg shadow-black/40 backdrop-blur">
            <div class="flex items-center justify-between pb-3">
              <div>
                <h2 class="text-sm font-semibold text-slate-50">Recent activity</h2>
                <p class="mt-1 text-xs text-slate-400">
                  High‑signal events from the last 24 hours.
                </p>
              </div>
              <button class="text-[11px] font-medium text-slate-400 hover:text-slate-200">
                View audit log
              </button>
            </div>

            <ul class="mt-2 space-y-3 text-xs">
              <li
                v-for="i in 4"
                :key="i"
                class="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 text-slate-100"
              >
                <div
                  class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-semibold text-indigo-100"
                >
                  U{{ i }}
                </div>
                <div class="flex-1 space-y-0.5">
                  <p class="font-medium">
                    User profile updated
                  </p>
                  <p class="text-[11px] text-slate-400">
                    Display name, primary email and role membership were changed.
                  </p>
                </div>
                <p class="ml-2 whitespace-nowrap text-[11px] text-slate-500">
                  {{ i }}h ago
                </p>
              </li>
            </ul>
          </div>

          <!-- Quick actions -->
          <div class="space-y-4">
            <div
              class="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-lg shadow-black/40 backdrop-blur"
            >
              <h2 class="text-sm font-semibold text-slate-50">Quick actions</h2>
              <p class="mt-1 text-xs text-slate-400">
                Common flows you run most often.
              </p>

              <div class="mt-4 space-y-2 text-xs">
                <router-link
                  to="/users"
                  class="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 text-slate-100 hover:border-indigo-400/60 hover:bg-indigo-500/10"
                >
                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20">
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </span>
                    <span>Create a new user</span>
                  </div>
                  <span class="text-[10px] text-slate-400">Users</span>
                </router-link>

                <router-link
                  to="/roles"
                  class="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 text-slate-100 hover:border-purple-400/60 hover:bg-purple-500/10"
                >
                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20">
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12l2 2 4-4"
                        />
                      </svg>
                    </span>
                    <span>Adjust role permissions</span>
                  </div>
                  <span class="text-[10px] text-slate-400">Roles</span>
                </router-link>
              </div>
            </div>

            <div class="rounded-2xl border border-dashed border-white/20 bg-slate-950/40 p-4 text-xs text-slate-300">
              <p class="font-medium text-slate-100">Tip</p>
              <p class="mt-1 text-[11px] text-slate-400">
                Connect your UAM backend audit stream to your observability stack to get deep visibility into access
                changes over time.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Sidebar from '@/components/Sidebar.vue';

const authStore = useAuthStore();
const isSidebarOpen = ref(true);
</script>
