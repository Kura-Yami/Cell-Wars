import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GameCodeDisplay({ code }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-body text-muted-foreground uppercase tracking-widest">Game Code</p>
      <div className="flex items-center gap-3 bg-card border-2 border-primary/20 rounded-xl px-6 py-3 shadow-lg">
        <span className="font-heading text-4xl md:text-5xl tracking-[0.3em] text-foreground font-bold">
          {code}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="ml-2 text-muted-foreground hover:text-primary"
        >
          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}