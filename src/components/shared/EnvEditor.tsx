import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface EnvVariable {
  key: string;
  value: string;
}

interface EnvEditorProps {
  value: EnvVariable[];
  onChange: (value: EnvVariable[]) => void;
  readOnly?: boolean;
}

export function EnvEditor({ value, onChange, readOnly = false }: EnvEditorProps) {
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});

  const handleAdd = () => {
    onChange([...value, { key: '', value: '' }]);
  };

  const handleRemove = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const handleChange = (index: number, field: 'key' | 'value', newFieldValue: string) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], [field]: newFieldValue };
    onChange(newValue);
  };

  const toggleShow = (index: number) => {
    setShowValues((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Environment Variables</Label>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Variable
          </Button>
        )}
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">No environment variables defined.</p>
      ) : (
        <div className="space-y-2">
          {value.map((env, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="KEY"
                value={env.key}
                onChange={(e) => handleChange(index, 'key', e.target.value)}
                className="flex-1 font-mono text-sm"
                readOnly={readOnly}
              />
              <div className="relative flex-[2]">
                <Input
                  placeholder="value"
                  value={env.value}
                  onChange={(e) => handleChange(index, 'value', e.target.value)}
                  type={showValues[index] ? 'text' : 'password'}
                  className="pr-10 font-mono text-sm"
                  readOnly={readOnly}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => toggleShow(index)}
                >
                  {showValues[index] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Values are stored locally and passed to the server process. Use for API keys, tokens, etc.
      </p>
    </div>
  );
}
