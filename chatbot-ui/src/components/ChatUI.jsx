import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolvePreset, defaultPresetId } from "../botPresets";

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

const resolveApiBase = () => {
  const rawBase =
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.PROD ? "" : "http://localhost:5001")
  if (!rawBase) return ""
  return rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase
}

const apiBase = resolveApiBase()

export default function ChatUI({
  preset = defaultPresetId,
  variant = "standalone",
  title,
  className = "",
}) {
  const presetConfig = resolvePreset(preset);
  const theme = themeMap[presetConfig.theme] ?? themeMap.indigo;
  const isStandalone = variant === "standalone";

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
      const response = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: presetConfig.id, messages: updatedMessages }),
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

  const embeddedDimensions = "w-full min-h-[540px] lg:min-h-[620px] max-h-[85vh]";
  const standaloneDimensions = "w-[700px] h-[900px]";

  const panel = (
    <div
      className={`bg-white shadow-xl rounded-2xl flex flex-col ${
        isStandalone ? standaloneDimensions : embeddedDimensions
      }`}
    >
      <div
        className={`${theme.header} p-4 rounded-t-2xl text-lg font-semibold flex items-center justify-between`}
      >
        <span>{title || presetConfig.displayName}</span>
        <span className="text-xs font-normal opacity-80">
          Mode: {presetConfig.id}
        </span>
      </div>
      <div className="px-4 py-2 text-sm text-gray-500 border-b">
        {presetConfig.description}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={`${msg.sender}-${i}`}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[95%] text-[18px] leading-relaxed ${
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
      <div className="p-3 border-t flex items-center space-x-2">
        <input
          className={`flex-1 border rounded-xl px-3 py-2 text-md focus:outline-none focus:ring-2 ${theme.focus}`}
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
          className={`${theme.button} text-white px-4 py-2 rounded-xl font-medium transition disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );

  if (isStandalone) {
    return (
      <div
        className={`min-h-screen bg-linear-to-br ${theme.gradient} flex items-center justify-center p-4 ${className}`}
      >
        {panel}
      </div>
    );
  }

  return <div className={className}>{panel}</div>;
}
