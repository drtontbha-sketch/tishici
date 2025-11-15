
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


export const analyzeImageForPrompt = async (
  base64Image: string,
  mimeType: string,
  language: Language,
  length: PromptLength
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    };

    const textPart = {
      text: getPromptForImage(language, length),
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error analyzing image:", error);
    if (error instanceof Error) {
        throw new Error(`图片分析失败。请检查您的网络连接，或尝试使用其他图片。详情: ${error.message}`);
    }
    throw new Error("分析图片时发生未知错误。请检查网络连接后重试。");
  }
};

export const generatePromptFromText = async (
  inputText: string,
  language: Language,
  length: PromptLength
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const textPart = {
      text: getPromptForText(inputText, language, length),
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart] },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating prompt from text:", error);
    if (error instanceof Error) {
      throw new Error(`提示词生成失败。请检查您的网络连接后重试。详情: ${error.message}`);
    }
    throw new Error("生成提示词时发生未知错误。请检查网络连接后重试。");
  }
};
