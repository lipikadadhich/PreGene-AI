import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  FileText,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { API_URL } from "@/services/api";

interface ChatSource {
  category: string;
  source_document: string;
  page?: number | null;
  similarity: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

// The Web Speech API's SpeechRecognition constructor isn't in
// TypeScript's default lib.dom types yet, and lives under a vendor
// prefix in some browsers (Chrome/Edge) — this minimal type covers
// just what this component actually uses.
interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } };
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const isSpeechRecognitionSupported = getSpeechRecognitionConstructor() !== null;
const isSpeechSynthesisSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the PreGene-AI clinical assistant. Ask me about any disease, inheritance pattern, or CRISPR strategy in our knowledge base.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Auto-scroll to the latest message whenever the conversation changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  // Stop any in-progress speech/listening when the widget closes or
  // unmounts, so voice doesn't keep running in the background.
  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (isSpeechSynthesisSupported) {
        window.speechSynthesis.cancel();
        setSpeakingIndex(null);
      }
    }
    return () => {
      recognitionRef.current?.stop();
      if (isSpeechSynthesisSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  async function handleSend(overrideText?: string) {
    const question = (overrideText ?? input).trim();
    if (!question || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Chat request failed");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I couldn't process that: ${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleMicClick() {
    if (!isSpeechRecognitionSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Send immediately once speech is transcribed, like ChatGPT's
      // voice mode — the user doesn't have to also press Send.
      handleSend(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  function handleSpeakToggle(index: number, text: string) {
    if (!isSpeechSynthesisSupported) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    // Only one message speaks at a time — cancel anything in progress
    // before starting the new one.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating toggle button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-transform hover:scale-105"
          aria-label="Open clinical assistant chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="flex h-[520px] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-brand-500 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Clinical Assistant</p>
              <p className="text-xs text-white/80">
                Grounded in PreGene-AI's knowledge base
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-brand-500 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>

                  {/* Voice playback — only on assistant messages, and
                      only when the browser supports speech synthesis */}
                  {msg.role === "assistant" && isSpeechSynthesisSupported && (
                    <button
                      type="button"
                      onClick={() => handleSpeakToggle(i, msg.content)}
                      className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700"
                      aria-label={
                        speakingIndex === i
                          ? "Stop reading answer aloud"
                          : "Read answer aloud"
                      }
                    >
                      {speakingIndex === i ? (
                        <>
                          <VolumeX className="h-3 w-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3 w-3" />
                          Listen
                        </>
                      )}
                    </button>
                  )}

                  {/* Source citations — the transparency piece that makes
                      this genuine RAG rather than a black-box answer */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 space-y-1 border-t border-slate-200 pt-2">
                      <p className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <FileText className="h-3 w-3" />
                        Sources
                      </p>
                      {msg.sources.map((src, j) => (
                        <p key={j} className="text-[11px] text-slate-500">
                          {src.category.replace(/_/g, " ")}{" "}
                          <span className="text-slate-400">
                            ({src.source_document}
                            {src.page != null ? `, p.${src.page}` : ""}, match{" "}
                            {(src.similarity * 100).toFixed(0)}%)
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3">
            {error && (
              <p className="mb-2 text-xs text-red-600">
                Connection issue — the assistant may be waking up (free-tier
                servers sleep when idle). Try again in a moment.
              </p>
            )}
            {isListening && (
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-brand-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                Listening...
              </p>
            )}
            <div className="flex items-center gap-2">
              {isSpeechRecognitionSupported && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isLoading}
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isListening
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about a disease, gene, or CRISPR strategy..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}