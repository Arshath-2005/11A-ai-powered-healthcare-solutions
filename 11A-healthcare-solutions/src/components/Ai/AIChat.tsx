import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Clock, Star, DollarSign, Heart, Mic } from 'lucide-react';
import { ChatMessage, Doctor } from './types';
import { analyzeSymptoms, generateFollowUpQuestions } from './services/aiService';
import { fetchDoctorsBySpecialization } from './services/doctorService';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const hasLoadedMessagesRef = useRef(false);
  const navigate = useNavigate();

  const welcomeMessage: ChatMessage = {
    id: '1',
    message: "Hey there! 👋 I'm your AI health buddy! I'm here to chat about your symptoms or just say hi. 😊",
    sender: 'ai',
    timestamp: new Date(),
  };

  useEffect(() => {
    const saved = localStorage.getItem('aiChatMessages');
    if (saved) {
      try {
        const parsed: ChatMessage[] = JSON.parse(saved).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }));
        setMessages(parsed);
      } catch {
        localStorage.removeItem('aiChatMessages');
        setMessages([welcomeMessage]);
      }
    } else {
      setMessages([welcomeMessage]);
    }
    setTimeout(() => (hasLoadedMessagesRef.current = true), 100);
  }, []);

  useEffect(() => {
    if (hasLoadedMessagesRef.current) {
      localStorage.setItem('aiChatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const speech = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' : '') + speech);
      setIsRecording(false);
    };

    recognition.onerror = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleRecording = () => {
    if (isRecording) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
    setIsRecording(prev => !prev);
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      message: msg,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await analyzeSymptoms(msg);
      const suggestedDoctors = aiResponse.specializations.length
        ? (await fetchDoctorsBySpecialization(aiResponse.specializations)).slice(0, 3)
        : [];

      setFollowUpQuestions(
        aiResponse.specializations.length ? generateFollowUpQuestions(aiResponse.specializations[0]) : []
      );

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          message: aiResponse.analysis,
          sender: 'ai',
          timestamp: new Date(),
          suggestedDoctors: suggestedDoctors.length ? suggestedDoctors : undefined,
        },
      ]);

      if (aiResponse.recommendations.length) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              message: `Here are some things that might help:\n\n${aiResponse.recommendations
                .map(tip => `💚 ${tip}`)
                .join('\n\n')}`,
              sender: 'ai',
              timestamp: new Date(),
            },
          ]);
        }, 2000);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          message: "Oops! 😅 Something went wrong. Can you try again?",
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBookNow = (doctor: Doctor) => {
    navigate('/patient/appointments', { state: { doctor } });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-green-50 via-teal-50 to-lime-50 p-2">
      <div className="h-full max-w-5xl mx-auto flex flex-col rounded-3xl overflow-hidden border shadow-xl bg-white">
        {/* Header */}
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                AI Health Buddy
              </h1>
              <p className="text-sm text-gray-600">Your caring, intelligent companion</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('aiChatMessages');
              setMessages([welcomeMessage]);
            }}
            className="text-xs text-red-500 hover:underline"
          >
            Clear Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.sender === 'user' ? 'ml-4' : 'mr-4'}`}>
                <div className={`rounded-2xl px-4 py-3 shadow ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                    : 'bg-gray-100 text-gray-800 border'
                }`}>
                  <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                  <p className={`text-xs mt-2 ${msg.sender === 'user' ? 'text-green-100' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.suggestedDoctors?.map((doc, i) => (
                  <div key={i} className="bg-green-50 mt-4 rounded-lg p-4 border">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-green-900">Dr. {doc.name}</h3>
                        <p className="text-green-700">{doc.specialization}</p>
                      </div>
                      <div className="flex gap-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{doc.experience} yrs</div>
                        <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" />₹{doc.consultationFee}</div>
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" />{doc.rating}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBookNow(doc)}
                      className="mt-3 w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 rounded-lg hover:opacity-90"
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-5 py-3 shadow-md inline-flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce delay-100" />
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-200" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Follow-up Questions */}
        {followUpQuestions.length > 0 && (
          <div className="border-t p-4 bg-gray-50 flex flex-wrap gap-3">
            <p className="w-full mb-2 text-gray-700 font-medium">I'd love to know a bit more:</p>
            {followUpQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  handleSend(q);
                  setFollowUpQuestions([]);
                }}
                className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-200 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Box */}
        <div className="border-t p-4 bg-white flex items-end gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe your symptoms or say hi!"
            rows={2}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1 resize-none border rounded-2xl px-4 py-3 text-sm focus:outline-none"
          />
          <button onClick={toggleRecording} className={`p-3 rounded-full border-2 transition ${
            isRecording
              ? 'border-red-500 text-red-500 animate-pulse'
              : 'border-gray-400 text-gray-600 hover:text-green-600 hover:border-green-600'
          }`}>
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl p-3 transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;