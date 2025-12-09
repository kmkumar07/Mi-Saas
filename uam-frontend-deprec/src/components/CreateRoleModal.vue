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
        <form @submit.prevent="handleSubmit">
          <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                  Create New Role
                </h3>
                <div class="mt-4 space-y-4">
                  <div class="group">
                    <label for="roleName" class="block text-sm font-medium text-gray-700 mb-1 ml-1">Role Name</label>
                    <input
                      type="text"
                      id="roleName"
                      v-model="form.roleName"
                      required
                      class="glass-input block w-full px-4 py-2 rounded-xl sm:text-sm placeholder-gray-400 focus:outline-none"
                      placeholder="e.g. Content Editor"
                    />
                  </div>
                  
                  <div class="group">
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-1 ml-1">Description</label>
                    <textarea
                      id="description"
                      v-model="form.description"
                      rows="3"
                      class="glass-input block w-full px-4 py-2 rounded-xl sm:text-sm placeholder-gray-400 focus:outline-none resize-none"
                      placeholder="Describe the role's responsibilities..."
                    ></textarea>
                  </div>

                  <div class="group">
                    <label for="hierarchyLevel" class="block text-sm font-medium text-gray-700 mb-1 ml-1">Hierarchy Level</label>
                    <input
                      type="number"
                      id="hierarchyLevel"
                      v-model="form.hierarchyLevel"
                      min="1"
                      max="100"
                      required
                      class="glass-input block w-full px-4 py-2 rounded-xl sm:text-sm placeholder-gray-400 focus:outline-none"
                    />
                    <p class="mt-1 text-xs text-gray-500 ml-1">Higher number means higher authority (1-100)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
            <button 
              type="submit" 
              class="btn-primary w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm"
              :disabled="loading"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Creating...' : 'Create Role' }}
            </button>
            <button 
              type="button" 
              class="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              @click="$emit('close')"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { rolesService } from '@/services/roles.service';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close', 'created']);

const loading = ref(false);
const form = reactive({
  roleName: '',
  roleCode: '',
  description: '',
  hierarchyLevel: 1
});

watch(() => form.roleName, (newName: string) => {
  // Auto-generate role code from name
  form.roleCode = newName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_'); // Replace spaces with underscores
});

async function handleSubmit() {
  loading.value = true;
  try {
    await rolesService.createRole({
      roleName: form.roleName,
      roleCode: form.roleCode,
      description: form.description,
      hierarchyLevel: form.hierarchyLevel,
    });
    
    // Reset form
    form.roleName = '';
    form.roleCode = '';
    form.description = '';
    form.hierarchyLevel = 1;
    
    emit('created');
    emit('close');
  } catch (error) {
    console.error('Failed to create role:', error);
    alert('Failed to create role. Please try again.');
  } finally {
    loading.value = false;
  }
}
</script>
