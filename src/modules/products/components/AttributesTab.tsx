import React, { useState } from 'react';
import { Settings, Plus, Loader2, Tag } from 'lucide-react';
import { useAttributes } from '../hooks/useAttributes';

export const AttributesTab: React.FC = () => {
  const { 
    attributes, 
    isLoading, 
    createAttribute, 
    isCreatingAttribute, 
    createAttributeValue, 
    isCreatingValue 
  } = useAttributes();

  const [attrName, setAttrName] = useState('');
  const [newValueMap, setNewValueMap] = useState<Record<string, string>>({});

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrName.trim()) return;
    try {
      await createAttribute(attrName.trim());
      setAttrName('');
    } catch (err) {
      console.error(err);
      alert('Error al crear el atributo.');
    }
  };

  const handleAddValue = async (attributeId: string) => {
    const valueText = newValueMap[attributeId]?.trim();
    if (!valueText) return;

    try {
      await createAttributeValue({ attributeId, value: valueText });
      setNewValueMap({
        ...newValueMap,
        [attributeId]: ''
      });
    } catch (err) {
      console.error(err);
      alert('Error al agregar el valor del atributo.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Left side: Create new Attribute */}
      <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm space-y-4 h-fit">
        <div className="border-b border-border-card pb-3">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Nuevo Atributo
          </h4>
          <p className="text-xs text-neutral mt-0.5">Define las características de variación (ej. Talla, Color, Material).</p>
        </div>

        <form onSubmit={handleCreateAttribute} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-neutral block font-bold uppercase tracking-wider">Nombre del Atributo</label>
            <input 
              type="text" 
              required
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              placeholder="Ej. Talla, Color, Material" 
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary"
            />
          </div>

          <button 
            type="submit" 
            disabled={isCreatingAttribute || !attrName.trim()}
            className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreatingAttribute ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Crear Atributo</span>
          </button>
        </form>
      </div>

      {/* Right side: List and add values */}
      <div className="lg:col-span-2 bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm space-y-5">
        <div className="border-b border-border-card pb-3">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wide">Atributos y Valores Configurados</h4>
          <p className="text-xs text-neutral">Administra los valores específicos de cada tipo de variación.</p>
        </div>

        {isLoading ? (
          <div className="h-40 flex flex-col items-center justify-center text-neutral gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Cargando atributos...</span>
          </div>
        ) : attributes.length === 0 ? (
          <div className="h-40 border border-dashed border-border-card rounded-xl flex items-center justify-center text-neutral text-xs">
            No tienes atributos registrados todavía.
          </div>
        ) : (
          <div className="space-y-4">
            {attributes.map((attr) => (
              <div key={attr.id} className="p-4 bg-bg-dark/20 border border-border-card rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-border-card/50 pb-2">
                  <span className="text-xs font-bold text-secondary uppercase flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    {attr.name}
                  </span>
                  <span className="text-[10px] text-neutral font-mono">ID: {attr.id.substring(0, 8)}...</span>
                </div>

                {/* Values list */}
                <div className="flex flex-wrap gap-1.5">
                  {attr.values && attr.values.length > 0 ? (
                    attr.values.map((v) => (
                      <span key={v.id} className="px-2.5 py-1 bg-bg-card border border-border-card rounded-lg text-xs text-secondary font-medium">
                        {v.value}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-neutral italic">Sin valores creados. Agrega uno abajo.</span>
                  )}
                </div>

                {/* Add new value form */}
                <div className="flex gap-2 pt-1.5">
                  <input 
                    type="text" 
                    placeholder="Nuevo valor (ej. Rojo, XL, Madera)"
                    value={newValueMap[attr.id] || ''}
                    onChange={(e) => setNewValueMap({
                      ...newValueMap,
                      [attr.id]: e.target.value
                    })}
                    className="flex-1 bg-bg-card border border-border-card rounded-lg px-3 py-1.5 text-xs text-secondary focus:outline-none focus:border-primary placeholder-neutral"
                  />
                  <button 
                    onClick={() => handleAddValue(attr.id)}
                    disabled={isCreatingValue || !newValueMap[attr.id]?.trim()}
                    className="bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    {isCreatingValue ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
