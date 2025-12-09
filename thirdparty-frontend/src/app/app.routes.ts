import { Routes } from '@angular/router';
import { ThirdPartyTestPageComponent } from './thirdparty-test-page.component';

export const routes: Routes = [
  { path: '', component: ThirdPartyTestPageComponent },
  { path: '**', redirectTo: '' },
];


