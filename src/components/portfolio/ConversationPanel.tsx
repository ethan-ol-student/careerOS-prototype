"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import {
  conversationFlow,
  restartPrompt,
  type ConversationStep,
} from "@/lib/portfolio/data";
import { cn } from "@/lib/utils";

interface Message {
  role: "ai" | "user";
  content: string;
}

interface ConversationPanelProps {
  onStepChange: (step: number) => void;
}

export default function ConversationPanel({ onStepChange }: ConversationPanelProps) {
  const { addItem } = usePortfolio();

  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: conversationFlow[0].aiPrompt },
  ]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const currentStep: ConversationStep = isComplete
    ? restartPrompt
    : conversationFlow[currentStepIdx];

  const handleSend = async () => {
    if (!userInput.trim() || isThinking) return;
    const userMessage = userInput.trim();
    setUserInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    onStepChange(1);

    setIsThinking(true);
    await new Promise((r) => setTimeout(r, 1500));

    onStepChange(2);
    addItem(currentStep.targetSection, userMessage);
    await new Promise((r) => setTimeout(r, 500));

    onStepChange(3);
    setMessages((prev) => [...prev, { role: "ai", content: currentStep.followUp }]);
    setIsThinking(false);

    setTimeout(() => {
      const nextIdx = currentStepIdx + 1;
      if (nextIdx < conversationFlow.length) {
        setCurrentStepIdx(nextIdx);
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: conversationFlow[nextIdx].aiPrompt },
        ]);
      } else if (!isComplete) {
        setIsComplete(true);
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: restartPrompt.aiPrompt },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: restartPrompt.aiPrompt },
        ]);
      }
      onStepChange(0);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-3 flex h-[600px] flex-col rounded-2xl">
      <div className="border-border/40 flex items-center gap-3 border-b px-5 py-4">
        <div className="bg-luminous/15 flex size-9 items-center justify-center rounded-full">
          <Sparkles className="text-luminous size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Portfolio assistant</p>
          <p className="text-muted-foreground text-xs">AI-powered, learns as you go</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-5"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] px-4 py-2.5",
                msg.role === "user"
                  ? "bg-luminous rounded-2xl rounded-br-md text-white"
                  : "bg-card/60 border-border/40 rounded-2xl rounded-bl-md border text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-card/60 border-border/40 flex items-center gap-1 rounded-2xl rounded-bl-md border px-4 py-3">
              <div
                className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-border/40 border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentStep.placeholder}
            disabled={isThinking}
            className="bg-background/60 border-border focus:border-luminous focus:ring-luminous/30 flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!userInput.trim() || isThinking}
            className="bg-luminous hover:bg-luminous-soft flex items-center justify-center rounded-lg px-4 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
