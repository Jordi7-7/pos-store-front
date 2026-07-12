import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { FolderPlus, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const CategoriesTab: React.FC = () => {
  const { categories, createCategory, isCreating } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      toast.success('¡Categoría creada con éxito!');
    } catch (err) {
      console.error(err);
      toast.error('Error al crear la categoría.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Formulario de Creación */}
      <div className="lg:col-span-2 bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm h-fit">
        <div className="border-b border-border-card pb-3">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-primary" />
            <span>Crear Nueva Categoría</span>
          </h4>
          <p className="text-[11px] text-neutral mt-0.5">Agrega clasificaciones generales para organizar tus productos.</p>
        </div>

        <form onSubmit={handleCreateCategorySubmit} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            required
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nombre de la categoría (ej. Calzado, Electrónica...)" 
            className="flex-1 bg-bg-dark border border-border-card rounded-xl py-2.5 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary" 
          />
          <button 
            type="submit" 
            disabled={isCreating}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Registrar Categoría</span>
          </button>
        </form>
      </div>

      {/* Lista de Categorías Activas */}
      <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-border-card pb-2">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wide">Categorías Activas ({categories.length})</h4>
          <p className="text-[11px] text-neutral mt-0.5">Categorías registradas en tu sucursal / tenant.</p>
        </div>

        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className="px-3 py-1.5 bg-bg-dark/60 border border-border-card rounded-lg text-xs text-secondary font-medium shadow-sm transition-all hover:border-primary/20"
              >
                {cat.name}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-neutral italic">No hay categorías registradas en el sistema.</p>
        )}
      </div>

    </div>
  );
};
export default CategoriesTab;
