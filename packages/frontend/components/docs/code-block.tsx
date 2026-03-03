"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={copyToClipboard}
        className="absolute right-4 top-4 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all opacity-0 group-hover:opacity-100 z-10"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-sp-blue" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <pre className="bg-muted p-6 rounded-xl overflow-x-auto text-sm border border-border">
        <code className={`language-${language} text-primary`}>{code}</code>
      </pre>
    </div>
  );
}
