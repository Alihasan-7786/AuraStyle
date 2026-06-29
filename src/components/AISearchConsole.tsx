import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Mic, 
  Image as ImageIcon, 
  Sliders, 
  MicOff, 
  Upload, 
  RefreshCw, 
  CheckCircle,
  TrendingUp,
  Cpu,
  Star,
  Info
} from 'lucide-react';
import { Product, SearchMatch, SearchResponse } from '../types';

interface AISearchConsoleProps {
  products: Product[];
  onNavigate: (view: string, params?: any) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
}

export default function AISearchConsole({
  products,
  onNavigate,
  onAddToCart
}: AISearchConsoleProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'multimodal' | 'voice'>('text');
  
  // Search state
  const [textQuery, setTextQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [isFallback, setIsFallback] = useState(false);

  // Image & Multimodal uploader state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [modifierText, setModifierText] = useState('');

  // Voice Search uploader state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Sync state or alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setVoiceTranscript('Listening... Speak your style query');
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setVoiceTranscript(resultText);
        setTextQuery(resultText);
        handleSpeechSubmit(resultText);
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
        setVoiceTranscript('Could not capture voice. Please type or try again.');
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const triggerVoiceRecording = () => {
    if (!recognitionRef.current) {
      setAlertMsg({ type: 'error', text: 'Web Speech API is not supported in this browser. Please type instead!' });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setModifierText('');
  };

  // Trigger Text / Voice query API
  const handleTextSearch = async (queryToUse?: string) => {
    const q = (queryToUse || textQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchResults([]);
    setDetectedColors([]);
    setAlertMsg(null);

    try {
      const response = await fetch('/api/ai/search/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data: SearchResponse = await response.json();
      
      setIsSearching(false);
      if (response.ok) {
        setSearchResults(data.matches);
        setIsFallback(data.isFallback);
      } else {
        setAlertMsg({ type: 'error', text: 'Search failed. Check server status.' });
      }
    } catch (err) {
      setIsSearching(false);
      setAlertMsg({ type: 'error', text: 'Error executing neural search.' });
    }
  };

  // Trigger Speech Transcribe & Search
  const handleSpeechSubmit = async (transcript: string) => {
    setIsSearching(true);
    setSearchResults([]);
    setAlertMsg(null);

    try {
      const response = await fetch('/api/ai/search/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const data: SearchResponse = await response.json();

      setIsSearching(false);
      if (response.ok) {
        setSearchResults(data.matches);
        setIsFallback(data.isFallback);
      } else {
        setAlertMsg({ type: 'error', text: 'Voice search alignment failed.' });
      }
    } catch (err) {
      setIsSearching(false);
      setAlertMsg({ type: 'error', text: 'Error sending voice search query.' });
    }
  };

  // Trigger Image visual similarity query
  const handleImageSearch = async () => {
    if (!imageFile) return;

    setIsSearching(true);
    setSearchResults([]);
    setDetectedColors([]);
    setAlertMsg(null);

    try {
      const base64 = await fileToBase64(imageFile);
      const response = await fetch('/api/ai/search/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: base64 })
      });
      const data: SearchResponse = await response.json();

      setIsSearching(false);
      if (response.ok) {
        setSearchResults(data.matches);
        setIsFallback(data.isFallback);
      } else {
        setAlertMsg({ type: 'error', text: 'Neural visual matching failed.' });
      }
    } catch (err) {
      setIsSearching(false);
      setAlertMsg({ type: 'error', text: 'Error uploading style photograph.' });
    }
  };

  // Trigger Multimodal composite query (Image + Text modifier)
  const handleMultimodalSearch = async () => {
    if (!imageFile || !modifierText.trim()) {
      setAlertMsg({ type: 'error', text: 'Please provide both an image and your styling modifier text!' });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setDetectedColors([]);
    setAlertMsg(null);

    try {
      const base64 = await fileToBase64(imageFile);
      const response = await fetch('/api/ai/search/multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: base64, text: modifierText })
      });
      const data: SearchResponse = await response.json();

      setIsSearching(false);
      if (response.ok) {
        setSearchResults(data.matches);
        setDetectedColors(data.detectedColorPalette || []);
        setIsFallback(data.isFallback);
      } else {
        setAlertMsg({ type: 'error', text: 'Multimodal blending search failed.' });
      }
    } catch (err) {
      setIsSearching(false);
      setAlertMsg({ type: 'error', text: 'Error in composite search execution.' });
    }
  };

  // Retrieve products corresponding to matched IDs
  const matchedProducts = searchResults
    .map(match => {
      const product = products.find(p => p.id === match.productId);
      return product ? { ...product, score: match.score, matchReason: match.matchReason } : null;
    })
    .filter((p): p is (Product & { score: number; matchReason: string }) => p !== null);

  const sampleSearchQueries = [
    '"I want a black oversized hoodie with fleece lining for winter"',
    '"French camp collar linen resort shirt for summer vacations"',
    '"Emerald green pleated silk evening dress for party"',
    '"Water-repellent tapered active track pants"'
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10" id="ai-search-console">
      {/* Intro Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-xl">
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
        </div>
        <h1 className="text-3xl font-light tracking-[0.15em] uppercase text-white font-sans">
          Interactive Style <span className="italic font-serif text-white/80">Navigator</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-xs text-white/40 leading-relaxed font-light tracking-wide">
          Explore our collection with high-fidelity discovery. Speak, use descriptions, or upload inspirations to find exact matching designer pieces instantly.
        </p>
      </div>

      {/* Alert Messaging */}
      {alertMsg && (
        <div className={`mb-6 flex items-center justify-between rounded-xl p-4 border text-[11px] uppercase tracking-wider ${alertMsg.type === 'error' ? 'bg-red-950/20 border-red-500/20 text-red-400' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'}`}>
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* Search mode tabs */}
      <div className="grid grid-cols-4 gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 max-w-2xl mx-auto">
        <button
          onClick={() => { setActiveTab('text'); setSearchResults([]); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-3 px-1 text-[10px] uppercase tracking-widest font-light transition-all ${activeTab === 'text' ? 'bg-white text-black font-normal shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          id="tab-text-btn"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span>Text Query</span>
        </button>
        <button
          onClick={() => { setActiveTab('image'); setSearchResults([]); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-3 px-1 text-[10px] uppercase tracking-widest font-light transition-all ${activeTab === 'image' ? 'bg-white text-black font-normal shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          id="tab-image-btn"
        >
          <ImageIcon className="h-3.5 w-3.5 shrink-0" />
          <span>Style Photo</span>
        </button>
        <button
          onClick={() => { setActiveTab('multimodal'); setSearchResults([]); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-3 px-1 text-[10px] uppercase tracking-widest font-light transition-all ${activeTab === 'multimodal' ? 'bg-white text-black font-normal shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          id="tab-multimodal-btn"
        >
          <Sliders className="h-3.5 w-3.5 shrink-0" />
          <span>Composite</span>
        </button>
        <button
          onClick={() => { setActiveTab('voice'); setSearchResults([]); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-3 px-1 text-[10px] uppercase tracking-widest font-light transition-all ${activeTab === 'voice' ? 'bg-white text-black font-normal shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          id="tab-voice-btn"
        >
          <Mic className="h-3.5 w-3.5 shrink-0" />
          <span>Voice Match</span>
        </button>
      </div>

      {/* Main Console Workspace */}
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/5 bg-[#0a0a0a]/60 backdrop-blur-md p-6 shadow-2xl">
        
        {/* TAB 1: NATURAL TEXT SEARCH */}
        {activeTab === 'text' && (
          <div className="space-y-6">
            <div className="relative">
              <input 
                type="text"
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTextSearch(); }}
                placeholder="What look are we crafting today? e.g. Vintage leather biker jacket with asymmetric zipper"
                className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-32 py-4 text-xs font-light tracking-wide text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                id="search-input-text"
              />
              <Search className="absolute left-4.5 top-4 h-4 w-4 text-white/30" />
              <button
                onClick={() => handleTextSearch()}
                disabled={!textQuery.trim() || isSearching}
                className="absolute right-2 top-2 rounded-xl bg-white px-5 py-2.5 text-[10px] font-semibold text-black uppercase tracking-wider transition-colors hover:bg-neutral-200 disabled:opacity-40"
                id="search-btn-text"
              >
                {isSearching ? 'Matching...' : 'Analyze'}
              </button>
            </div>

            {/* Starter templates */}
            <div className="space-y-2">
              <span className="text-[9px] text-white/30 font-medium uppercase tracking-[0.18em] flex items-center gap-1.5 pl-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                Trending Curations:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                {sampleSearchQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTextQuery(q.replace(/"/g, ''));
                      handleTextSearch(q.replace(/"/g, ''));
                    }}
                    className="rounded-xl border border-white/5 bg-white/[0.01] px-3.5 py-2.5 text-[11px] font-light text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 transition-colors text-left truncate"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STYLE PHOTO (VISUAL SIMILARITY) */}
        {activeTab === 'image' && (
          <div className="space-y-6">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition-colors ${imagePreview ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/[0.01] hover:border-white/20'}`}
              id="photo-uploader"
            >
              {imagePreview ? (
                <div className="relative aspect-square w-48 overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                  <img src={imagePreview} alt="Target look" className="h-full w-full object-cover" />
                  <button 
                    onClick={clearImage}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-white/60 font-light tracking-wide">Drag & drop visual style photo here</p>
                  <p className="text-[10px] text-white/30 mt-1 mb-4 font-mono">PNG, JPG, or JPEG up to 10MB</p>
                  <label className="cursor-pointer rounded-xl bg-white/5 border border-white/15 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white hover:bg-white/10 transition-colors">
                    Browse Files
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}
            </div>

            {imagePreview && (
              <div className="flex justify-center">
                <button
                  onClick={handleImageSearch}
                  disabled={isSearching}
                  className="rounded-xl bg-white px-8 py-3 text-[10px] font-bold text-black uppercase tracking-wider transition-colors hover:bg-neutral-200 disabled:opacity-40 flex items-center space-x-2"
                  id="image-search-submit"
                >
                  <Sparkles className="h-4 w-4 text-black" />
                  <span>{isSearching ? 'Scanning visual textures...' : 'Run Visual Search'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPOSITE (IMAGE + TEXT DIRECTIVE) */}
        {activeTab === 'multimodal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image box */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center transition-colors min-h-[180px] ${imagePreview ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/[0.01] hover:border-white/20'}`}
                id="multimodal-uploader"
              >
                {imagePreview ? (
                  <div className="relative aspect-square w-32 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                    <img src={imagePreview} alt="Base styling" className="h-full w-full object-cover" />
                    <button 
                      onClick={clearImage}
                      className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white text-xs hover:bg-black"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-xs">
                    <Upload className="h-5 w-5 text-white/30 mb-2" />
                    <span className="text-white/60 font-light tracking-wide">Upload styling photo</span>
                    <label className="cursor-pointer underline text-emerald-400 mt-2 font-light">
                      Select photo
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* Text modification box */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-medium text-white/30 uppercase tracking-[0.18em] block">Neural Composition Modifier</label>
                  <textarea
                    value={modifierText}
                    onChange={(e) => setModifierText(e.target.value)}
                    placeholder="Describe how to adapt this style, e.g. 'Find something similar but in pristine French white linen for summer resort wear'"
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-xs font-light text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none h-28"
                    id="multimodal-textarea"
                  />
                </div>
              </div>
            </div>

            {imagePreview && modifierText.trim() && (
              <div className="flex justify-center border-t border-white/5 pt-4">
                <button
                  onClick={handleMultimodalSearch}
                  disabled={isSearching}
                  className="rounded-xl bg-white px-8 py-3 text-[10px] font-bold text-black uppercase tracking-wider transition-colors hover:bg-neutral-200 disabled:opacity-40 flex items-center space-x-2"
                  id="multimodal-search-submit"
                >
                  <Cpu className="h-4 w-4 text-black" />
                  <span>{isSearching ? 'Analyzing style composition...' : 'Execute Composite Search'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VOICE SEARCH PULSING */}
        {activeTab === 'voice' && (
          <div className="space-y-6 py-4 flex flex-col items-center">
            <p className="text-xs text-white/40 text-center font-light tracking-wide">
              Click the microphone and speak. AuraStyle's voice aligner parses your speech terms and ranks the catalogue.
            </p>

            <div className="relative flex items-center justify-center my-6">
              {/* Concentric pulsing circles */}
              {isRecording && (
                <>
                  <span className="absolute h-24 w-24 rounded-full bg-emerald-500/10 animate-ping" />
                  <span className="absolute h-32 w-32 rounded-full bg-emerald-500/5 animate-pulse" />
                </>
              )}
              
              <button
                onClick={triggerVoiceRecording}
                className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${isRecording ? 'bg-red-900/65 text-white ring-4 ring-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}
                id="voice-mic-trigger"
              >
                {isRecording ? <MicOff className="h-8 w-8 animate-pulse" /> : <Mic className="h-8 w-8" />}
              </button>
            </div>

            {voiceTranscript && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-3.5 max-w-lg text-center">
                <span className="text-[9px] text-emerald-400 font-mono block uppercase tracking-widest mb-1.5">Voice Transcription</span>
                <p className="text-xs font-light text-white italic">"{voiceTranscript}"</p>
              </div>
            )}
          </div>
        )}

        {/* Gemini fallback info banner */}
        {isFallback && (
          <div className="mt-6 flex items-center space-x-2.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 p-3.5 text-[11px] text-amber-400 font-light leading-snug">
            <Info className="h-4 w-4 shrink-0" />
            <span>Offline Mode: Currently executing local styling similarity checks. Connect to high-fidelity networks to refresh global search capability.</span>
          </div>
        )}

      </div>

      {/* AI Radar Scan Loading Indicator */}
      {isSearching && (
        <div className="mt-12 flex flex-col items-center space-y-3" id="search-loading-indicator">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <RefreshCw className="h-6 w-6 text-white animate-spin" />
            <span className="absolute h-10 w-10 rounded-full border border-white/10 animate-ping" />
          </div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-white/60 uppercase animate-pulse">Running AuraStyle Multi-agent Match...</span>
        </div>
      )}

      {/* Search results catalog display */}
      {!isSearching && matchedProducts.length > 0 && (
        <div className="mt-12 space-y-6" id="search-results">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
              <h2 className="text-sm font-light uppercase tracking-widest text-white">Recommended Pieces ({matchedProducts.length})</h2>
            </div>
            {detectedColors.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-white/5 border border-white/5 rounded-full px-3 py-1">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-wide">Colors:</span>
                {detectedColors.map((col, idx) => (
                  <span key={idx} className="text-[9px] font-mono font-medium text-white/80 uppercase bg-white/10 px-1.5 py-0.5 rounded">
                    {col}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matchedProducts.map((p) => (
              <div 
                key={p.id}
                className="group flex flex-col sm:flex-row overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0a]/40 hover:bg-[#0a0a0a]/80 transition-all duration-300"
              >
                {/* Product image */}
                <div 
                  onClick={() => onNavigate('product-detail', { id: p.id })}
                  className="relative aspect-square sm:aspect-auto sm:w-44 bg-neutral-950 cursor-pointer overflow-hidden"
                >
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-750 group-hover:scale-105" />
                  <div className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[9px] font-light uppercase tracking-widest text-white/60 border border-white/5">
                    {p.gender}
                  </div>
                </div>

                {/* Match report */}
                <div className="flex-1 p-5.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/40 font-sans">{p.brand}</span>
                      
                      {/* Similarity score bar */}
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] font-medium text-emerald-400 font-sans uppercase tracking-widest">Similarity:</span>
                        <span className="text-[11px] font-medium text-white/90 font-mono">{(p.score * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <h3 
                      onClick={() => onNavigate('product-detail', { id: p.id })}
                      className="text-[13px] font-light text-white cursor-pointer hover:text-emerald-400 transition-colors font-sans tracking-wide"
                    >
                      {p.name}
                    </h3>

                    {/* Similarity score bar element */}
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${p.score * 100}%` }} />
                    </div>

                    {/* Gemini Reasoning statement */}
                    <div className="rounded-xl bg-white/[0.02] p-2.5 border border-white/5 text-[11px] text-white/50 italic font-serif">
                      "{p.matchReason}"
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                    <span className="text-sm font-light text-white/95 font-mono tracking-wide">₹{p.price}</span>
                    <button
                      onClick={() => onAddToCart(p, p.sizes[0], p.colors[0]?.name)}
                      className="rounded-lg bg-white px-3.5 py-2 text-[10px] uppercase tracking-wider font-semibold text-black hover:bg-neutral-200 transition-colors"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State placeholder */}
      {!isSearching && searchResults.length === 0 && (
        <div className="mt-12 text-center py-10 bg-white/[0.01] rounded-3xl border border-dashed border-white/5 max-w-md mx-auto">
          <Info className="mx-auto h-7 w-7 text-neutral-500 mb-2 animate-bounce" />
          <h3 className="text-sm font-semibold text-neutral-300">No alignments loaded</h3>
          <p className="text-[11px] text-neutral-500 mt-1">Provide a style query above to begin semantic catalog matching.</p>
        </div>
      )}
    </div>
  );
}
