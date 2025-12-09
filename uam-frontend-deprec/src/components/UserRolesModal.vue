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
      <div class="inline-block align-bottom glass-card text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-slide-up">
        <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                Assign Roles to {{ user?.fullName }}
              </h3>
              <div class="mt-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                <div v-if="loading" class="text-center py-8">
                  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p class="mt-2 text-sm text-gray-500">Loading roles...</p>
                </div>
                <div v-else class="space-y-3">
                  <div 
                    v-for="role in roles" 
                    :key="role.id" 
                    class="flex items-center justify-between p-3 rounded-xl hover:bg-white/40 transition-colors border border-transparent hover:border-white/50"
                  >
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-gray-900">{{ role.roleName }}</span>
                        <span 
                          class="px-2 py-0.5 text-xs font-semibold rounded-full border"
                          :class="role.isSystemRole ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'"
                        >
                          {{ role.isSystemRole ? 'System' : 'Custom' }}
                        </span>
                      </div>
                      <span class="text-xs text-gray-500">{{ role.description }}</span>
                    </div>
                    <button 
                      type="button"
                      @click="toggleRole(role.id)"
                      class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      :class="isRoleAssigned(role.id) ? 'bg-indigo-600' : 'bg-gray-200'"
                    >
                      <span class="sr-only">Use setting</span>
                      <span 
                        aria-hidden="true" 
                        class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                        :class="isRoleAssigned(role.id) ? 'translate-x-5' : 'translate-x-0'"
                      ></span>
                    </button>
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
            @click="saveRoles"
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
import { rolesService } from '@/services/roles.service';
import { usersService } from '@/services/users.service';
import type { User, Role } from '@/types/uam.types';

const props = defineProps<{
  isOpen: boolean;
  user: User | null;
}>();

const emit = defineEmits(['close', 'saved']);

const roles = ref<Role[]>([]);
const assignedRoleIds = ref<Set<string>>(new Set());
const loading = ref(false);
const saving = ref(false);

watch(() => props.isOpen, async (newValue) => {
  if (newValue && props.user) {
    await loadData();
  }
});

async function loadData() {
  loading.value = true;
  try {
    // Load all available roles
    roles.value = await rolesService.getRoles();
    
    // Load assigned roles for the user
    if (props.user) {
      const userRoles = await usersService.getUserRoles(props.user.id);
      assignedRoleIds.value = new Set(userRoles.map(ur => ur.roleId));
    }
  } catch (error) {
    console.error('Failed to load roles:', error);
  } finally {
    loading.value = false;
  }
}

function isRoleAssigned(roleId: string): boolean {
  return assignedRoleIds.value.has(roleId);
}

function toggleRole(roleId: string) {
  if (assignedRoleIds.value.has(roleId)) {
    assignedRoleIds.value.delete(roleId);
  } else {
    assignedRoleIds.value.add(roleId);
  }
}

async function saveRoles() {
  if (!props.user) return;
  
  saving.value = true;
  try {
    await usersService.bulkAssignRoles(
      props.user.id,
      Array.from(assignedRoleIds.value)
    );
    emit('saved');
    emit('close');
  } catch (error) {
    console.error('Failed to save roles:', error);
    alert('Failed to save roles. Please try again.');
  } finally {
    saving.value = false;
  }
}
</script>
