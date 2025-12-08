<template>
  <div class="registration-form">
    <div class="form-steps">
      <div class="step-indicator">
        <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
          <div class="step-number">1</div>
          <div class="step-label">Tenant</div>
        </div>
        <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
        <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
          <div class="step-number">2</div>
          <div class="step-label">Account</div>
        </div>
      </div>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Step 1: Tenant Registration -->
      <div v-if="currentStep === 1" class="form-step">
        <h2>Tenant Information</h2>
        <p class="step-description">Create your organization tenant</p>

        <div class="form-group">
          <label for="tenantName">Tenant Name <span class="required">*</span></label>
          <input
            id="tenantName"
            v-model="tenantForm.name"
            type="text"
            required
            placeholder="Enter tenant name"
            :class="{ error: errors.tenantName }"
          />
          <span v-if="errors.tenantName" class="error-message">{{ errors.tenantName }}</span>
        </div>

        <div class="form-group">
          <label for="emailDomain">Email Domain</label>
          <input
            id="emailDomain"
            v-model="tenantForm.emailDomain"
            type="text"
            placeholder="example.com"
          />
        </div>

        <div class="form-actions">
          <button type="button" @click="nextStep" class="btn btn-primary">
            Continue to Account
          </button>
        </div>
      </div>

      <!-- Step 2: Account Registration -->
      <div v-if="currentStep === 2" class="form-step">
        <h2>Account Information</h2>
        <p class="step-description">Set up your billing account</p>

        <div class="form-group">
          <label for="companyName">Company Name <span class="required">*</span></label>
          <input
            id="companyName"
            v-model="accountForm.companyName"
            type="text"
            required
            placeholder="Enter company name"
            :class="{ error: errors.companyName }"
          />
          <span v-if="errors.companyName" class="error-message">{{ errors.companyName }}</span>
        </div>

        <div class="form-group">
          <label for="legalName">Legal Name</label>
          <input
            id="legalName"
            v-model="accountForm.legalName"
            type="text"
            placeholder="Enter legal company name"
          />
        </div>

        <div class="form-group">
          <label for="taxId">Tax ID</label>
          <input
            id="taxId"
            v-model="accountForm.taxId"
            type="text"
            placeholder="GST/VAT number"
          />
        </div>

        <div class="form-group">
          <label for="billingEmail">Billing Email <span class="required">*</span></label>
          <input
            id="billingEmail"
            v-model="accountForm.billingEmail"
            type="email"
            required
            placeholder="billing@example.com"
            :class="{ error: errors.billingEmail }"
          />
          <span v-if="errors.billingEmail" class="error-message">{{ errors.billingEmail }}</span>
        </div>

        <div class="form-section">
          <h3>Billing Address</h3>
          
          <div class="form-group">
            <label for="billingAddressLine1">Address Line 1</label>
            <input
              id="billingAddressLine1"
              v-model="accountForm.billingAddressLine1"
              type="text"
              placeholder="Street address"
            />
          </div>

          <div class="form-group">
            <label for="billingAddressLine2">Address Line 2</label>
            <input
              id="billingAddressLine2"
              v-model="accountForm.billingAddressLine2"
              type="text"
              placeholder="Apartment, suite, etc."
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="billingCity">City</label>
              <input
                id="billingCity"
                v-model="accountForm.billingCity"
                type="text"
                placeholder="City"
              />
            </div>

            <div class="form-group">
              <label for="billingState">State/Region</label>
              <input
                id="billingState"
                v-model="accountForm.billingState"
                type="text"
                placeholder="State"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="billingPostalCode">Postal Code</label>
              <input
                id="billingPostalCode"
                v-model="accountForm.billingPostalCode"
                type="text"
                placeholder="ZIP/Postal code"
              />
            </div>

            <div class="form-group">
              <label for="billingCountry">Country <span class="required">*</span></label>
              <select
                id="billingCountry"
                v-model="accountForm.billingCountry"
                required
                :class="{ error: errors.billingCountry }"
              >
                <option value="">Select country</option>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
              </select>
              <span v-if="errors.billingCountry" class="error-message">{{ errors.billingCountry }}</span>
            </div>
          </div>
        </div>

        <div v-if="submitError" class="error-message" style="margin-bottom: 20px;">
          {{ submitError }}
        </div>

        <div class="form-actions">
          <button type="button" @click="prevStep" class="btn btn-secondary">
            Back
          </button>
          <button type="submit" :disabled="submitting" class="btn btn-primary">
            <span v-if="submitting">Processing...</span>
            <span v-else>Complete Registration & Proceed to Payment</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { apiService } from '../services/api';
import { useSubscriptionStore } from '../stores/subscription';
import { useRouter } from 'vue-router';

const emit = defineEmits(['registered']);

const router = useRouter();
const subscriptionStore = useSubscriptionStore();

const currentStep = ref(1);
const submitting = ref(false);
const submitError = ref(null);
const errors = reactive({});

const tenantForm = reactive({
  name: '',
  emailDomain: '',
  metadata: {},
});

const accountForm = reactive({
  companyName: '',
  legalName: '',
  taxId: '',
  billingEmail: '',
  billingAddressLine1: '',
  billingAddressLine2: '',
  billingCity: '',
  billingState: '',
  billingPostalCode: '',
  billingCountry: 'IN',
});

const validateStep1 = () => {
  errors.tenantName = '';
  if (!tenantForm.name.trim()) {
    errors.tenantName = 'Tenant name is required';
    return false;
  }
  return true;
};

const validateStep2 = () => {
  errors.companyName = '';
  errors.billingEmail = '';
  errors.billingCountry = '';
  
  let isValid = true;
  
  if (!accountForm.companyName.trim()) {
    errors.companyName = 'Company name is required';
    isValid = false;
  }
  
  if (!accountForm.billingEmail.trim()) {
    errors.billingEmail = 'Billing email is required';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountForm.billingEmail)) {
    errors.billingEmail = 'Invalid email format';
    isValid = false;
  }
  
  if (!accountForm.billingCountry) {
    errors.billingCountry = 'Country is required';
    isValid = false;
  }
  
  return isValid;
};

const nextStep = () => {
  if (currentStep.value === 1 && validateStep1()) {
    currentStep.value = 2;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleSubmit = async () => {
  if (!validateStep2()) {
    return;
  }

  submitting.value = true;
  submitError.value = null;

  try {
    // Step 1: Create tenant
    const tenant = await apiService.createTenant({
      name: tenantForm.name,
      emailDomain: tenantForm.emailDomain || undefined,
      metadata: tenantForm.metadata,
    });

    subscriptionStore.setTenantId(tenant.id);

    // Step 2: Create account
    const account = await apiService.createAccount({
      tenantId: tenant.id,
      companyName: accountForm.companyName,
      legalName: accountForm.legalName || undefined,
      taxId: accountForm.taxId || undefined,
      billingEmail: accountForm.billingEmail,
      billingAddressLine1: accountForm.billingAddressLine1 || undefined,
      billingAddressLine2: accountForm.billingAddressLine2 || undefined,
      billingCity: accountForm.billingCity || undefined,
      billingState: accountForm.billingState || undefined,
      billingPostalCode: accountForm.billingPostalCode || undefined,
      billingCountry: accountForm.billingCountry,
    });

    subscriptionStore.setAccountId(account.id);

    emit('registered', { tenant, account });
  } catch (err) {
    submitError.value = err.message || 'Failed to complete registration. Please try again.';
    console.error('Registration error:', err);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.registration-form {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-steps {
  margin-bottom: 40px;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.step.active .step-number {
  background: #22c55e;
  color: white;
}

.step.completed .step-number {
  background: #22c55e;
  color: white;
}

.step-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.step.active .step-label {
  color: #22c55e;
}

.step-line {
  width: 100px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 20px;
  margin-bottom: 28px;
  transition: all 0.3s;
}

.step-line.completed {
  background: #22c55e;
}

.form-step h2 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.step-description {
  color: #6b7280;
  margin-bottom: 32px;
  font-size: 16px;
}

.form-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid #e5e7eb;
}

.form-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
}

.required {
  color: #ef4444;
}

input.error,
select.error {
  border-color: #ef4444;
}
</style>

