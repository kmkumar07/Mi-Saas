import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThirdPartyApiService } from './core/thirdparty-api.service';

@Component({
  standalone: true,
  selector: 'app-thirdparty-test-page',
  imports: [CommonModule],
  templateUrl: './thirdparty-test-page.component.html',
  styleUrl: './thirdparty-test-page.component.scss',
})
export class ThirdPartyTestPageComponent {
  private readonly api = inject(ThirdPartyApiService);

  readonly publicState = this.api.lastPublicCall;
  readonly protectedState = this.api.lastProtectedCall;

  readonly isPublicLoading = computed(() => this.publicState().loading);
  readonly isProtectedLoading = computed(() => this.protectedState().loading);

  callPublic() {
    this.api.callPublicPing();
  }

  callProtected() {
    this.api.callFeatureX();
  }

  callCreateShop() {
    this.api.callCreateShop();
  }
}


