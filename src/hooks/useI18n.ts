import { useState, useEffect } from 'react';

export type Language = 'fr' | 'en';

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.dashboard': { fr: 'Tableau de bord', en: 'Dashboard' },
  'nav.play': { fr: 'Jouer', en: 'Play' },
  'nav.stats': { fr: 'Statistiques', en: 'Statistics' },
  'nav.history': { fr: 'Historique', en: 'History' },
  'nav.settings': { fr: 'Paramètres', en: 'Settings' },

  // Play page
  'play.hole': { fr: 'Trou', en: 'Hole' },
  'play.strokes': { fr: 'Coups sur ce trou', en: 'Strokes on this hole' },
  'play.addStroke': { fr: '+1', en: '+1' },
  'play.undo': { fr: 'Annuler', en: 'Undo' },
  'play.finish': { fr: 'Finir', en: 'Finish' },
  'play.mic': { fr: 'Micro', en: 'Mic' },
  'play.coach': { fr: 'Coach', en: 'Coach' },
  'play.scorecard': { fr: 'Scorecard', en: 'Scorecard' },
  'play.game': { fr: 'Jeu', en: 'Game' },
  'play.lastShot': { fr: 'Dernier coup', en: 'Last shot' },
  'play.noShots': { fr: 'Aucun coup enregistré sur ce trou', en: 'No shots recorded on this hole' },

  // GPS
  'gps.connected': { fr: 'GPS OK', en: 'GPS OK' },
  'gps.disconnected': { fr: 'GPS OFF', en: 'GPS OFF' },
  'gps.loading': { fr: 'GPS...', en: 'GPS...' },

  // Voice commands
  'voice.listening': { fr: 'Écoute activée', en: 'Listening' },
  'voice.stopped': { fr: 'Écoute désactivée', en: 'Listening stopped' },
  'voice.instructions': { fr: 'Dites "play", "finish" ou "undo"', en: 'Say "play", "finish" or "undo"' },

  // Toasts
  'toast.strokeAdded': { fr: '+1 enregistré', en: '+1 recorded' },
  'toast.strokeUndo': { fr: 'Coup annulé', en: 'Stroke undone' },
  'toast.holeFinished': { fr: 'Trou terminé', en: 'Hole finished' },
  'toast.gameFinished': { fr: 'Partie terminée !', en: 'Game finished!' },
  'toast.error': { fr: 'Erreur', en: 'Error' },

  // Coach
  'coach.title': { fr: 'Coach IA', en: 'AI Coach' },
  'coach.tab': { fr: 'Coach', en: 'Coach' },
  'coach.rules': { fr: 'Règles', en: 'Rules' },
  'coach.placeholder': { fr: 'Demandez conseil...', en: 'Ask for advice...' },
  'coach.rulesPlaceholder': { fr: 'Question sur les règles...', en: 'Rules question...' },

  // Settings
  'settings.language': { fr: 'Langue', en: 'Language' },
  'settings.units': { fr: 'Unités', en: 'Units' },
  'settings.gpsAccuracy': { fr: 'Seuil GPS (m)', en: 'GPS Threshold (m)' },

  // Dashboard
  'dashboard.newGame': { fr: 'Nouvelle partie', en: 'New Game' },
  'dashboard.ongoing': { fr: 'En cours', en: 'Ongoing' },
  'dashboard.completed': { fr: 'Achevées', en: 'Completed' },
  'dashboard.resume': { fr: 'Reprendre', en: 'Resume' },
  'dashboard.details': { fr: 'Voir détails', en: 'View details' },
};

export function useI18n() {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get from localStorage first
    const saved = localStorage.getItem('highswing_language');
    if (saved && (saved === 'fr' || saved === 'en')) {
      return saved;
    }
    
    // Auto-detect from browser
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('fr') ? 'fr' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('highswing_language', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.fr || key;
  };

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return {
    language,
    t,
    changeLanguage
  };
}