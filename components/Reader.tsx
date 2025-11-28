import React, { useState, useEffect, useRef } from 'react';
import { Material, MaterialType, User } from '../types';
import { logger } from '../services/loggerService';
import { askGemini } from '../services/geminiService';
import { 
  XMarkIcon, 
  ChatBubbleBottomCenterTextIcon, 
  PaperAirplaneIcon, 
  BookOpenIcon,
  MinusIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
  MusicalNoteIcon,
  SpeakerWaveIcon,
  PauseIcon,
  PhotoIcon,
  FilmIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ReaderProps {
  material: Material;
  user: User;
  onClose: () => void;
}

type Theme = 'light' | 'sepia' | 'dark';
type FontFamily = 'serif' | 'sans';
type SidebarTab = 'chat' | 'media';

const Reader: React.FC<ReaderProps> = ({ material, user, onClose }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('chat');
  const [showSettings, setShowSettings] = useState(false);
  
  // Reader Preferences
  const [fontSize, setFontSize] = useState(18); // px
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [theme, setTheme] = useState<Theme>('light');

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [aiChat, setAiChat] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Generated Media State
  const [generatedMedia, setGeneratedMedia] = useState<{type: 'image' | 'video', url: string, prompt: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const startTimeRef = useRef(Date.now());
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    logger.log(user, 'OPEN_MATERIAL', `Opened ${material.title}`, material.id);
    return () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      logger.log(user, 'CLOSE_MATERIAL', `Duration: ${duration}s, Progress: ${scrollProgress}%`, material.id);
      window.speechSynthesis.cancel(); // Stop speaking on exit
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material.id]); 

  // TTS Handlers
  const toggleTTS = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        logger.log(user, 'RESUME_TTS', 'Resumed audio', material.id);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
        setIsSpeaking(true); // Still conceptually speaking, just paused
        logger.log(user, 'PAUSE_TTS', 'Paused audio', material.id);
      }
    } else {
      // Start speaking
      const textToRead = material.type === MaterialType.TEXT 
        ? material.content 
        : material.type === MaterialType.HTML 
          ? material.content.replace(/<[^>]+>/g, '') 
          : `Title: ${material.title}. Author: ${material.author}. This is a ${material.type} file.`;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
      logger.log(user, 'START_TTS', 'Started Text-to-Speech', material.id);
    }
  };

  const stopTTS = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    logger.log(user, 'STOP_TTS', 'Stopped audio', material.id);
  };

  // Generation Handlers
  const handleGenerateMedia = (type: 'image' | 'video') => {
    setIsGenerating(true);
    setShowSidebar(true);
    setActiveTab('media');
    
    logger.log(user, type === 'image' ? 'GENERATE_IMAGE' : 'GENERATE_VIDEO', 'User requested media generation', material.id);

    // Simulate generation delay
    setTimeout(() => {
      const newMedia = {
        type,
        // Mock content - in a real app this would come from a model
        url: type === 'image' 
          ? `https://picsum.photos/seed/${Math.random()}/600/400`
          : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        prompt: `Generated visualization based on context from "${material.title}"`
      };
      setGeneratedMedia(prev => [newMedia, ...prev]);
      setIsGenerating(false);
    }, 2500);
  };

  const handleFinishReading = () => {
    logger.log(user, 'FINISH_READING', 'User completed the material', material.id);
    if (window.confirm("Are you sure you want to finish reading this material?")) {
      onClose();
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const question = aiInput;
    setAiInput('');
    setAiChat(prev => [...prev, { sender: 'user', text: question }]);
    setLoadingAi(true);
    
    logger.log(user, 'AI_QUERY', question, material.id);

    let context = `Title: ${material.title}\nAuthor: ${material.author}\nType: ${material.type}\n`;
    if (material.type === MaterialType.TEXT || material.type === MaterialType.HTML) {
      const textContent = material.type === MaterialType.HTML 
        ? material.content.replace(/<[^>]*>?/gm, '') 
        : material.content;
      context += `\nContent:\n${textContent}`;
    } else {
       context += `\n(The user is viewing a ${material.type} file. You cannot see the content directly, but answer general questions based on the title or metadata if possible, or act as a general assistant.)`;
    }

    const answer = await askGemini(question, context);
    
    setAiChat(prev => [...prev, { sender: 'ai', text: answer }]);
    setLoadingAi(false);
  };

  // Helper to get theme classes
  const getThemeClasses = () => {
    switch (theme) {
      case 'sepia': return 'bg-[#f4ecd8] text-[#5b4636] border-[#e3dcc0]';
      case 'dark': return 'bg-[#1a1a1a] text-[#d1d5db] border-gray-800';
      default: return 'bg-white text-gray-800 border-gray-100';
    }
  };

  const getProseThemeClasses = () => {
    switch (theme) {
      case 'sepia': return 'prose-headings:text-[#433422] prose-strong:text-[#433422] prose-a:text-[#8c6b4a] prose-p:text-[#5b4636]';
      case 'dark': return 'prose-headings:text-gray-100 prose-strong:text-gray-100 prose-a:text-blue-400 prose-blockquote:text-gray-400 prose-p:text-gray-300';
      default: return 'prose-gray';
    }
  };

  const renderContent = () => {
    const commonStyles = {
      fontSize: `${fontSize}px`,
      fontFamily: fontFamily === 'serif' ? '"Merriweather", serif' : '"Inter", sans-serif',
      lineHeight: '1.8',
    };

    switch (material.type) {
      case MaterialType.TEXT:
        return (
          <div className={`max-w-3xl mx-auto py-12 px-8 transition-colors duration-300 min-h-full ${getThemeClasses()}`}>
             <div style={commonStyles} className="animate-fade-in">
               <h1 className="text-3xl font-bold mb-8 leading-tight tracking-tight">{material.title}</h1>
               <div className="whitespace-pre-wrap">
                 {material.content.split('\n').map((para, i) => (
                    para.trim() ? <p key={i} className="mb-6 indent-8 leading-relaxed">{para}</p> : <br key={i}/>
                 ))}
               </div>
               {renderFinishButton()}
             </div>
          </div>
        );
      case MaterialType.HTML:
        return (
          <div className={`max-w-3xl mx-auto py-12 px-8 transition-colors duration-300 min-h-full ${getThemeClasses()}`}>
            <div 
              className={`prose max-w-none ${getProseThemeClasses()} animate-fade-in`}
              style={commonStyles}
              dangerouslySetInnerHTML={{ __html: material.content }} 
            />
             {renderFinishButton()}
          </div>
        );
      case MaterialType.VIDEO:
        return (
          <div className="flex flex-col h-full bg-black">
            <div className="flex-1 flex items-center justify-center">
              <video 
                controls 
                className="max-h-full max-w-full focus:outline-none"
                onPlay={() => logger.log(user, 'MEDIA_PLAY', 'Video started', material.id)}
                onPause={() => logger.log(user, 'MEDIA_PAUSE', 'Video paused', material.id)}
              >
                <source src={material.content} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-8 bg-gray-900 flex justify-center">
              <button 
                onClick={handleFinishReading}
                className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-bold shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Finish Watching
              </button>
            </div>
          </div>
        );
      case MaterialType.AUDIO:
         return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
            <div className="w-64 h-64 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-2xl border border-white/20">
              <MusicalNoteIcon className="w-32 h-32 text-white/50" />
            </div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight">{material.title}</h2>
            <p className="text-white/60 mb-8">{material.author}</p>
            <audio 
              controls 
              className="w-full max-w-md shadow-lg rounded-full mb-12"
              onPlay={() => logger.log(user, 'MEDIA_PLAY', 'Audio started', material.id)}
              onPause={() => logger.log(user, 'MEDIA_PAUSE', 'Audio paused', material.id)}
            >
              <source src={material.content} type="audio/mp3" />
            </audio>
            <button 
                onClick={handleFinishReading}
                className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-bold shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Finish Listening
            </button>
          </div>
        );
      case MaterialType.IMAGE:
        return (
          <div className="flex flex-col h-full bg-gray-900">
             <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={material.content} alt={material.title} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />
             </div>
             <div className="p-8 bg-gray-900 flex justify-center border-t border-gray-800">
               <button 
                  onClick={handleFinishReading}
                  className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-bold shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Finish Viewing
                </button>
             </div>
          </div>
        );
      default:
        return <div className="p-8">Unsupported format</div>;
    }
  };

  const renderFinishButton = () => (
    <div className="mt-16 mb-8 flex justify-center border-t border-gray-200/20 pt-12">
      <button 
        onClick={handleFinishReading}
        className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-bold shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
      >
        <CheckCircleIcon className="w-5 h-5" />
        Finish Reading
      </button>
    </div>
  );

  // Only show settings/TTS for text/html
  const supportsSettings = material.type === MaterialType.TEXT || material.type === MaterialType.HTML;

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-white">
      
      {/* --- Main Reading Area --- */}
      <div className={`flex-1 relative flex flex-col h-full overflow-hidden ${getThemeClasses()}`}>
        
        {/* Top Navigation Bar */}
        <div className={`
           absolute top-0 left-0 right-0 h-16 z-20 flex items-center justify-between px-4 md:px-8 transition-all duration-300
           ${theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : theme === 'sepia' ? 'bg-[#f4ecd8]/90 border-[#e3dcc0]' : 'bg-white/90 border-gray-100'}
           backdrop-blur-md border-b shadow-soft
        `}>
           <div className="flex items-center gap-4 overflow-hidden">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-colors">
                <XMarkIcon className="w-6 h-6 opacity-70" />
              </button>
              <div className="flex flex-col">
                <h1 className="font-semibold text-sm md:text-base truncate max-w-[150px] md:max-w-xs leading-tight">{material.title}</h1>
                <span className="text-xs opacity-60 truncate">{material.author}</span>
              </div>
           </div>

           <div className="flex items-center gap-1 md:gap-2">
              {/* TTS Controls */}
              {supportsSettings && (
                <div className="flex items-center mr-2 border-r border-gray-300/50 pr-2">
                   {isSpeaking ? (
                      <div className="flex items-center gap-1 bg-brand-100/50 rounded-full px-2 py-1">
                        <button onClick={toggleTTS} className="p-1.5 rounded-full hover:bg-brand-200 text-brand-700">
                          {isPaused ? <SpeakerWaveIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={stopTTS} className="p-1.5 rounded-full hover:bg-red-100 text-red-500">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                   ) : (
                      <button 
                        onClick={toggleTTS}
                        className="p-2 rounded-full hover:bg-black/5 transition-colors text-gray-500 hover:text-gray-900"
                        title="Read Aloud"
                      >
                        <SpeakerWaveIcon className="w-5 h-5" />
                      </button>
                   )}
                </div>
              )}

              {supportsSettings && (
                 <div className="relative">
                    <button 
                      onClick={() => setShowSettings(!showSettings)}
                      className={`p-2 rounded-full hover:bg-black/5 transition-colors ${showSettings ? 'bg-black/10' : ''}`}
                      title="Reading Settings"
                    >
                      <span className="font-serif font-bold text-lg px-1">Aa</span>
                    </button>
                    
                    {/* Settings Popover */}
                    {showSettings && (
                      <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 text-gray-800 z-50 animate-fade-in-down origin-top-right">
                        
                        {/* Font Size */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-500">Size</span>
                          <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                             <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-1 hover:bg-white rounded shadow-sm transition-all">
                               <MinusIcon className="w-4 h-4" />
                             </button>
                             <span className="w-8 text-center text-sm font-bold">{fontSize}</span>
                             <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="p-1 hover:bg-white rounded shadow-sm transition-all">
                               <PlusIcon className="w-4 h-4" />
                             </button>
                          </div>
                        </div>

                        {/* Font Family */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                           <span className="text-sm font-medium text-gray-500">Font</span>
                           <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
                              <button 
                                onClick={() => setFontFamily('sans')}
                                className={`px-3 py-1 rounded transition-all ${fontFamily === 'sans' ? 'bg-white shadow-sm font-bold text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                              >
                                Sans
                              </button>
                              <button 
                                onClick={() => setFontFamily('serif')}
                                className={`px-3 py-1 rounded transition-all font-serif ${fontFamily === 'serif' ? 'bg-white shadow-sm font-bold text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                              >
                                Serif
                              </button>
                           </div>
                        </div>

                        {/* Theme */}
                        <div>
                           <span className="block text-sm font-medium text-gray-500 mb-2">Theme</span>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => setTheme('light')}
                                className={`flex-1 h-10 rounded-lg border-2 flex items-center justify-center ${theme === 'light' ? 'border-brand-500 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                              >
                                 <SunIcon className="w-5 h-5 text-gray-400" />
                              </button>
                              <button 
                                onClick={() => setTheme('sepia')}
                                className={`flex-1 h-10 rounded-lg border-2 flex items-center justify-center bg-[#f4ecd8] ${theme === 'sepia' ? 'border-brand-500' : 'border-[#e3dcc0]'}`}
                              >
                                 <span className="w-4 h-4 rounded-full bg-[#5b4636] opacity-50"></span>
                              </button>
                              <button 
                                onClick={() => setTheme('dark')}
                                className={`flex-1 h-10 rounded-lg border-2 flex items-center justify-center bg-gray-900 ${theme === 'dark' ? 'border-brand-500' : 'border-gray-700'}`}
                              >
                                 <MoonIcon className="w-4 h-4 text-gray-400" />
                              </button>
                           </div>
                        </div>
                      </div>
                    )}
                 </div>
              )}

              {/* Chat Button */}
              <button 
                onClick={() => {
                  if(showSidebar && activeTab === 'chat') {
                    setShowSidebar(false);
                  } else {
                    setShowSidebar(true);
                    setActiveTab('chat');
                  }
                }}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${showSidebar && activeTab === 'chat'
                    ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-200' 
                    : 'bg-black/5 hover:bg-black/10 text-current'}
                `}
                title="AI Assistant"
              >
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Chat</span>
              </button>

              {/* Media Button */}
              <button 
                onClick={() => {
                  if(showSidebar && activeTab === 'media') {
                    setShowSidebar(false);
                  } else {
                    setShowSidebar(true);
                    setActiveTab('media');
                  }
                }}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ml-1
                  ${showSidebar && activeTab === 'media'
                    ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-200' 
                    : 'bg-black/5 hover:bg-black/10 text-current'}
                `}
                title="Media Generation"
              >
                <SparklesIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Media</span>
              </button>
           </div>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto pt-16 scroll-smooth"
          onScroll={(e) => {
              if(supportsSettings) {
                 const target = e.currentTarget;
                 const progress = Math.round((target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100);
                 if(Math.abs(progress - scrollProgress) > 5) {
                     setScrollProgress(progress);
                 }
              }
          }}
        >
          {renderContent()}
        </div>

        {/* Progress Bar (Bottom) for Text */}
        {supportsSettings && (
          <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full z-10">
             <div 
               className="h-full bg-brand-500 transition-all duration-300" 
               style={{ width: `${scrollProgress}%` }}
             ></div>
          </div>
        )}
      </div>

      {/* --- AI Sidebar --- */}
      <div className={`
        fixed inset-y-0 right-0 w-full md:w-96 bg-white border-l shadow-2xl transform transition-transform duration-300 ease-in-out z-30 flex flex-col
        ${showSidebar ? 'translate-x-0' : 'translate-x-full'}
        md:relative md:transform-none md:w-96 ${!showSidebar && 'md:hidden'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 border-b flex items-center justify-between px-4 bg-gray-50/50 backdrop-blur shrink-0">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'chat' ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Assistant
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'media' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Media Lab
            </button>
          </div>
          <button onClick={() => setShowSidebar(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30 relative">
          
          {/* --- TAB: CHAT --- */}
          {activeTab === 'chat' && (
            <div className="p-4 space-y-4 h-full flex flex-col">
              <div className="flex-1 space-y-4 pb-4">
                {aiChat.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500 px-8">
                      <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                        <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-brand-300" />
                      </div>
                      <p className="font-medium text-gray-900">Ask questions</p>
                      <p className="mt-1 text-xs">Summarize, explain, or translate.</p>
                  </div>
                )}
                {aiChat.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                      max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                      ${msg.sender === 'user' 
                        ? 'bg-brand-600 text-white rounded-br-none shadow-md' 
                        : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'}
                    `}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loadingAi && (
                  <div className="flex justify-start">
                    <div className="bg-white border px-4 py-4 rounded-2xl rounded-bl-none shadow-sm flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- TAB: MEDIA --- */}
          {activeTab === 'media' && (
             <div className="p-4 space-y-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                   <h3 className="text-sm font-bold text-gray-900 mb-2">Generate Visuals</h3>
                   <p className="text-xs text-gray-500 mb-4">Create supplemental media based on the current text context.</p>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleGenerateMedia('image')}
                        disabled={isGenerating}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-brand-50 border border-gray-200 hover:border-brand-200 rounded-xl transition-all disabled:opacity-50"
                      >
                         <PhotoIcon className="w-6 h-6 text-purple-500" />
                         <span className="text-xs font-semibold text-gray-700">Image</span>
                      </button>
                      <button 
                        onClick={() => handleGenerateMedia('video')}
                        disabled={isGenerating}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-brand-50 border border-gray-200 hover:border-brand-200 rounded-xl transition-all disabled:opacity-50"
                      >
                         <FilmIcon className="w-6 h-6 text-pink-500" />
                         <span className="text-xs font-semibold text-gray-700">Video</span>
                      </button>
                   </div>
                </div>

                {isGenerating && (
                   <div className="flex flex-col items-center justify-center py-8 text-center animate-pulse">
                      <SparklesIcon className="w-8 h-8 text-brand-400 mb-2" />
                      <p className="text-sm font-medium text-brand-600">Generating creative assets...</p>
                      <p className="text-xs text-gray-400">Analyzing text context</p>
                   </div>
                )}

                <div className="space-y-4">
                   {generatedMedia.map((media, idx) => (
                      <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-fade-in-up">
                         <div className="relative aspect-video bg-gray-100">
                            {media.type === 'image' ? (
                               // eslint-disable-next-line @next/next/no-img-element
                               <img src={media.url} alt="Generated" className="w-full h-full object-cover" />
                            ) : (
                               <video controls className="w-full h-full object-cover">
                                  <source src={media.url} type="video/mp4" />
                               </video>
                            )}
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] text-white uppercase font-bold">
                               AI Generated {media.type}
                            </div>
                         </div>
                         <div className="p-3">
                            <p className="text-xs text-gray-500 italic">"{media.prompt}"</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* Input Area (Only for Chat) */}
        {activeTab === 'chat' && (
          <div className="p-4 bg-white border-t shrink-0">
            <form onSubmit={handleAiSubmit} className="relative">
              <input 
                type="text" 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask a question..."
                className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border-gray-200 focus:bg-white focus:border-brand-500 rounded-xl focus:ring-4 focus:ring-brand-50/50 transition-all text-sm"
              />
              <button 
                type="submit"
                disabled={!aiInput.trim() || loadingAi}
                className="absolute right-2 top-2 p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 transition-colors shadow-sm"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </form>
            <p className="text-[10px] text-center text-gray-400 mt-2">
              AI responses may vary. Double-check critical information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reader;