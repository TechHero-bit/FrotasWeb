import { generatedEnvironment } from './environment.generated';

export const environment = {
  production: false,
  supabaseUrl: generatedEnvironment.supabaseUrl,
  supabaseAnonKey: generatedEnvironment.supabaseAnonKey
};
