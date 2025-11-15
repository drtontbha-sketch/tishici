
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Language, PromptLength } from './types';
import { analyzeImageForPrompt, generatePromptFromText } from './services/geminiService';

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21 6.75l-3.75-3.75L15.19 5.19l3.75 3.75L21 6.75z" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.543L16.5 21.75l-.398-1.207a3.375 3.375 0 00-2.455-2.456L12.75 18l1.207-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.207a3.375 3.375 0 002.456 2.456L20.25 18l-1.207.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);


export default function App() {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [language, setLanguage] = useState<Language>(Language.ZH);
  const [promptLength, setPromptLength] = useState<PromptLength>(PromptLength.Medium);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = () => reject(new Error('无法读取图片文件。文件可能已损坏或格式不兼容，请尝试重新上传或更换图片。'));
    });
  };
  
  const handleFile = useCallback((file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('请上传有效的图片文件。');
        return;
      }
      setError(null);
      setImageFile(file);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(URL.createObjectURL(file));
      setGeneratedPrompt('');
    }
  }, [imageUrl]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file || null);
  };

  const handlePaste = useCallback((event: ClipboardEvent) => {
    if (activeTab !== 'image') return;
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  }, [handleFile, activeTab]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);
  
  const handleRemoveImage = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageFile(null);
    setImageUrl(null);
    setGeneratedPrompt('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imageUrl]);

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) {
      setError('请先选择一张图片。');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedPrompt('');

    try {
      const base64Image = await fileToBase64(imageFile);
      const prompt = await analyzeImageForPrompt(base64Image, imageFile.type, language, promptLength);
      setGeneratedPrompt(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生了未知错误。');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, language, promptLength]);

  const handleImagineClick = useCallback(async () => {
    if (!textInput.trim()) {
        setError('请输入您的想法。');
        return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedPrompt('');
    try {
        const prompt = await generatePromptFromText(textInput, language, promptLength);
        setGeneratedPrompt(prompt);
    } catch (err) {
        setError(err instanceof Error ? err.message : '发生了未知错误。');
    } finally {
        setIsLoading(false);
    }
  }, [textInput, language, promptLength]);
  
  const handleCopy = () => {
    if (generatedPrompt) {
        navigator.clipboard.writeText(generatedPrompt);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const renderToggleButton = <T,>(
    value: T,
    currentValue: T,
    setValue: React.Dispatch<React.SetStateAction<T>>,
    text: string
  ) => (
    <button
      onClick={() => setValue(value)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
        currentValue === value ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {text}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            AI 以图生文
          </h1>
          <p className="mt-2 text-lg text-gray-400">上传图片或输入想法，让 Gemini 为您生成完美的提示词。</p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4 text-white">1. 上传与配置</h2>

            <div className="flex border-b border-gray-700 mb-4">
              <button
                onClick={() => setActiveTab('image')}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'image' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                图片分析
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'text' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                创造想象
              </button>
            </div>
            
            {activeTab === 'image' && (
              <div className="relative">
                <label
                  htmlFor="file-upload"
                  className="mt-4 flex justify-center items-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors duration-300 bg-gray-900/50"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="Upload preview" className="h-full w-full object-contain rounded-lg p-2" />
                  ) : (
                    <div className="text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                      <p className="mt-2 text-sm text-gray-400">点击或拖拽上传，或直接粘贴图片</p>
                      <p className="text-xs text-gray-500">支持 PNG, JPG, WEBP 等格式</p>
                    </div>
                  )}
                </label>
                {imageUrl && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-6 right-2 p-1.5 bg-gray-900/60 rounded-full text-gray-300 hover:bg-gray-700/80 hover:text-white transition-all duration-200"
                    aria-label="删除图片"
                    title="删除图片"
                  >
                    <DeleteIcon className="w-5 h-5" />
                  </button>
                )}
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" ref={fileInputRef} />
              </div>
            )}

            {activeTab === 'text' && (
              <div className="mt-4">
                <label htmlFor="text-prompt-input" className="block text-sm font-medium text-gray-300 mb-2">输入简单的想法</label>
                <textarea
                    id="text-prompt-input"
                    rows={11}
                    className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="例如：一只猫在繁星满天的夜晚看月亮"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
            )}
            
            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">语言</label>
                <div className="flex space-x-2">
                  {renderToggleButton(Language.EN, language, setLanguage, '英文')}
                  {renderToggleButton(Language.ZH, language, setLanguage, '中文')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">提示词长度</label>
                <div className="flex space-x-2">
                  {renderToggleButton(PromptLength.Short, promptLength, setPromptLength, '短')}
                  {renderToggleButton(PromptLength.Medium, promptLength, setPromptLength, '中')}
                  {renderToggleButton(PromptLength.Long, promptLength, setPromptLength, '长')}
                </div>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
               <button
                  onClick={handleAnalyzeClick}
                  disabled={isLoading || activeTab !== 'image' || !imageFile}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isLoading && activeTab === 'image' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      分析中...
                    </>
                  ) : '分析图片'}
                </button>
                <button
                  onClick={handleImagineClick}
                  disabled={isLoading || activeTab !== 'text' || !textInput.trim()}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isLoading && activeTab === 'text' ? (
                     <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      生成中...
                    </>
                  ) : <><SparklesIcon className="-ml-1 mr-2 h-5 w-5" /> 创造想象</>}
                </button>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">2. 生成的提示词</h2>
                <button onClick={handleCopy} title="复制提示词" className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500" disabled={!generatedPrompt}>
                    {isCopied ? <CheckIcon className="h-5 w-5 text-green-400"/> : <CopyIcon className="h-s5 w-5 text-gray-300"/>}
                </button>
            </div>
            
            <div className="flex-grow bg-gray-900/70 rounded-lg p-4 whitespace-pre-wrap text-gray-300 overflow-y-auto min-h-[200px] text-base leading-relaxed">
              {isLoading && (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              )}
              {error && (
                <div className="text-red-400 p-4 bg-red-900/30 rounded-lg">
                  <p className="font-bold">操作失败</p>
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && !generatedPrompt && (
                <p className="text-gray-500">您生成的提示词将显示在这里...</p>
              )}
              {generatedPrompt}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
