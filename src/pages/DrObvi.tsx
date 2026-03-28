import { useState, useRef, useEffect } from 'react';
import { Bot, Send } from 'lucide-react';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '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',
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true,
});

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const DrObvi = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Dr. Obvi, your AI medical advice assistant. I can help with clinical questions, drug interactions, symptoms, dosages, and general medical guidance.\n\n⚠️ Please note: I do NOT have access to any patient records, doctor schedules, bed availability, or any hospital system data. For that information, please use the relevant sections of DoctorVault.\n\nHow can I assist you medically today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are Dr. Obvi, an AI medical advice assistant built into DoctorVault, a hospital management system.

YOUR SOLE PURPOSE is to answer medical and clinical questions. This includes:
- Drug interactions and dosage guidance
- Symptom analysis and differential diagnoses
- Treatment recommendations and protocols
- Lab result interpretation
- General clinical advice

YOU DO NOT HAVE ACCESS TO and must NEVER pretend to have:
- Any patient records, history, or data
- Doctor or staff schedules or availability
- Bed availability or ward occupancy
- Appointments or bookings
- Any live hospital system data

If someone asks about patients, doctors, beds, schedules, or anything related to hospital operations or records, you must clearly tell them you don't have access to that information and direct them to use the appropriate section of DoctorVault instead.

You are knowledgeable, direct, and occasionally use dry humor — like saying "probably nothing, but also maybe something."
You never replace real doctors. Always recommend escalating to a real physician for serious concerns.
Keep responses concise and clinically relevant.`,
          },
          ...history,
          { role: 'user', content: input },
        ],
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.choices[0].message.content || 'No response received.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Groq error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0A0F2C]">Dr. Obvi</h1>
        <p className="text-gray-600 mt-1">AI Medical Advice Assistant — clinical guidance only</p>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
        <span className="text-amber-500 text-xl">⚠️</span>
        <div>
          <p className="text-amber-800 font-semibold text-sm">Medical Advice Only</p>
          <p className="text-amber-700 text-sm mt-0.5">
            Dr. Obvi answers clinical and medical questions only. He has <strong>no access</strong> to patient records, doctor schedules, bed availability, or any hospital data. Use the relevant DoctorVault sections for those.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0A0F2C] to-[#1a2456] rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#2D7DD2] rounded-full flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Dr. Obvi AI</h2>
            <p className="text-sm text-gray-300">Powered by Groq — Medical advice & clinical guidance</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.sender === 'user'
                    ? 'bg-[#2D7DD2] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.sender === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4" />
                    <span className="text-xs font-medium">Dr. Obvi</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-lg p-4 bg-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-gray-900" />
                  <span className="text-xs font-medium text-gray-900">Dr. Obvi</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about symptoms, drug interactions, dosages, clinical guidance..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-6 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};