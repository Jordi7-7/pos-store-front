import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  emptyMessage = 'No se encontraron resultados'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full text-secondary">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
        className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 px-3.5 text-xs text-left flex items-center justify-between focus:outline-none focus:border-primary transition-all hover:bg-bg-dark/80"
      >
        <span className={selectedOption ? 'text-secondary' : 'text-neutral'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-bg-card border border-border-card rounded-xl shadow-2xl p-2 space-y-2 animate-scale-up max-h-60 flex flex-col">
          {/* Search bar inside select */}
          <div className="relative flex items-center shrink-0">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-bg-dark border border-border-card rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-secondary placeholder-neutral focus:outline-none focus:border-primary"
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1 space-y-0.5 max-h-40 pr-0.5">
            {/* Default/Empty Option */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] font-medium flex items-center justify-between hover:bg-bg-dark transition-all text-neutral"
            >
              <span>{placeholder}</span>
              {value === '' && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] font-medium flex items-center justify-between hover:bg-bg-dark transition-all ${
                      isSelected ? 'text-primary bg-primary/5 font-semibold' : 'text-secondary'
                    }`}
                  >
                    <span>{opt.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-3 text-[10px] text-neutral">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
