import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewAttributeFormProps {
  isCreating: boolean;
  onCreate: (name: string) => Promise<void>;
}

/** Crea un atributo nuevo del catálogo sin salir de la pantalla del producto. */
export const NewAttributeForm: React.FC<NewAttributeFormProps> = ({ isCreating, onCreate }) => {
  const [name, setName] = useState('');
  const submit = async () => {
    const text = name.trim();
    if (!text) return;
    await onCreate(text);
    setName('');
  };

  return (
    <div className="flex animate-in flex-col items-stretch gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 duration-200 fade-in slide-in-from-top-2 sm:flex-row sm:items-center">
      <div className="flex-1">
        <span className="mb-1 block text-xs font-bold text-primary">Nuevo atributo</span>
        <Input
          placeholder="Nombre del atributo (p. ej. Talla, Color, Material)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void submit();
            }
          }}
          className="h-9 bg-background text-xs"
          autoFocus
        />
      </div>
      <Button type="button" size="sm" onClick={() => void submit()} disabled={isCreating || !name.trim()} className="h-9 shrink-0 cursor-pointer self-end px-4 text-xs font-bold shadow-xs">
        {isCreating ? <Loader2 className="size-3.5 animate-spin" /> : 'Crear atributo'}
      </Button>
    </div>
  );
};
