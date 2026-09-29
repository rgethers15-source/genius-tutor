import { useState } from 'react';
import type { AvatarCategory } from '../types';
import { AVATARS } from '../data/avatars';

const CATEGORIES: { value: AvatarCategory; label: string }[] = [
  { value: 'pixar', label: 'Animated Friends' },
  { value: 'human', label: 'Human Mentors' },
  { value: 'anime', label: 'Anime Guides' },
];

export function AvatarPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [category, setCategory] = useState<AvatarCategory>('pixar');
  const shown = AVATARS.filter((a) => a.category === category);

  return (
    <div>
      <div className="row" style={{ marginBottom: 18 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`chip ${category === c.value ? 'on' : ''}`}
            onClick={() => setCategory(c.value)}
            type="button"
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid cols-3">
        {shown.map((a) => (
          <div
            key={a.id}
            className={`card clickable avatar-tile ${selectedId === a.id ? 'selected' : ''}`}
            onClick={() => onSelect(a.id)}
          >
            <div className="avatar-glyph" style={{ background: `${a.accent}33` }}>
              {a.glyph}
            </div>
            <div className="avatar-name">{a.name}</div>
            <div className="avatar-personality">{a.personality}</div>
            <span className="pill">{a.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
