import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { resolvePreset, defaultPresetId } from "../botPresets";
import { useAuth } from "../hooks/useAuth.jsx";
import { apiBase } from "../utils/api.js";
import { getDashboardPath } from "../utils/roles.js";

const themeMap = {
  indigo: {
    gradient: "from-indigo-50 to-indigo-200",
    header: "bg-indigo-600 text-white",
    userBubble: "bg-indigo-500 text-white",
    button: "bg-indigo-600 hover:bg-indigo-700",
    focus: "focus:ring-indigo-400",
  },
  orange: {
    gradient: "from-orange-50 to-orange-200",
    header: "bg-orange-500 text-white",
    userBubble: "bg-orange-400 text-white",
    button: "bg-orange-500 hover:bg-orange-600",
    focus: "focus:ring-orange-400",
  },
  blue: {
    gradient: "from-blue-50 to-blue-200",
    header: "bg-blue-600 text-white",
    userBubble: "bg-blue-500 text-white",
    button: "bg-blue-600 hover:bg-blue-700",
    focus: "focus:ring-blue-400",
  },
  rose: {
    gradient: "from-rose-50 to-rose-200",
    header: "bg-rose-600 text-white",
    userBubble: "bg-rose-500 text-white",
    button: "bg-rose-600 hover:bg-rose-700",
    focus: "focus:ring-rose-400",
  },
  emerald: {
    gradient: "from-emerald-50 to-emerald-200",
    header: "bg-emerald-600 text-white",
    userBubble: "bg-emerald-500 text-white",
    button: "bg-emerald-600 hover:bg-emerald-700",
    focus: "focus:ring-emerald-400",
  },
  purple: {
    gradient: "from-purple-50 to-purple-200",
    header: "bg-purple-600 text-white",
    userBubble: "bg-purple-500 text-white",
    button: "bg-purple-600 hover:bg-purple-700",
    focus: "focus:ring-purple-400",
  },
};

const buildIntro = (presetConfig) => {
  const descriptor = presetConfig.description
    ? `${presetConfig.description}`
    : "How can I help you today?";
  return `Hi there! I'm your ${presetConfig.displayName}. ${descriptor}`;
};

export default function ChatUI({
  preset = defaultPresetId,
  variant = "standalone",
  title,
  className = "",
}) {
  const presetConfig = resolvePreset(preset);
  const theme = themeMap[presetConfig.theme] ?? themeMap.indigo;
  const isStandalone = variant === "standalone";
  const { token, user } = useAuth();

  const [messages, setMessages] = useState(() => [
    { sender: "bot", text: buildIntro(presetConfig) },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const nextPreset = resolvePreset(preset);
    setMessages([{ sender: "bot", text: buildIntro(nextPreset) }]);
    setInput("");
  }, [preset]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const trimmed = input.trim();
    const userMessage = { sender: "user", text: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          preset: presetConfig.id,
          messages: updatedMessages,
          rag: {
            enabled: Boolean(presetConfig.ragCollection),
            collection: presetConfig.ragCollection ?? null,
          },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error || "Chat request failed");
      }

      const data = await response.json();
      console.log("OpenAI response:", data);

      const rawReply = data.choices?.[0]?.message?.content || "No response.";
      const botReply = rawReply.replace(/<think>[\s\S]*?<\/think>/, "").trim();

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("Chat error: ", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: `Could not reach chatbot: ${error.message}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const embeddedDimensions =
    "w-full min-h-[480px] sm:min-h-[540px] lg:min-h-[620px] max-h-[80svh] sm:max-h-[85svh]";
  const standaloneDimensions = "w-full max-w-[700px] min-h-[70svh] sm:min-h-[760px] sm:h-[900px]";

  const panel = (
    <div
      className={`w-full overflow-hidden bg-white shadow-xl rounded-2xl flex flex-col ${
        isStandalone ? standaloneDimensions : embeddedDimensions
      }`}
    >
      {!isStandalone && (
        <div className="px-4 pt-4 pb-0">
          <Link
            to={getDashboardPath(user?.role)}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-white ${theme.button}`}
          >
            Back to Dashboard
          </Link>
        </div>
      )}
      <div
          className={`${theme.header} p-4 ${isStandalone ? "rounded-t-2xl" : "mt-3 mx-4 rounded-t-xl"} text-base sm:text-lg font-semibold flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between`}
      >
        <span>{title || presetConfig.displayName}</span>
        <span className="text-xs font-normal opacity-80">
          Mode: {presetConfig.id}
        </span>
      </div>
      <div className={`${isStandalone ? "px-4" : "px-4 mx-4"} py-2 text-sm text-gray-500 border-b`}>
        {presetConfig.description}
      </div>
      <div className={`min-h-0 flex-1 overflow-y-auto ${isStandalone ? "p-4" : "px-4 mx-4 py-4"} space-y-3`}>
        {messages.map((msg, i) => (
          <div
            key={`${msg.sender}-${i}`}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[95%] text-base sm:text-[18px] leading-relaxed ${
                msg.sender === "user"
                  ? theme.userBubble
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ ...props }) => (
                    <p className="prose prose-sm max-w-none" {...props} />
                  ),
                  ul: ({ ...props }) => (
                    <ul
                      className="prose prose-sm max-w-none list-disc pl-4"
                      {...props}
                    />
                  ),
                  ol: ({ ...props }) => (
                    <ol
                      className="prose prose-sm max-w-none list-decimal pl-4"
                      {...props}
                    />
                  ),
                  h3: ({ ...props }) => (
                    <h3
                      className="prose prose-sm font-semibold mt-2"
                      {...props}
                    />
                  ),
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <div className={`${isStandalone ? "p-3" : "p-3 mx-4 mb-4"} border-t flex flex-col gap-2 sm:flex-row sm:items-center`}>
        <input
          className={`w-full flex-1 border rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 ${theme.focus}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask your ${presetConfig.displayName}...`}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={isSending}
          className={`${theme.button} w-full sm:w-auto text-white px-4 py-2 rounded-xl font-medium transition disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );

  if (isStandalone) {
    return (
      <div
        className={`min-h-[100svh] bg-linear-to-br ${theme.gradient} flex items-center justify-center p-3 sm:p-4 ${className}`}
      >
        {panel}
      </div>
    );
  }

  return <div className={className}>{panel}</div>;
}
