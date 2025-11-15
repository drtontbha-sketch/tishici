import { Language, PromptLength } from '../types';

const callApi = async (type: 'analyzeImage' | 'generateText', payload: unknown): Promise<string> => {
  const response = await fetch('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, payload }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("API Error:", data);
    const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error;
    throw new Error(errorMessage || 'An unknown server error occurred');
  }
  
  return data.prompt;
};


export const analyzeImageForPrompt = async (
  base64Image: string,
  mimeType: string,
  language: Language,
  length: PromptLength
): Promise<string> => {
  try {
    const payload = { base64Image, mimeType, language, length };
    return await callApi('analyzeImage', payload);
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
    const payload = { inputText, language, length };
    return await callApi('generateText', payload);
  } catch (error) {
    console.error("Error generating prompt from text:", error);
    if (error instanceof Error) {
      throw new Error(`提示词生成失败。请检查您的网络连接后重试。详情: ${error.message}`);
    }
    throw new Error("生成提示词时发生未知错误。请检查网络连接后重试。");
  }
};
