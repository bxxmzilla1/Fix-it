import { ImageFile } from "../types";

/**
 * Secure API call to backend - API key is kept server-side
 */
export const generateFix = async (
  originalImage: ImageFile,
  fixDescription: string
): Promise<string> => {
  try {
    // Call our secure backend API instead of using the API key directly
    const response = await fetch('/api/generate-fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: originalImage.data,
        mimeType: originalImage.mimeType,
        prompt: fixDescription,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.image) {
      throw new Error("No image returned from API");
    }

    return data.image;

  } catch (error) {
    console.error("Error generating fix:", error);
    throw error;
  }
};