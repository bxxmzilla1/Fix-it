export enum AppStep {
  UPLOAD = 'UPLOAD',
  DESCRIBE = 'DESCRIBE',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface ImageFile {
  data: string; // Base64 string without prefix for API
  mimeType: string;
  preview: string; // Full data URL for <img> src
}

export interface GenerationResult {
  before: ImageFile;
  after: string; // Base64 data URL
  description: string;
}
