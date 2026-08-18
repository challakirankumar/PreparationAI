'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n/use-language';
import { Languages } from 'lucide-react';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <Languages className={`h-3.5 w-3.5 text-stone-400 ${compact ? '' : 'mr-1'}`} />
      <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
        <SelectTrigger className={`h-7 text-xs border-stone-200 bg-transparent ${compact ? 'w-[88px]' : 'w-[120px]'}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map(l => (
            <SelectItem key={l.code} value={l.code}>
              <span className="mr-1">{l.flag}</span>
              <span className="text-xs">{l.nativeName}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
