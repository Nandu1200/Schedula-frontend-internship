"use client";

import { useEffect, useRef, useState } from "react";
import { doctors as mockDoctors } from "@/lib/mock-data/doctors";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          key={`bold-${index}`}
          className="font-semibold text-slate-900"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

function renderAssistantContent(content: string) {
  const lines = content.split("\n");

  return lines.map((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return <div key={`space-${index}`} className="h-2" />;
    }

    const bulletMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
    const numberedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);

    if (bulletMatch || numberedMatch) {
      const text = bulletMatch?.[1] ?? numberedMatch?.[1] ?? "";

      return (
        <div
          key={`list-${index}`}
          className="flex items-start gap-2"
        >
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
          <span>{renderInlineMarkdown(text)}</span>
        </div>
      );
    }

    return (
      <p key={`line-${index}`}>
        {renderInlineMarkdown(trimmedLine)}
      </p>
    );
  });
}

export default function SchedulaAICareAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! 👋 I’m Schedula AI Care Assistant. How can I help you with your healthcare or appointment-related questions?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomMessageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomMessageRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
    };

    const conversationHistory = [...messages, userMessage];

    setMessages(conversationHistory);
    setMessage("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const storedAppointments = localStorage.getItem("appointments");

      let appointments: Array<Record<string, unknown>> = [];

      if (storedAppointments) {
        try {
          const parsedAppointments = JSON.parse(storedAppointments);

          if (Array.isArray(parsedAppointments)) {
            appointments = parsedAppointments.map((appointment) => ({
              id: appointment.id,
              patientName: appointment.patient?.name,
              clinician: appointment.clinician,
              specialty: appointment.specialty,
              startsAt: appointment.startsAt,
              durationMinutes: appointment.durationMinutes,
              status: appointment.status,
              reason: appointment.reason,
              room: appointment.room,
            }));
          }
        } catch {
          appointments = [];
        }
      }

      const storedDoctor = localStorage.getItem("registeredDoctor");

      let registeredDoctor: Record<string, unknown> | null = null;

      if (storedDoctor) {
        try {
          const parsedDoctor = JSON.parse(storedDoctor);

          if (
            parsedDoctor &&
            typeof parsedDoctor === "object" &&
            !Array.isArray(parsedDoctor)
          ) {
            registeredDoctor = parsedDoctor as Record<string, unknown>;
          }
        } catch {
          registeredDoctor = null;
        }
      }

      const doctors: Array<Record<string, unknown>> = [
        ...mockDoctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
          qualification: doctor.qualification,
          experienceYears: doctor.experienceYears,
          hospital: doctor.hospital,
          location: doctor.location,
          consultationFee: doctor.consultationFee,
        })),
      ];

      if (
        registeredDoctor &&
        !doctors.some((doctor) => doctor.id === registeredDoctor.id)
      ) {
        doctors.push({
          id: registeredDoctor.id,
          name: registeredDoctor.name,
          specialty: registeredDoctor.specialty,
          qualification: registeredDoctor.qualification,
          experienceYears: registeredDoctor.experienceYears,
          hospital: registeredDoctor.hospital,
          location: registeredDoctor.location,
          consultationFee: registeredDoctor.consultationFee,
        });
      }

      console.log("AI Doctors:", doctors);
      console.log("AI Appointments:", appointments);
      console.log("AI Conversation:", conversationHistory);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          doctors,
          appointments,
          history: conversationHistory.map((chatMessage) => ({
            role: chatMessage.role,
            content: chatMessage.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to get AI response."
        );
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data?.response ||
          "Sorry, I could not generate a response.",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("AI chat error:", error);

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Sorry, I’m unable to respond right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          "Hello! 👋 I’m Schedula AI Care Assistant. How can I help you with your healthcare or appointment-related questions?",
      },
    ]);
    setMessage("");

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleMessageChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMessage(event.target.value);
    requestAnimationFrame(resizeTextarea);
  };

  const handlePaste = () => {
    requestAnimationFrame(resizeTextarea);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="fixed bottom-5 right-5 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-label="Open Schedula AI Care Assistant"
      >
        ✨
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-[9999] flex h-[520px] w-[calc(100vw-2.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-emerald-600 px-4 py-3 text-white">
            <div>
              <h2 className="font-semibold">Schedula AI Care</h2>
              <p className="text-xs text-emerald-100">
                Healthcare Assistant
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold transition hover:bg-emerald-700"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-2 py-1 text-xl transition hover:bg-emerald-700"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4"
          >
            {messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={`flex ${
                  chatMessage.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    chatMessage.role === "user"
                      ? "rounded-br-sm bg-emerald-600 text-white"
                      : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {chatMessage.role === "assistant"
                    ? renderAssistantContent(chatMessage.content)
                    : chatMessage.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                    <span className="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                    <span className="size-2 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomMessageRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Ask a healthcare question..."
                disabled={isLoading}
                rows={1}
                className="max-h-[120px] min-h-[42px] min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
              For general healthcare information only. Not a substitute for
              professional medical advice.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
