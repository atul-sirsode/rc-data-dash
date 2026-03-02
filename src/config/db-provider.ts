/**
 * Database Provider Configuration
 * 
 * MongoDB REST API configuration for the application.
 */

interface DbProviderConfig {
  /** Base URL for the MongoDB REST API proxy */
  mongoApiBaseUrl: string;
}

const config: DbProviderConfig = {
  mongoApiBaseUrl: localStorage.getItem('mongo_api_url') || 'http://localhost:5000/api',
};

export function getMongoApiBaseUrl(): string {
  return config.mongoApiBaseUrl;
}

export function setMongoApiBaseUrl(url: string): void {
  config.mongoApiBaseUrl = url;
  localStorage.setItem('mongo_api_url', url);
}
