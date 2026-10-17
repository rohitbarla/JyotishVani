import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, RefreshCw, ChevronDown, ChevronUp, Calendar, Compass, ShieldCheck, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { FREQUENT_QUESTIONS, ZODIAC_SIGNS } from "../data/astrologyData";
import { ChatMessage } from "../types";

interface AiAstrologyChatProps {
  userSign?: string;
}

export const AiAstrologyChat: React.FC<AiAstrologyChatProps> = ({
  userSign = "aries",
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "assistant",
      text: `### 🌿 Pranam & Welcome to Jyotish AI

I am your 24/7 **Vedic Astrological Oracle**, grounded in Parashari Hora Shastra, planetary transits (Gochara), and Nakshatra wisdom.

Feel free to ask me anything about your:
- **Career & Professional Karma** (timing of promotions, career shifts, ventures)
- **Love & Marriage Compatibility** (relationship harmony, Vivaha timings)
- **Financial Transits & Wealth Yogas**
- **Shani Sade Sati, Rahu/Ketu guidance & gemstone recommendations**

*Select a quick prompt below or type your personal astrological question.*`,
      timestamp: "Just now",
      source: "gemini-api",
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [selectedSign, setSelectedSign] = useState(userSign);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [showBirthDetails, setShowBirthDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signs, setSigns] = useState(ZODIAC_SIGNS);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/horoscopes")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.horoscopes) && data.horoscopes.length > 0) {
          setSigns(data.horoscopes);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend,
          sign: selectedSign,
          birthDate,
          birthTime,
          birthCity,
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "assistant",
        text: data.answer || "Cosmic alignments are shifting. Please ask your query again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: data.source,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat API error:", err);
      const fallbackMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "assistant",
        text: `### 🌿 Cosmic Guidance for ${selectedSign.toUpperCase()}

Regarding your question *"_${textToSend}_"*:

**Cosmic Reading:**
The transits of Brihaspati (Jupiter) and Shani (Saturn) indicate that steady moral perseverance will bear fruit. Major karmic knots soften gently over the next 45 to 60 days.

**Auspicious Muhurat & Upayas:**
- **Favorable Timings:** Thursdays between 10:00 AM and 12:30 PM.
- **Vedic Remedy:** Offer water to Surya Dev in the morning and chant the Gayatri Mantra 24 times.
- For an in-depth birth chart (Kundli) consultation, consider speaking 1-on-1 with our verified senior astrologers!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "vedic-engine",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ai-oracle-section" className="py-16 sm:py-20 bg-[#F5F5F0] relative overflow-hidden border-b border-[#E8E6DF]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-[#8B9D83] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>AI Vedic Astrologer &bull; Instant Wisdom</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D3D3D] tracking-tight">
            Ask Jyotish AI Any Cosmic Question
          </h2>
          <p className="mt-2 text-sm text-[#7A7A7A] max-w-xl mx-auto font-sans">
            Receive instant astrological reflections grounded in authentic Vedic shastras, planetary transits, and personal remedies.
          </p>
        </div>

        {/* Quick Question Prompt Chips */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-[#7A7A7A] font-semibold mb-2.5 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#8B9D83]" />
            <span>Frequent Questions (Click to Ask)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {FREQUENT_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="text-xs bg-white hover:bg-[#F0EDDF] border border-[#E8E6DF] hover:border-[#8B9D83] text-[#4A4A4A] hover:text-[#3D3D3D] px-3.5 py-2 rounded-2xl text-left transition-all cursor-pointer shadow-xs disabled:opacity-50 font-sans"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Main Window */}
        <div className="rounded-[32px] bg-white border border-[#E8E6DF] shadow-sm overflow-hidden flex flex-col h-[580px]">
          {/* Chat Window Top Bar */}
          <div className="bg-[#FAF9F6] px-4 sm:px-6 py-3.5 border-b border-[#E8E6DF] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#8B9D83] flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#3D3D3D] flex items-center gap-2">
                  <span>Jyotish AI Oracle</span>
                  <span className="text-[10px] bg-[#F0EDDF] text-[#5C6B5A] px-2 py-0.5 rounded-full font-bold border border-[#8B9D83]/30">
                    Online
                  </span>
                </h4>
                <p className="text-[10px] text-[#7A7A7A]">Powered by Gemini AI &amp; Vedic Logic</p>
              </div>
            </div>

            {/* Sign & Birth Details Toggle */}
            <div className="flex items-center gap-2">
              <select
                value={selectedSign}
                onChange={(e) => setSelectedSign(e.target.value)}
                className="bg-white border border-[#E8E6DF] text-[#3D3D3D] text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-[#8B9D83] cursor-pointer shadow-xs font-medium"
              >
                {signs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.symbol} {s.name} ({s.vedicName.split(" ")[0]})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowBirthDetails(!showBirthDetails)}
                className="text-xs text-[#5C6B5A] hover:text-[#3D3D3D] flex items-center gap-1 bg-[#F0EDDF] px-3 py-1.5 rounded-full border border-[#E8E6DF] transition-colors cursor-pointer font-medium"
              >
                <span>Birth Details</span>
                {showBirthDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8B9D83]" />}
              </button>
            </div>
          </div>

          {/* Optional Birth Details Drawer */}
          {showBirthDetails && (
            <div className="bg-[#FAF9F6] border-b border-[#E8E6DF] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#7A7A7A] mb-1 uppercase tracking-wider">Date of Birth</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8B9D83]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7A7A7A] mb-1 uppercase tracking-wider">Time of Birth (Optional)</label>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8B9D83]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7A7A7A] mb-1 uppercase tracking-wider">Birth City (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Varanasi, UP"
                  value={birthCity}
                  onChange={(e) => setBirthCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E6DF] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8B9D83] placeholder-[#AFAFAF]"
                />
              </div>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 font-sans bg-[#FDFCFB]">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-[#F0EDDF] text-[#8B9D83] border border-[#E8E6DF] flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? "bg-[#8B9D83] text-white font-medium rounded-tr-xs"
                        : "bg-[#F5F5F0] border border-[#E8E6DF] text-[#3D3D3D] rounded-tl-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="prose prose-xs max-w-none space-y-2 [&_h3]:font-serif [&_h3]:text-[#3D3D3D] [&_h3]:font-bold [&_strong]:text-[#3D3D3D] [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-1 text-[#4A4A4A]">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}

                    <div
                      className={`text-[10px] mt-2 flex items-center gap-2 ${
                        isUser ? "text-white/80 justify-end" : "text-[#7A7A7A] justify-between"
                      }`}
                    >
                      {!isUser && msg.source && (
                        <span className="uppercase text-[9px] tracking-wider text-[#8B9D83] font-bold">
                          {msg.source === "gemini-api" ? "✨ Gemini 2.5 Flash" : "🪐 Vedic Engine"}
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-[#CB997E] text-white flex items-center justify-center shrink-0 mt-1 font-bold text-xs shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F0EDDF] text-[#8B9D83] border border-[#E8E6DF] flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-[#F5F5F0] border border-[#E8E6DF] rounded-2xl rounded-tl-xs p-3.5 text-xs text-[#4A4A4A] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8B9D83] animate-ping" />
                  <span>Consulting planetary ephemeris &amp; Vedic transits for your sign...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3.5 bg-[#FAF9F6] border-t border-[#E8E6DF]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputQuery);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                id="ai-chat-input"
                placeholder="Ask about career, relationships, Shani remedies, gemstones, or Muhurat..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-full bg-white border border-[#E8E6DF] text-[#3D3D3D] text-xs sm:text-sm focus:outline-none focus:border-[#8B9D83] placeholder-[#AFAFAF] shadow-xs"
              />

              <button
                type="submit"
                id="ai-chat-send-btn"
                disabled={loading || !inputQuery.trim()}
                className="px-5 py-3 rounded-full bg-[#CB997E] hover:bg-[#B8856B] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <span>Ask AI</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
