import React, { useState } from 'react';
import { SettingsSubHeader } from './SettingsSubHeader';
import { Check, Pencil, Plus, Target, Trash2, X } from 'lucide-react';

interface ProjectCategoriesSettingsProps {
  categories: string[];
  /** Nombre de projets par catégorie (pour prévenir avant suppression) */
  usage: Record<string, number>;
  onAdd: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
  onBack: () => void;
}

/** Réglages : catégories de projets d'épargne, entièrement définies par l'utilisateur. */
export const ProjectCategoriesSettings: React.FC<ProjectCategoriesSettingsProps> = ({
  categories,
  usage,
  onAdd,
  onRename,
  onDelete,
  onBack,
}) => {
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName('');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <SettingsSubHeader title="Catégories de projets" onBack={onBack} />

      <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line space-y-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-fg-2 text-[11px] font-black uppercase tracking-wider mb-2">
            <Target className="w-3.5 h-3.5" />
            <span>Projets d'épargne</span>
          </div>
          <h2 className="text-xl font-black text-fg">Catégories de projets</h2>
          <p className="text-xs text-fg-muted mt-1">
            Créez vos propres catégories. Elles seront proposées quand vous créez un projet d'épargne.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder="Nouvelle catégorie"
            className="flex-1 min-w-0 bg-surface-2 border border-line-strong focus:border-brand rounded-2xl px-4 py-3 text-sm text-fg focus:outline-none"
          />
          <button
            type="button"
            onClick={add}
            disabled={!newName.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-brand text-brand-fg text-xs font-black disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Ajouter
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong p-6 text-center">
            <p className="text-sm font-bold text-fg">Aucune catégorie</p>
            <p className="text-xs text-fg-muted mt-1">Ajoutez-en une ci-dessus : à vous de définir vos catégories.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => {
              const isEditing = editing === cat;
              const count = usage[cat] || 0;
              return (
                <li key={cat} className="rounded-2xl bg-surface-2 border border-line px-3.5 py-2.5 flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            onRename(cat, editValue);
                            setEditing(null);
                          }
                        }}
                        className="flex-1 min-w-0 bg-surface border border-line-strong rounded-xl px-3 py-2 text-sm text-fg focus:outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onRename(cat, editValue);
                          setEditing(null);
                        }}
                        className="p-2.5 rounded-full text-success cursor-pointer"
                        aria-label="Valider"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEditing(null)} className="p-2.5 rounded-full text-fg-muted cursor-pointer" aria-label="Annuler">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-fg truncate">{cat}</p>
                        <p className="text-[10px] text-fg-muted">
                          {count === 0 ? 'Aucun projet' : `${count} projet${count > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(cat);
                          setEditValue(cat);
                        }}
                        className="p-2.5 rounded-full text-fg-muted hover:text-fg cursor-pointer"
                        aria-label={`Renommer ${cat}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (count === 0 || window.confirm(`« ${cat} » est utilisée par ${count} projet(s). Ils garderont ce nom de catégorie. Supprimer quand même ?`)) {
                            onDelete(cat);
                          }
                        }}
                        className="p-2.5 rounded-full text-fg-muted hover:text-rose-400 cursor-pointer"
                        aria-label={`Supprimer ${cat}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
