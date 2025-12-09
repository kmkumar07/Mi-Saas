import { SetMetadata } from '@nestjs/common';

export const REQUIRED_FEATURE_KEY = 'requiredFeature';
export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

export type PermissionAction = 'read' | 'write' | 'execute';

export const RequiredFeature = (featureKey: string) =>
  SetMetadata(REQUIRED_FEATURE_KEY, featureKey);

export const RequiredPermission = (action: PermissionAction) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, action);

