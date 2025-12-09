<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        aria-hidden="true"
        @click="$emit('close')"
      ></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Modal Panel -->
      <div class="inline-block align-bottom glass-card text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full animate-slide-up">
        <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                Manage Permissions: {{ role?.roleName }}
              </h3>
              
              <div class="mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                <div v-if="loading" class="text-center py-8">
                  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p class="mt-2 text-sm text-gray-500">Loading permissions...</p>
                </div>
                <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p class="text-sm text-red-800">{{ error }}</p>
                </div>
                <div v-else class="space-y-1">
                  <!-- Header -->
                  <div class="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50/50 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div class="col-span-6">Feature</div>
                    <div class="col-span-2 text-center">Read</div>
                    <div class="col-span-2 text-center">Write</div>
                    <div class="col-span-2 text-center">Execute</div>
                  </div>

                  <!-- Rows -->
                  <div 
                    v-for="feature in features" 
                    :key="feature.featureId" 
                    class="grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-white/40 transition-colors border border-transparent hover:border-white/50"
                  >
                    <div class="col-span-6 flex flex-col">
                      <span class="text-sm font-medium text-gray-900">{{ feature.featureName }}</span>
                      <span class="text-xs text-gray-500">{{ feature.featureDescription }}</span>
                    </div>
                    
                    <div class="col-span-2 flex justify-center">
                      <input 
                        type="checkbox" 
                        v-model="permissions[feature.featureId].canRead"
                        class="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all duration-200 cursor-pointer"
                      />
                    </div>
                    <div class="col-span-2 flex justify-center">
                      <input 
                        type="checkbox" 
                        v-model="permissions[feature.featureId].canWrite"
                        class="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all duration-200 cursor-pointer"
                      />
                    </div>
                    <div class="col-span-2 flex justify-center">
                      <input 
                        type="checkbox" 
                        v-model="permissions[feature.featureId].canExecute"
                        class="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all duration-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
          <button 
            type="button" 
            class="btn-primary w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm"
            @click="savePermissions"
            :disabled="saving"
          >
            <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button 
            type="button" 
            class="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            @click="$emit('close')"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { featuresService } from '@/services/features.service';
import { permissionsService } from '@/services/permissions.service';
import type { Role, Feature, Permission, AssignPermissionDto } from '@/types/uam.types';

const props = defineProps<{
  isOpen: boolean;
  role: Role | null;
  tenantId: string;
}>();

const emit = defineEmits(['close', 'saved']);

const features = ref<Feature[]>([]);
const permissions = ref<Record<string, { canRead: boolean; canWrite: boolean; canExecute: boolean }>>({});
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

watch(() => props.isOpen, async (newValue) => {
  if (newValue && props.role) {
    await loadData();
  }
});

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    // Load features
    features.value = await featuresService.getTenantFeatures(props.tenantId);
    
    // Load existing permissions for the role
    let existingPermissions: Permission[] = [];
    if (props.role) {
      existingPermissions = await permissionsService.getRolePermissions(props.role.id);
    }

    // Initialize permissions object
    permissions.value = {};
    features.value.forEach(feature => {
      const existing = existingPermissions.find(p => p.featureId === feature.featureId);
      permissions.value[feature.featureId] = {
        canRead: existing?.canRead || false,
        canWrite: existing?.canWrite || false,
        canExecute: existing?.canExecute || false,
      };
    });
  } catch (err: any) {
    console.error('Failed to load data:', err);
    error.value = 'Failed to load permissions data.';
  } finally {
    loading.value = false;
  }
}

async function savePermissions() {
  if (!props.role) return;
  
  saving.value = true;
  try {
    const permissionsToSave: AssignPermissionDto[] = Object.entries(permissions.value).map(([featureId, perms]) => ({
      featureId,
      ...perms
    }));

    await permissionsService.bulkAssignPermissions(props.role.id, permissionsToSave);
    emit('saved');
    emit('close');
  } catch (err: any) {
    console.error('Failed to save permissions:', err);
    error.value = 'Failed to save permissions. Please try again.';
  } finally {
    saving.value = false;
  }
}
</script>
