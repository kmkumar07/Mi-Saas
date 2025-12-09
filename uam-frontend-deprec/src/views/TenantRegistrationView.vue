<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-4xl space-y-6">
      <header class="space-y-2 text-center">
        <p class="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
          Onboarding
        </p>
        <h1 class="text-2xl sm:text-3xl font-semibold text-slate-50">
          Create your tenant workspace
        </h1>
        <p class="mx-auto max-w-xl text-sm text-slate-300/80">
          We’ll provision a dedicated tenant, an admin user, and a subdomain you can use to access the UAM console.
        </p>
      </header>

      <div class="rounded-2xl border border-white/10 bg-slate-950/75 p-5 shadow-xl shadow-black/40 backdrop-blur sm:p-7">
        <!-- Step indicator -->
        <div class="mb-6 flex items-center justify-between gap-4 text-[11px] text-slate-300">
          <div class="flex items-center gap-1">
            <span class="rounded-full bg-white/10 px-2 py-1 font-medium text-slate-100">
              Step {{ currentStep }} of 4
            </span>
            <span class="hidden text-slate-500 sm:inline">
              {{ stepLabels[currentStep - 1] }}
            </span>
          </div>
          <div class="flex-1">
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
                :style="{ width: `${(currentStep / 4) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleNext" class="space-y-6">
          <!-- Step 1: Account type -->
          <div v-if="currentStep === 1" class="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              class="flex flex-col items-start gap-2 rounded-xl border p-4 text-left text-xs transition hover:border-indigo-400/60 hover:bg-indigo-500/10"
              :class="form.accountType === 'company' ? 'border-indigo-400/70 bg-indigo-500/10' : 'border-white/10 bg-slate-900/60'"
              @click="form.accountType = 'company'"
            >
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-200">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 21v-8a2 2 0 012-2h2m4-4h6a2 2 0 012 2v12H3z"
                  />
                </svg>
              </span>
              <span class="text-sm font-semibold text-slate-50">Company tenant</span>
              <span class="text-[11px] text-slate-400">
                For organizations, teams and SaaS customers that need multiple admins.
              </span>
            </button>

            <button
              type="button"
              class="flex flex-col items-start gap-2 rounded-xl border p-4 text-left text-xs transition hover:border-indigo-400/60 hover:bg-indigo-500/10"
              :class="form.accountType === 'individual' ? 'border-indigo-400/70 bg-indigo-500/10' : 'border-white/10 bg-slate-900/60'"
              @click="form.accountType = 'individual'"
            >
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-200">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </span>
              <span class="text-sm font-semibold text-slate-50">Individual</span>
              <span class="text-[11px] text-slate-400">
                For a single admin exploring or managing a small workspace.
              </span>
            </button>
          </div>

          <!-- Step 2: Tenant details -->
          <div v-if="currentStep === 2" class="space-y-4 text-xs">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="space-y-1.5">
                <span class="block text-[11px] font-medium text-slate-200">
                  {{ form.accountType === 'company' ? 'Company name' : 'Workspace name' }}
                </span>
                <input
                  v-model="form.companyName"
                  type="text"
                  required
                  class="block w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40"
                  :placeholder="form.accountType === 'company' ? 'Acme Inc.' : 'My workspace'"
                />
              </label>

              <label
                v-if="form.accountType === 'company'"
                class="space-y-1.5"
              >
                <span class="block text-[11px] font-medium text-slate-200">
                  Industry (optional)
                </span>
                <select
                  v-model="form.industry"
                  class="block w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40"
                >
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="retail">Retail</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <label class="space-y-1.5">
              <span class="block text-[11px] font-medium text-slate-200">
                Subdomain
              </span>
              <div class="flex rounded-lg border border-slate-700 bg-slate-900/70 text-xs text-slate-100 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/40">
                <input
                  v-model="form.subdomain"
                  type="text"
                  required
                  class="flex-1 rounded-lg bg-transparent px-3 py-2.5 outline-none placeholder-slate-500"
                  placeholder="acme"
                />
                <span class="flex items-center px-3 text-[11px] text-slate-400">
                  .uam.com
                </span>
              </div>
              <p class="text-[11px] text-slate-500">
                This becomes the URL your admins will use to sign in.
              </p>
            </label>
          </div>

          <!-- Step 3: Admin user -->
          <div v-if="currentStep === 3" class="space-y-4 text-xs">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="space-y-1.5">
                <span class="block text-[11px] font-medium text-slate-200">
                  First name
                </span>
                <input
                  v-model="form.firstName"
                  type="text"
                  required
                  class="block w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40"
                  placeholder="Alex"
                />
              </label>

              <label class="space-y-1.5">
                <span class="block text-[11px] font-medium text-slate-200">
                  Last name
                </span>
                <input
                  v-model="form.lastName"
                  type="text"
                  required
                  class="block w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40"
                  placeholder="Rivera"
                />
              </label>
            </div>

            <label class="space-y-1.5">
              <span class="block text-[11px] font-medium text-slate-200">
                Work email
              </span>
              <input
                v-model="form.email"
                type="email"
                required
                class="block w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40"
                placeholder="alex@company.com"
              />
            </label>

            <label class="space-y-1.5">
              <span class="block text-[11px] font-medium text-slate-200">
                Password
              </span>
              <input
                v-model="form.password"
                type="password"
                required
                class="block w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40"
                placeholder="At least 8 characters"
              />
            </label>
          </div>

          <!-- Step 4: Review -->
          <div v-if="currentStep === 4" class="space-y-4 text-xs">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2 rounded-xl border border-white/10 bg-slate-900/70 p-4">
                <p class="text-[11px] font-medium text-slate-300">
                  Tenant
                </p>
                <dl class="space-y-1 text-[11px] text-slate-400">
                  <div class="flex justify-between gap-2">
                    <dt>Type</dt>
                    <dd class="font-medium text-slate-100 capitalize">
                      {{ form.accountType }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-2">
                    <dt>{{ form.accountType === 'company' ? 'Company' : 'Workspace' }}</dt>
                    <dd class="font-medium text-slate-100">
                      {{ form.companyName }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-2">
                    <dt>Subdomain</dt>
                    <dd class="font-medium text-slate-100">
                      {{ form.subdomain }}.uam.com
                    </dd>
                  </div>
                </dl>
              </div>

              <div class="space-y-2 rounded-xl border border-white/10 bg-slate-900/70 p-4">
                <p class="text-[11px] font-medium text-slate-300">
                  Admin user
                </p>
                <dl class="space-y-1 text-[11px] text-slate-400">
                  <div class="flex justify-between gap-2">
                    <dt>Name</dt>
                    <dd class="font-medium text-slate-100">
                      {{ form.firstName }} {{ form.lastName }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-2">
                    <dt>Email</dt>
                    <dd class="font-medium text-slate-100">
                      {{ form.email }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <label class="mt-2 flex items-start gap-2 text-[11px] text-slate-400">
              <input
                id="terms"
                v-model="form.termsAccepted"
                type="checkbox"
                required
                class="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/60"
              />
              <span>
                I agree to the
                <a href="#" class="text-indigo-400 hover:text-indigo-300">Terms of Service</a>
                and
                <a href="#" class="text-indigo-400 hover:text-indigo-300">Privacy Policy</a>.
              </span>
            </label>
          </div>

          <!-- Navigation buttons -->
          <div class="flex items-center justify-between pt-2 text-xs">
            <button
              v-if="currentStep > 1"
              type="button"
              @click="currentStep--"
              class="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-slate-100 hover:bg-white/10"
            >
              Back
            </button>
            <span v-else />

            <button
              type="submit"
              :disabled="loading"
              class="btn btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg
                v-if="loading"
                class="h-3.5 w-3.5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>
                {{
                  currentStep === 4
                    ? loading
                      ? 'Creating workspace…'
                      : 'Create workspace'
                    : 'Continue'
                }}
              </span>
            </button>
          </div>
        </form>
      </div>

      <p class="text-center text-[11px] text-slate-500">
        Already have a workspace?
        <router-link
          to="/login"
          class="font-medium text-indigo-400 hover:text-indigo-300"
        >
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const currentStep = ref(1);
const stepLabels = ['Type', 'Details', 'Admin', 'Review'];
const loading = ref(false);

const form = reactive({
  accountType: 'company', // 'company' | 'individual'
  companyName: '',
  industry: '',
  subdomain: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  termsAccepted: false
});

const handleNext = async () => {
  if (currentStep.value < 4) {
    currentStep.value++;
  } else {
    await submitRegistration();
  }
};

const submitRegistration = async () => {
  loading.value = true;
  try {
    // Simulate API call
    console.log('Submitting registration:', form);
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push({ name: 'login' });
  } catch (error) {
    console.error('Registration failed:', error);
  } finally {
    loading.value = false;
  }
};
</script>
