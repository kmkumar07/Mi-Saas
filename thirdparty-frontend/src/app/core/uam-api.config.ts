// UAM API base URL is configured via environment variables.
// Define NG_APP_UAM_API_BASE_URL in thirdparty-frontend/.env
// (see env.example in the project root).
//
// When running under @angular/build, variables prefixed with NG_APP_
// are exposed on import.meta.env at build time.

const env = (import.meta as any).env ?? {};

export const UAM_API_BASE_URL: string =
  env.NG_APP_UAM_API_BASE_URL ?? 'http://localhost:3001';



