"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MessageCircle, X, Send, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const close = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 220);
  };




  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const authContext = useAuth();
  const authToken = authContext?.token || null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
  
    if (!authToken) {
      const authErrorMsg: Message = { 
        role: "assistant", 
        content: "Для использования чата требуется авторизация. Пожалуйста, войдите в аккаунт.", 
        timestamp: new Date().toISOString() 
      };
      setMessages((prev) => [...prev, authErrorMsg]);
      return;
    }
  
    setMessage("");
    setIsLoading(true);
  
    const newUserMsg: Message = { 
        role: "user", 
        content: userMessage, 
        timestamp: new Date().toISOString() 
    };
    setMessages((prev) => [...prev, newUserMsg]);
  
    try {
      const response = await fetch("http://localhost:8000/v1/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: userMessage,
          chat_id: chatId || null
        }),
      });
  
      if (!response.ok) {
        let errorMsg = "Ошибка связи с сервером";
        try {
          const errorData = await response.json();
          if (response.status === 401 && errorData.detail) {
            errorMsg = `Ошибка авторизации: ${errorData.detail}. Войдите заново.`;
          }
        } catch {
          // Ignore parse error
        }
        throw new Error(errorMsg);
      };
  
      const data = await response.json();
      
      setChatId(data.chat_id);
      const aiMsg: Message = {
        role: "assistant",
        content: data.content,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: unknown) {
      console.error("Chat Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Ошибка связи с сервером";
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: errorMessage, 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] font-sans">
      {!isOpen && !isClosing && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-2xl border border-white/10 bg-white p-4 text-black shadow-[0_20px_70px_rgba(0,0,0,0.35)] transition hover:bg-zinc-200 active:scale-95"
          type="button"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {(isOpen || isClosing) && (
        <div
          className="flex h-[500px] w-[min(350px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0b0c] shadow-[0_20px_70px_rgba(0,0,0,0.35)] animate-scale-in transition-all duration-200"
          style={{
            opacity: isClosing ? 0 : 1,
            transform: isClosing ? "translateY(10px) scale(0.98)" : "translateY(0) scale(1)",
          }}
        >


          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-white">
              <Bot className="text-zinc-300" size={20} />
              <span className="select-none font-semibold">Ассистент CraftSigns</span>
            </div>
            <button
              onClick={() => {
                close();
              }}
              className="text-zinc-500 transition hover:text-white"
              type="button"
            >
              <X size={20}/>
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="mt-10 text-center text-sm leading-6 text-zinc-500">
                Привет! Я помогу рассчитать стоимость вывески или отвечу на вопросы.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === "user" 
                    ? "bg-white text-black rounded-tr-md" 
                    : "border border-white/10 bg-white/[0.05] text-white rounded-tl-md"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.05] p-3 text-zinc-400 animate-pulse">
                  Печатает...
                </div>
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 bg-white/[0.03] p-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ваш вопрос..."
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-2xl bg-white p-2 text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
