import React, { useEffect, useRef } from 'react';
import { useLiveApi } from './hooks/use-live-api';
import { ConnectionState } from './types';
import Waveform from './components/Waveform';

const App = () => {
  const {
    connect,
    disconnect,
    connectionState,
    messages,
    audioInputAnalyser,
    audioOutputAnalyser
  } = useLiveApi();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToggleConnect = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/1920/1080?grayscale&blur=2" 
          alt="Sydney Harbor Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-900/60 pointer-events-none" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center text-white font-serif text-xl shadow-lg">
            A
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sydney Azure Hotel</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Concierge Service</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <span className={`h-2.5 w-2.5 rounded-full ${
             connectionState === ConnectionState.CONNECTED ? 'bg-emerald-500 animate-pulse' : 
             connectionState === ConnectionState.CONNECTING ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
           }`}></span>
           <span className="text-sm font-medium text-slate-600">
             {connectionState === ConnectionState.CONNECTED ? 'Live' : 
              connectionState === ConnectionState.CONNECTING ? 'Connecting...' : 'Offline'}
           </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-4 overflow-hidden">
        
        {/* Left Panel: Visuals & Avatar */}
        <div className="flex-1 flex flex-col justify-center items-center space-y-8 min-h-[300px]">
          
          <div className="relative">
             {/* Avatar Circle */}
             <div className={`w-48 h-48 md:w-64 md:h-64 rounded-full p-2 bg-white shadow-2xl transition-all duration-700 ${connectionState === ConnectionState.CONNECTED ? 'shadow-indigo-500/20 scale-105' : 'grayscale'}`}>
               <img 
                 src="https://picsum.photos/400/400" 
                 alt="Sarah Receptionist" 
                 className="w-full h-full rounded-full object-cover border-4 border-slate-50"
               />
               
               {/* Status Badge */}
               <div className="absolute bottom-4 right-8 bg-white px-3 py-1 rounded-full shadow-lg border border-slate-100 flex items-center space-x-1">
                 <span className="text-xs font-bold text-slate-700">Sarah</span>
                 {connectionState === ConnectionState.CONNECTED && (
                    <span className="block w-2 h-2 rounded-full bg-green-500"></span>
                 )}
               </div>
             </div>

             {/* Ripple Effect when speaking */}
             {connectionState === ConnectionState.CONNECTED && (
               <div className="absolute inset-0 rounded-full border-4 border-indigo-400/30 animate-ping -z-10"></div>
             )}
          </div>

          <div className="w-full max-w-md space-y-4">
             {/* Output Visualizer (Sarah Speaking) */}
             <div className="bg-white/60 backdrop-blur rounded-xl p-3 shadow-sm border border-white/50">
                <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider text-center">Sarah's Voice</p>
                <Waveform analyser={audioOutputAnalyser} isActive={connectionState === ConnectionState.CONNECTED} color="#6366f1" />
             </div>

             {/* Input Visualizer (User Speaking) */}
             <div className="bg-white/60 backdrop-blur rounded-xl p-3 shadow-sm border border-white/50">
                <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider text-center">Your Microphone</p>
                <Waveform analyser={audioInputAnalyser} isActive={connectionState === ConnectionState.CONNECTED} color="#f43f5e" />
             </div>
          </div>
        </div>

        {/* Right Panel: Chat Transcript */}
        <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden h-full md:h-auto">
          <div className="p-4 border-b border-slate-100 bg-white/50">
             <h2 className="text-sm font-semibold text-slate-700">Conversation Transcript</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
             {messages.length === 0 && (
               <div className="text-center text-slate-400 mt-10">
                 <p className="mb-2 text-lg">Good day!</p>
                 <p className="text-sm">Connect to start speaking with Sarah.</p>
               </div>
             )}
             
             {messages.map((msg) => (
               <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                   msg.role === 'user' 
                     ? 'bg-indigo-600 text-white rounded-tr-none' 
                     : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                 }`}>
                   <p className="text-sm leading-relaxed">{msg.text}</p>
                   {msg.isPartial && <span className="inline-block w-2 h-2 ml-1 bg-current rounded-full animate-bounce"></span>}
                 </div>
               </div>
             ))}
             <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="p-6 bg-white border-t border-slate-100 flex justify-center items-center">
             <button
               onClick={handleToggleConnect}
               disabled={connectionState === ConnectionState.CONNECTING}
               className={`relative group px-8 py-4 rounded-full font-bold text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl flex items-center space-x-3 ${
                 connectionState === ConnectionState.CONNECTED 
                 ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                 : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
               } disabled:opacity-70 disabled:cursor-not-allowed`}
             >
               {connectionState === ConnectionState.CONNECTING ? (
                 <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <span>Connecting...</span>
                 </>
               ) : connectionState === ConnectionState.CONNECTED ? (
                 <>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                   <span>End Call</span>
                 </>
               ) : (
                 <>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                   </svg>
                   <span>Speak with Sarah</span>
                 </>
               )}
             </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;