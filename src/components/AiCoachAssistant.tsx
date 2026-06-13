import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, User, Brain, AlertTriangle } from 'lucide-react';
import { AnalysisResult } from '@/data/mockData';

const BACKEND_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Message {
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

interface AiCoachAssistantProps {
  analysis: AnalysisResult;
}

export const AiCoachAssistant: React.FC<AiCoachAssistantProps> = ({ analysis }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome messages
  useEffect(() => {
    setMessages([
      {
        sender: 'coach',
        text: `Halo! Saya AI Coach golf pribadi Anda. 🏌️‍♂️ I have fully analyzed your YOLO scan reports. Your overall Swing Score is **${analysis.swingScore}/100** with an injury risk of **${analysis.injuryRiskScore}%**.\n\nBagaimana saya bisa membantu menyempurnakan swing mekanik Anda hari ini?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [analysis]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Automated contextual response engine
  const getCoachResponse = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Casting / backswing questions
    if (q.includes('cast') || q.includes('downswing') || q.includes('backswing')) {
      const bsPhase = analysis.swingPhases.find(p => p.phase === 'backswing') || { score: 75, feedback: '' };
      const dsPhase = analysis.swingPhases.find(p => p.phase === 'downswing') || { score: 80, feedback: '' };
      return `Berdasarkan deteksi YOLO, skor **Backswing** Anda adalah **${bsPhase.score}/100** dan **Downswing** adalah **${dsPhase.score}/100**.\n\n**Mekanik Analisis:**\n- ${bsPhase.feedback}\n- ${dsPhase.feedback}\n\n**AI Rekomendasi Latihan:**\n1. **Towel Drill**: Selipkan handuk di bawah kedua ketiak saat melakukan half-swings. Ini melatih lengan tetap 'connected' ke dada.\n2. **Wrist Hinge Check**: Jaga sudut pergelangan tangan (wrist hinge) tetap kokoh hingga gagang club sejajar dengan tanah di downswing untuk melipatgandakan kompresi bola!`;
    }

    // 2. Posture / injury risk
    if (q.includes('postur') || q.includes('cedera') || q.includes('injury') || q.includes('back') || q.includes('punggung')) {
      const risk = analysis.injuryRiskScore;
      const areas = analysis.injuryRiskAreas.join(', ');
      return `Tingkat resiko cedera Anda berada pada skor **${risk}%** (Resiko: ${risk > 30 ? 'Sedang-Tinggi' : 'Rendah'}).\n\n**Area Deteksi Resiko:** ${areas}.\n\n**Saran AI Coach:**\n- *Address Posture*: Pastikan tidak terlalu membungkuk (*C-Posture*) atau melengkungkan punggung secara berlebihan (*S-Posture*). Jaga tulang belakang netral dan tekuk sedikit di panggul (hips).\n- *Core Engagement*: Lakukan latihan plang atau medicine ball rotation secara teratur untuk memperkuat rotasi otot inti dan melepaskan beban berlebih di punggung bawah Anda saat impact!`;
    }

    // 3. General drills / recommendations
    if (q.includes('latihan') || q.includes('drill') || q.includes('rekomendasi') || q.includes('drill')) {
      const recs = analysis.recommendation.map((r, i) => `${i + 1}. **${r}**`).join('\n');
      return `Berikut adalah program latihan spesifik yang dirumuskan AI berdasarkan swing scan Anda:\n\n${recs}\n\n**Tips Tambahan:** Latihlah drill ini di driving range dengan tempo lambat terlebih dahulu (0.50x speed) sebelum melakukan full swing dengan kecepatan penuh!`;
    }

    // 4. Default fallback
    return `Pertanyaan yang bagus! Dari data sensor YOLO v8, skor swing Anda sebesar **${analysis.swingScore}** dipengaruhi oleh postur tubuh saat impact. Cobalah menjaga kepala tetap stabil di dalam lingkaran marker swing yang Anda gambar di video, dan lakukan rotasi panggul secara aktif. Apakah Anda ingin saya memberikan latihan fisik untuk memperkuat area ini?`;
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append user message
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          swingScore: analysis.swingScore,
          injuryRiskScore: analysis.injuryRiskScore,
          injuryRiskAreas: analysis.injuryRiskAreas,
          swingPhases: analysis.swingPhases
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text) {
          const coachMsg: Message = {
            sender: 'coach',
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, coachMsg]);
          setIsTyping(false);
          return;
        }
      }
    } catch (e) {
      console.warn('[AiCoach] Backend connection failed, using local fallback.', e);
    }

    // Fallback: local coach heuristics
    const replyText = getCoachResponse(textToSend);
    const coachMsg: Message = {
      sender: 'coach',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, coachMsg]);
    setIsTyping(false);
  };

  const quickPrompts = [
    { text: 'Bagaimana cara perbaiki downswing?', label: 'Fix Downswing' },
    { text: 'Apakah resiko cedera punggung saya aman?', label: 'Check Injury Risk' },
    { text: 'Berikan latihan golf terbaik untuk saya.', label: 'Get AI Drills' },
  ];

  return (
    <div className="golf-card flex flex-col h-[400px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <Brain className="text-gold" size={18} />
          <h3 className="font-display font-bold text-sm tracking-wide text-slate-200 uppercase flex items-center gap-1.5">
            AI Golf Coach <span className="text-[10px] lowercase px-1.5 py-0.5 rounded bg-gold/10 text-gold font-normal">Active Assistant</span>
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" /> Online
        </div>
      </div>

      {/* Message history */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-950/20 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar for AI */}
            {msg.sender === 'coach' && (
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Brain size={14} className="text-gold" />
              </div>
            )}

            <div className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed shadow-md ${
              msg.sender === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-none'
                : 'bg-muted text-foreground border border-slate-800 rounded-tl-none whitespace-pre-line'
            }`}>
              {msg.text}
              <div className={`text-[9px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {msg.timestamp}
              </div>
            </div>

            {/* Avatar for User */}
            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2.5 justify-start items-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Brain size={14} className="text-gold" />
            </div>
            <div className="bg-muted border border-slate-800 rounded-xl px-4 py-2.5 rounded-tl-none shadow-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce delay-200" />
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce delay-300" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested quick chips */}
      <div className="px-3 py-2 bg-slate-950/40 border-t border-slate-850 flex flex-wrap gap-1.5 select-none">
        {quickPrompts.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.text)}
            disabled={isTyping}
            className="text-[10px] px-2.5 py-1 rounded-full border border-slate-850 bg-slate-900 hover:bg-slate-850 hover:border-slate-750 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Sparkles size={9} className="text-gold" /> {chip.label}
          </button>
        ))}
      </div>

      {/* Chat input footer */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(input);
          }}
          disabled={isTyping}
          placeholder="Ask Coach: 'How is my spine angle?'..."
          className="flex-grow golf-input py-2 text-xs disabled:opacity-50"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isTyping || !input.trim()}
          className="w-9 h-9 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center shadow-md transition-colors disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
