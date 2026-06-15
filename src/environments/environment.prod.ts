import { generatedEnvironment } from './environment.generated';

export const environment = {
  production: true,
  supabaseUrl: generatedEnvironment.supabaseUrl,
  supabaseAnonKey: generatedEnvironment.supabaseAnonKey
};
