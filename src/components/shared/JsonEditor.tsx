import { useState, useEffect } from 'react';
import { Check, X, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface JsonEditorProps {
  value: unknown;
  onChange?: (value: unknown) => void;
  readOnly?: boolean;
  label?: string;
}

export function JsonEditor({ value, onChange, readOnly = false, label }: JsonEditorProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setText(JSON.stringify(value, null, 2));
      setError(null);
    } catch (e) {
      setText('');
      setError('Invalid JSON');
    }
  }, [value]);

  const handleChange = (newText: string) => {
    setText(newText);

    try {
      const parsed = JSON.parse(newText);
      setError(null);
      onChange?.(parsed);
    } catch (e) {
      setError('Invalid JSON syntax');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      // Keep current text if invalid
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            {!readOnly && (
              <Button type="button" variant="ghost" size="sm" onClick={handleFormat}>
                Format
              </Button>
            )}
          </div>
        </div>
      )}

      <Textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        readOnly={readOnly}
        className="min-h-[300px] font-mono text-sm"
        placeholder="{}"
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
