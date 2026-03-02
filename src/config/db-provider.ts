/**
 * Database Provider Configuration
 * 
 * Central config to switch between Supabase (Lovable Cloud) and MongoDB.
 * Change `activeProvider` to toggle the entire app's data layer.
 */

export type DbProvider = 'supabase' | 'mongodb';

interface DbProviderConfig {
  /** Which database provider is active */
  activeProvider: DbProvider;

  /** Base URL for the MongoDB REST API proxy (only used when provider = 'mongodb') */
  mongoApiBaseUrl: string;
}

// Read from env or fall back to defaults
const config: DbProviderConfig = {
  activeProvider: (localStorage.getItem('db_provider') as DbProvider) || 'supabase',
  mongoApiBaseUrl: localStorage.getItem('mongo_api_url') || 'http://localhost:5000/api',
};

export function getDbProvider(): DbProvider {
  return config.activeProvider;
}

export function setDbProvider(provider: DbProvider): void {
  config.activeProvider = provider;
  localStorage.setItem('db_provider', provider);
}

export function getMongoApiBaseUrl(): string {
  return config.mongoApiBaseUrl;
}

export function setMongoApiBaseUrl(url: string): void {
  config.mongoApiBaseUrl = url;
  localStorage.setItem('mongo_api_url', url);
}
