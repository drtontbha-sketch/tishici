import { GoogleGenAI } from "@google/genai";
import { Language, PromptLength } from '../types';

const getLengthDescription = (language: Language, length: PromptLength) => {
  const lengthMap = {
    [PromptLength.Short]: language === Language.EN ? 'a short, concise sentence' : '一句简短精炼的话',
    [PromptLength.Medium]: language === Language.EN ? 'a medium-length paragraph' : '一段中等长度的段落',
    [PromptLength.Long]: language === Language.EN ? 'a detailed, long paragraph' : '一段详细的长段落',
  };
  return lengthMap[length];
};

const getPromptForImage = (language: Language, length: PromptLength): string => {
  const lengthDesc = getLengthDescription(language, length);

  if (language === Language.EN) {
    return `You are an expert prompt engineer for AI image generation models like Midjourney or DALL-E.
Analyze this image and describe it in ${lengthDesc}.
The description will be used as a prompt.
Respond ONLY with the generated prompt in English. Do not include any other text, preambles, or explanations.`;
  } else {
    return `你是一位顶级的AI绘画（例如 Midjourney 或 DALL-E）提示词工程师。
请分析这张图片，并用${lengthDesc}描述它。
这段描述将用作AI绘画的提示词。
请只用中文返回生成的提示词，不要包含任何其他文字、前言或解释。`;
  }
};

const getPromptForText = (inputText: string, language: Language, length: PromptLength): string => {
  const lengthDesc = getLengthDescription(language, length);

  if (language === Language.EN) {
    return `You are an expert prompt engineer for AI image generation models like Midjourney or DALL-E.
Take the following simple concept and expand it into a detailed, creative, and evocative prompt in ${lengthDesc}.
The concept is: "${inputText}"
The final prompt should be rich in visual detail, specifying elements like setting, mood, lighting, color palette, style, and composition.
Respond ONLY with the generated prompt in English. Do not include any other text, preambles, or explanations.`;
  } else {
    return `你是一位顶级的AI绘画（例如 Midjourney 或 DALL-E）提示词工程师。
请将以下简单的概念，扩展成一段${lengthDesc}、充满创意和想象力的详细提示词。
这个概念是：“${inputText}”
最终的提示词应该富含视觉细节，具体说明场景、氛围、光线、色调、风格和构图等元素。
请只用中文返回生成的提示词，不要包含任何其他文字、前言或解释。`;
  }
};


// Cloudflare Pages function handler
export const onRequestPost = async ({ request, env }) => {
  // The API_KEY must be set as an environment variable in the Cloudflare Pages project settings.
  if (!env.API_KEY) {
    return new Response(JSON.stringify({ 
        error: 'Server configuration error', 
        details: 'API_KEY not found.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const ai = new GoogleGenAI({ apiKey: env.API_KEY });

  try {
    const { type, payload } = await request.json();
    let responseText;

    if (type === 'analyzeImage') {
      const { base64Image, mimeType, language, length } = payload;
      const imagePart = { inlineData: { mimeType, data: base64Image } };
      const textPart = { text: getPromptForImage(language, length) };
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
      });
      responseText = response.text;

    } else if (type === 'generateText') {
      const { inputText, language, length } = payload;
      const textPart = { text: getPromptForText(inputText, language, length) };
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart] },
      });
      responseText = response.text;

    } else {
      return new Response(JSON.stringify({ error: 'Invalid request type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ prompt: responseText.trim() }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in Cloudflare function:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: 'API call failed', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
