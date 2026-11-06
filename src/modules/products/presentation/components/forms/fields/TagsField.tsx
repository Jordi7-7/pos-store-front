import React, { useState } from 'react';
import { Check, Loader2, Plus, X } from 'lucide-react';
import type { TagEntity as Tag } from '../../../../domain/entities/catalog.entity';
import { canCreateTag, filterTags } from '../../../../domain/rules/tag-search';

interface TagsFieldProps {
  allTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string) => Promise<Tag>;
  isCreatingTag?: boolean;
}

/** Etiquetas del producto: las elegidas, búsqueda y alta de una nueva sin salir del formulario. Guarda su propio texto de búsqueda. */
export const TagsField: React.FC<TagsFieldProps> = ({ allTags, selectedTagIds, onToggleTag, onCreateTag, isCreatingTag = false }) => {
  const [tagInput, setTagInput] = useState('');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const filteredTags = filterTags(allTags, tagInput);
  const canCreate = canCreateTag(allTags, tagInput);

  const handleCreateTag = async () => {
    const name = tagInput.trim();
    if (!name) return;
    const newTag = await onCreateTag(name);
    onToggleTag(newTag.id);
    setTagInput('');
    setTagDropdownOpen(false);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canCreate) handleCreateTag();
    }
    if (e.key === 'Escape') setTagDropdownOpen(false);
  };

  return (
<div>
 <label className="text-xs font-bold block mb-1.5">
    Tags
  </label>
  {selectedTagIds.length > 0 && (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {selectedTagIds.map((id) => {
        const tag = allTags.find((t) => t.id === id);
        if (!tag) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/30"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => onToggleTag(id)}
              className="hover:text-destructive transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        );
      })}
    </div>
  )}
  <div className="relative">
    <input
      type="text"
      value={tagInput}
      onChange={(e) => { setTagInput(e.target.value); setTagDropdownOpen(true); }}
      onFocus={() => setTagDropdownOpen(true)}
      onBlur={() => setTimeout(() => setTagDropdownOpen(false), 150)}
      onKeyDown={handleTagInputKeyDown}
      placeholder="Buscar o crear tag..."
      className="w-full text-xs h-9 bg-background border border-input rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-ring"
    />
    {tagDropdownOpen && (filteredTags.length > 0 || canCreate) && (
      <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl max-h-44 overflow-y-auto">
        {filteredTags.map((tag) => {
          const selected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onMouseDown={() => { onToggleTag(tag.id); setTagInput(''); setTagDropdownOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-accent transition-colors ${
                selected ? 'text-primary font-semibold' : 'text-foreground'
              }`}
            >
              {tag.name}
              {selected && <Check className="w-3 h-3" />}
            </button>
          );
        })}
        {canCreate && (
          <button
            type="button"
            onMouseDown={handleCreateTag}
            disabled={isCreatingTag}
            className="w-full text-left px-3 py-2 text-xs text-primary font-semibold flex items-center gap-1.5 hover:bg-accent transition-colors border-t border-border"
          >
            {isCreatingTag ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Crear "{tagInput.trim()}"
          </button>
        )}
      </div>
    )}
  </div>
</div>
  );
};
