import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oczaidmczhvdoqlktmfp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TOKEN_COST = 30;

// Use service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, mimeType, prompt, userId, accessToken } = req.body;

    // Validate input
    if (!imageData || !mimeType || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: imageData, mimeType, and prompt are required' });
    }

    // Validate user authentication
    if (!userId || !accessToken) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user || user.id !== userId) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Check and deduct tokens before generating
    const { data: tokenData, error: tokenFetchError } = await supabase
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', userId)
      .single();

    if (tokenFetchError) {
      // If no record exists, create one with default tokens
      if (tokenFetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_tokens')
          .insert({ user_id: userId, tokens: 100 });

        if (insertError) {
          return res.status(500).json({ error: 'Failed to initialize user tokens' });
        }
        return res.status(402).json({ 
          error: 'Insufficient tokens',
          balance: 100,
          cost: TOKEN_COST,
          message: 'You need at least 30 tokens to generate an image. You have 100 tokens.'
        });
      }
      return res.status(500).json({ error: 'Failed to check token balance' });
    }

    const currentBalance = tokenData?.tokens || 0;

    if (currentBalance < TOKEN_COST) {
      return res.status(402).json({ 
        error: 'Insufficient tokens',
        balance: currentBalance,
        cost: TOKEN_COST,
        message: `You need ${TOKEN_COST} tokens to generate an image. You have ${currentBalance} tokens.`
      });
    }

    // Deduct tokens before generation (optimistic deduction)
    const newBalance = currentBalance - TOKEN_COST;
    const { error: deductError } = await supabase
      .from('user_tokens')
      .update({ tokens: newBalance })
      .eq('user_id', userId);

    if (deductError) {
      return res.status(500).json({ error: 'Failed to deduct tokens' });
    }

    // Get API key from environment (server-side only)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey });

    // Construct the prompt
    const fullPrompt = `
      You are an expert visualization AI specialized in construction repairs, interior design, and housekeeping.
      I will provide an image and a description of a desired improvement (fix, renovation, or cleanup).

      User Request: "${prompt}"

      Task:
      1. Analyze the input image and the user's request.
      2. Generate a new version of the image with the request applied.
      3. If the request involves cleaning, housekeeping, or organizing:
         - Remove debris, dust, trash, and clutter.
         - Organize scattered items (tools, furniture, boxes) neatly.
         - Make surfaces look swept, mopped, and wiped down.
         - Ensure the space looks clean and "house kept".
      4. If the request involves construction repairs:
         - Fix the specified defects (cracks, holes, broken items) indistinguishably from the original structure.
      5. CRITICAL: Maintain the exact same perspective, camera angle, lighting conditions, and surrounding environment details (textures, shadows, colors, background).
      6. The result must be a photorealistic exact detailed replica of the original scene, only modified where requested.

      Do not add any text, labels, or overlays. Return only the image.
    `;

    // Call Gemini API
    const model = 'gemini-2.5-flash-image';
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageData,
              mimeType: mimeType,
            },
          },
          {
            text: fullPrompt,
          },
        ],
      },
    });

    // Extract the generated image
    let generatedImageBase64: string | null = null;

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedImageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!generatedImageBase64) {
      return res.status(500).json({ error: 'No image generated by the model' });
    }

    // Return the generated image with updated token balance
    return res.status(200).json({
      image: `data:image/png;base64,${generatedImageBase64}`,
      tokensUsed: TOKEN_COST,
      remainingTokens: newBalance
    });

  } catch (error: any) {
    console.error('Error generating fix:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message 
    });
  }
}

