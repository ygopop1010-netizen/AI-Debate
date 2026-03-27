import { Preset } from '../types';
import { PRESETS } from '../lib/presets';

interface Props {
  onSelect: (preset: Preset) => void;
  customPresets: Preset[];
  onDeleteCustom: (id: string) => void;
}

export default function PresetSelector({ onSelect, customPresets, onDeleteCustom }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-slate-400 mb-3">빠른 시작 — 프리셋 선택</h3>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className="px-4 py-2 rounded-lg bg-navy-800 border border-navy-700 text-slate-300
                       hover:border-amber-500 hover:text-amber-400 transition-all text-sm"
          >
            {preset.emoji} {preset.label}
          </button>
        ))}
        {customPresets.map((preset) => (
          <div key={preset.id} className="relative group">
            <button
              onClick={() => onSelect(preset)}
              className="px-4 py-2 rounded-lg bg-navy-800 border border-emerald-700 text-slate-300
                         hover:border-emerald-500 hover:text-emerald-400 transition-all text-sm"
            >
              ⭐ {preset.label}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteCustom(preset.id); }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs
                         hidden group-hover:flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
