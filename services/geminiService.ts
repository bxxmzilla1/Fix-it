import { ImageFile } from "../types";
import { supabase } from "../lib/supabase";

export interface GenerateFixResponse {
  image: string;
  tokensUsed: number;
  remainingTokens: number;
}

/**
 * Secure API call to backend - API key is kept server-side
 * Now includes token checking and deduction
 */
export const generateFix = async (
  originalImage: ImageFile,
  fixDescription: string
): Promise<GenerateFixResponse> => {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

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
        userId: session.user.id,
        accessToken: session.access_token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      // Handle insufficient tokens error
      if (response.status === 402) {
        throw new Error(errorData.message || `Insufficient tokens. You need ${errorData.cost || 30} tokens but only have ${errorData.balance || 0}.`);
      }
      
      throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.image) {
      throw new Error("No image returned from API");
    }

    return {
      image: data.image,
      tokensUsed: data.tokensUsed || 30,
      remainingTokens: data.remainingTokens || 0,
    };

  } catch (error) {
    console.error("Error generating fix:", error);
    throw error;
  }
};