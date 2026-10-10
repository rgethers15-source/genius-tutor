import { useEffect } from 'react';
import { setTutorTheme } from './focusMusic';
export function useTutorTheme(id: string | undefined, enabled: boolean | undefined) {
 useEffect(() => { setTutorTheme(enabled === false ? null : id ?? null); return () => setTutorTheme(null); }, [id, enabled]);
}
