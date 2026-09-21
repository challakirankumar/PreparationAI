// ============================================================================
// Internationalization (i18n) — Supported Languages + String Catalog
// ----------------------------------------------------------------------------
// Supports 4 languages:
//   - English (en)  — default
//   - Hindi (hi)
//   - Spanish (es)
//   - French (fr)
//
// The catalog covers:
//   - Common UI labels (nav, buttons, badges)
//   - Dashboard headings
//   - AI mentor prompts (so the mentor responds in the student's chosen language)
//
// Note: Translation is partial — we cover the high-frequency strings students
// see every session. Full app translation would expand this catalog.
// ============================================================================

export type Language = 'en' | 'hi' | 'es' | 'fr';

export interface LanguageMeta {
  code: Language;
  nativeName: string;
  englishName: string;
  flag: string;
  // Direction: 'ltr' or 'rtl'
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', flag: '🇮🇳', dir: 'ltr' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', nativeName: 'Français', englishName: 'French', flag: '🇫🇷', dir: 'ltr' },
];

// ---------------------------------------------------------------------------
// String keys — strongly typed to catch missing translations
// ---------------------------------------------------------------------------

export type StringKey =
  // Nav
  | 'nav.dashboard' | 'nav.mockExam' | 'nav.studyMaterial' | 'nav.analytics'
  | 'nav.planner' | 'nav.mentor' | 'nav.doubtSolver' | 'nav.pyqTrends'
  | 'nav.handwrittenGrader' | 'nav.battleArena' | 'nav.errorJournal'
  | 'nav.parentDashboard' | 'nav.institution' | 'nav.teacher'
  | 'nav.guardrail' | 'nav.settings' | 'nav.career' | 'nav.university'
  | 'nav.scholarship' | 'nav.counsellor' | 'nav.discover' | 'nav.weaknessRadar'
  // Groups
  | 'navGroup.core' | 'navGroup.aiAgents' | 'navGroup.institution' | 'navGroup.competition' | 'navGroup.family' | 'navGroup.explore'
  // Common buttons
  | 'btn.start' | 'btn.submit' | 'btn.cancel' | 'btn.save' | 'btn.reset' | 'btn.refresh'
  | 'btn.continue' | 'btn.back' | 'btn.next' | 'btn.previous' | 'btn.skip'
  | 'btn.viewAll' | 'btn.viewDetails' | 'btn.tryAgain' | 'btn.logout' | 'btn.login'
  // Dashboard
  | 'dash.welcome' | 'dash.liveCountdown' | 'dash.weakAreas' | 'dash.examNews'
  | 'dash.todayPlan' | 'dash.streak' | 'dash.studyHours' | 'dash.mocksTaken'
  // Mentor
  | 'mentor.welcome' | 'mentor.placeholder' | 'mentor.socraticMode'
  // Generic
  | 'common.loading' | 'common.error' | 'common.success' | 'common.noData'
  | 'common.search' | 'common.filter' | 'common.all' | 'common.none' | 'common.you'
  | 'common.subject' | 'common.topic' | 'common.difficulty' | 'common.score'
  | 'common.accuracy' | 'common.time' | 'common.marks' | 'common.percentile';

// ---------------------------------------------------------------------------
// Translation catalog
// ---------------------------------------------------------------------------

type TranslationDict = Partial<Record<StringKey, string>>;

const ENGLISH: TranslationDict = {
  'nav.dashboard': 'Dashboard',
  'nav.mockExam': 'Mock Exam',
  'nav.studyMaterial': 'Study Material',
  'nav.analytics': 'Analytics',
  'nav.planner': 'Planner',
  'nav.mentor': 'AI Mentor v1',
  'nav.doubtSolver': 'Doubt Solver',
  'nav.pyqTrends': 'PYQ Trends',
  'nav.handwrittenGrader': 'Handwritten Grader',
  'nav.battleArena': 'Battle Arena',
  'nav.errorJournal': 'Error Journal',
  'nav.parentDashboard': 'Parent Dashboard',
  'nav.institution': 'Institute Dashboard',
  'nav.teacher': 'Teacher View',
  'nav.guardrail': 'Guardrail Dashboard',
  'nav.settings': 'Settings',
  'nav.career': 'Career Guide',
  'nav.university': 'Universities',
  'nav.scholarship': 'Scholarships',
  'nav.counsellor': 'Wellness',
  'nav.discover': 'Discover',
  'nav.weaknessRadar': 'Weakness Radar',

  'navGroup.core': 'Core',
  'navGroup.aiAgents': 'AI Agents',
  'navGroup.institution': 'Institution',
  'navGroup.competition': 'Competition',
  'navGroup.family': 'Family',
  'navGroup.explore': 'Explore',

  'btn.start': 'Start',
  'btn.submit': 'Submit',
  'btn.cancel': 'Cancel',
  'btn.save': 'Save',
  'btn.reset': 'Reset',
  'btn.refresh': 'Refresh',
  'btn.continue': 'Continue',
  'btn.back': 'Back',
  'btn.next': 'Next',
  'btn.previous': 'Previous',
  'btn.skip': 'Skip',
  'btn.viewAll': 'View All',
  'btn.viewDetails': 'View Details',
  'btn.tryAgain': 'Try Again',
  'btn.logout': 'Logout',
  'btn.login': 'Login',

  'dash.welcome': 'Welcome back',
  'dash.liveCountdown': 'Live Countdown',
  'dash.weakAreas': 'Weak Areas',
  'dash.examNews': 'Exam News',
  'dash.todayPlan': 'Today\'s Plan',
  'dash.streak': 'Streak',
  'dash.studyHours': 'Study Hours',
  'dash.mocksTaken': 'Mocks Taken',

  'mentor.welcome': 'Hi! I\'m your AI mentor. How can I help you today?',
  'mentor.placeholder': 'Ask me anything about your studies…',
  'mentor.socraticMode': 'Socratic Mode',

  'common.loading': 'Loading…',
  'common.error': 'Something went wrong',
  'common.success': 'Success',
  'common.noData': 'No data available',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.all': 'All',
  'common.none': 'None',
  'common.you': 'You',
  'common.subject': 'Subject',
  'common.topic': 'Topic',
  'common.difficulty': 'Difficulty',
  'common.score': 'Score',
  'common.accuracy': 'Accuracy',
  'common.time': 'Time',
  'common.marks': 'Marks',
  'common.percentile': 'Percentile',
};

const HINDI: TranslationDict = {
  'nav.dashboard': 'डैशबोर्ड',
  'nav.mockExam': 'मॉक परीक्षा',
  'nav.studyMaterial': 'अध्ययन सामग्री',
  'nav.analytics': 'विश्लेषण',
  'nav.planner': 'प्लानर',
  'nav.mentor': 'एआई मेंटर',
  'nav.doubtSolver': 'संदेह समाधान',
  'nav.pyqTrends': 'PYQ रुझान',
  'nav.handwrittenGrader': 'हस्तलिखित ग्रेडर',
  'nav.battleArena': 'बैटल एरिना',
  'nav.errorJournal': 'त्रुटि जर्नल',
  'nav.parentDashboard': 'अभिभावक डैशबोर्ड',
  'nav.institution': 'संस्थान डैशबोर्ड',
  'nav.teacher': 'शिक्षक दृश्य',
  'nav.guardrail': 'गार्डरेल डैशबोर्ड',
  'nav.settings': 'सेटिंग्स',
  'nav.career': 'करियर गाइड',
  'nav.university': 'विश्वविद्यालय',
  'nav.scholarship': 'छात्रवृत्ति',
  'nav.counsellor': 'स्वास्थ्य',
  'nav.discover': 'खोज',
  'nav.weaknessRadar': 'कमजोरी रडार',

  'navGroup.core': 'मुख्य',
  'navGroup.aiAgents': 'एआई एजेंट',
  'navGroup.institution': 'संस्थान',
  'navGroup.competition': 'प्रतियोगिता',
  'navGroup.family': 'परिवार',
  'navGroup.explore': 'अन्वेषण',

  'btn.start': 'शुरू करें',
  'btn.submit': 'जमा करें',
  'btn.cancel': 'रद्द करें',
  'btn.save': 'सहेजें',
  'btn.reset': 'रीसेट',
  'btn.refresh': 'ताज़ा करें',
  'btn.continue': 'जारी रखें',
  'btn.back': 'वापस',
  'btn.next': 'अगला',
  'btn.previous': 'पिछला',
  'btn.skip': 'छोड़ें',
  'btn.viewAll': 'सभी देखें',
  'btn.viewDetails': 'विवरण देखें',
  'btn.tryAgain': 'पुनः प्रयास करें',
  'btn.logout': 'लॉग आउट',
  'btn.login': 'लॉगिन',

  'dash.welcome': 'वापसी पर स्वागत है',
  'dash.liveCountdown': 'लाइव काउंटडाउन',
  'dash.weakAreas': 'कमजोर क्षेत्र',
  'dash.examNews': 'परीक्षा समाचार',
  'dash.todayPlan': 'आज की योजना',
  'dash.streak': 'श्रृंखला',
  'dash.studyHours': 'अध्ययन घंटे',
  'dash.mocksTaken': 'दिए गए मॉक',

  'mentor.welcome': 'नमस्ते! मैं आपका एआई मेंटर हूं। मैं आज आपकी कैसे मदद कर सकता हूं?',
  'mentor.placeholder': 'अपनी पढ़ाई के बारे में कुछ भी पूछें…',
  'mentor.socraticMode': 'सुकराती मोड',

  'common.loading': 'लोड हो रहा है…',
  'common.error': 'कुछ गलत हो गया',
  'common.success': 'सफल',
  'common.noData': 'कोई डेटा उपलब्ध नहीं',
  'common.search': 'खोजें',
  'common.filter': 'फ़िल्टर',
  'common.all': 'सभी',
  'common.none': 'कोई नहीं',
  'common.you': 'आप',
  'common.subject': 'विषय',
  'common.topic': 'विषय-वस्तु',
  'common.difficulty': 'कठिनाई',
  'common.score': 'अंक',
  'common.accuracy': 'सटीकता',
  'common.time': 'समय',
  'common.marks': 'अंक',
  'common.percentile': 'प्रतिशतक',
};

const SPANISH: TranslationDict = {
  'nav.dashboard': 'Panel',
  'nav.mockExam': 'Examen de Práctica',
  'nav.studyMaterial': 'Material de Estudio',
  'nav.analytics': 'Análisis',
  'nav.planner': 'Planificador',
  'nav.mentor': 'Mentor IA',
  'nav.doubtSolver': 'Solucionador de Dudas',
  'nav.pyqTrends': 'Tendencias PYQ',
  'nav.handwrittenGrader': 'Calificador de Manuscritos',
  'nav.battleArena': 'Arena de Batalla',
  'nav.errorJournal': 'Diario de Errores',
  'nav.parentDashboard': 'Panel de Padres',
  'nav.institution': 'Panel de Institución',
  'nav.teacher': 'Vista de Profesor',
  'nav.guardrail': 'Panel de Seguridad',
  'nav.settings': 'Ajustes',
  'nav.career': 'Guía de Carreras',
  'nav.university': 'Universidades',
  'nav.scholarship': 'Becas',
  'nav.counsellor': 'Bienestar',
  'nav.discover': 'Descubrir',
  'nav.weaknessRadar': 'Radar de Debilidades',

  'navGroup.core': 'Principal',
  'navGroup.aiAgents': 'Agentes IA',
  'navGroup.institution': 'Institución',
  'navGroup.competition': 'Competición',
  'navGroup.family': 'Familia',
  'navGroup.explore': 'Explorar',

  'btn.start': 'Comenzar',
  'btn.submit': 'Enviar',
  'btn.cancel': 'Cancelar',
  'btn.save': 'Guardar',
  'btn.reset': 'Reiniciar',
  'btn.refresh': 'Actualizar',
  'btn.continue': 'Continuar',
  'btn.back': 'Atrás',
  'btn.next': 'Siguiente',
  'btn.previous': 'Anterior',
  'btn.skip': 'Saltar',
  'btn.viewAll': 'Ver Todo',
  'btn.viewDetails': 'Ver Detalles',
  'btn.tryAgain': 'Intentar de Nuevo',
  'btn.logout': 'Cerrar Sesión',
  'btn.login': 'Iniciar Sesión',

  'dash.welcome': 'Bienvenido de nuevo',
  'dash.liveCountdown': 'Cuenta Regresiva en Vivo',
  'dash.weakAreas': 'Áreas Débiles',
  'dash.examNews': 'Noticias de Exámenes',
  'dash.todayPlan': 'Plan de Hoy',
  'dash.streak': 'Racha',
  'dash.studyHours': 'Horas de Estudio',
  'dash.mocksTaken': 'Exámenes Realizados',

  'mentor.welcome': '¡Hola! Soy tu mentor de IA. ¿Cómo puedo ayudarte hoy?',
  'mentor.placeholder': 'Pregúntame cualquier cosa sobre tus estudios…',
  'mentor.socraticMode': 'Modo Socrático',

  'common.loading': 'Cargando…',
  'common.error': 'Algo salió mal',
  'common.success': 'Éxito',
  'common.noData': 'Sin datos disponibles',
  'common.search': 'Buscar',
  'common.filter': 'Filtrar',
  'common.all': 'Todos',
  'common.none': 'Ninguno',
  'common.you': 'Tú',
  'common.subject': 'Asignatura',
  'common.topic': 'Tema',
  'common.difficulty': 'Dificultad',
  'common.score': 'Puntuación',
  'common.accuracy': 'Precisión',
  'common.time': 'Tiempo',
  'common.marks': 'Puntos',
  'common.percentile': 'Percentil',
};

const FRENCH: TranslationDict = {
  'nav.dashboard': 'Tableau de bord',
  'nav.mockExam': 'Examen blanc',
  'nav.studyMaterial': 'Matériel d\'étude',
  'nav.analytics': 'Analytique',
  'nav.planner': 'Planificateur',
  'nav.mentor': 'Mentor IA',
  'nav.doubtSolver': 'Solveur de doutes',
  'nav.pyqTrends': 'Tendances PYQ',
  'nav.handwrittenGrader': 'Évaluateur manuscrit',
  'nav.battleArena': 'Arène de bataille',
  'nav.errorJournal': 'Journal d\'erreurs',
  'nav.parentDashboard': 'Tableau parental',
  'nav.institution': 'Tableau établissement',
  'nav.teacher': 'Vue enseignant',
  'nav.guardrail': 'Tableau de sécurité',
  'nav.settings': 'Paramètres',
  'nav.career': 'Guide de carrière',
  'nav.university': 'Universités',
  'nav.scholarship': 'Bourses',
  'nav.counsellor': 'Bien-être',
  'nav.discover': 'Découvrir',
  'nav.weaknessRadar': 'Radar des faiblesses',

  'navGroup.core': 'Principal',
  'navGroup.aiAgents': 'Agents IA',
  'navGroup.institution': 'Établissement',
  'navGroup.competition': 'Compétition',
  'navGroup.family': 'Famille',
  'navGroup.explore': 'Explorer',

  'btn.start': 'Commencer',
  'btn.submit': 'Soumettre',
  'btn.cancel': 'Annuler',
  'btn.save': 'Enregistrer',
  'btn.reset': 'Réinitialiser',
  'btn.refresh': 'Actualiser',
  'btn.continue': 'Continuer',
  'btn.back': 'Retour',
  'btn.next': 'Suivant',
  'btn.previous': 'Précédent',
  'btn.skip': 'Passer',
  'btn.viewAll': 'Voir tout',
  'btn.viewDetails': 'Voir détails',
  'btn.tryAgain': 'Réessayer',
  'btn.logout': 'Déconnexion',
  'btn.login': 'Connexion',

  'dash.welcome': 'Bon retour',
  'dash.liveCountdown': 'Compte à rebours en direct',
  'dash.weakAreas': 'Zones faibles',
  'dash.examNews': 'Actualités des examens',
  'dash.todayPlan': 'Plan du jour',
  'dash.streak': 'Série',
  'dash.studyHours': 'Heures d\'étude',
  'dash.mocksTaken': 'Examens passés',

  'mentor.welcome': 'Salut ! Je suis ton mentor IA. Comment puis-je t\'aider aujourd\'hui ?',
  'mentor.placeholder': 'Pose-moi une question sur tes études…',
  'mentor.socraticMode': 'Mode socratique',

  'common.loading': 'Chargement…',
  'common.error': 'Une erreur s\'est produite',
  'common.success': 'Succès',
  'common.noData': 'Aucune donnée disponible',
  'common.search': 'Rechercher',
  'common.filter': 'Filtrer',
  'common.all': 'Tous',
  'common.none': 'Aucun',
  'common.you': 'Toi',
  'common.subject': 'Matière',
  'common.topic': 'Sujet',
  'common.difficulty': 'Difficulté',
  'common.score': 'Score',
  'common.accuracy': 'Précision',
  'common.time': 'Temps',
  'common.marks': 'Points',
  'common.percentile': 'Percentile',
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  en: ENGLISH,
  hi: HINDI,
  es: SPANISH,
  fr: FRENCH,
};

// ---------------------------------------------------------------------------
// AI mentor language instruction — injected into system prompts
// ---------------------------------------------------------------------------

export const AI_LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  en: 'Respond in English.',
  hi: 'हिन्दी में उत्तर दें। तकनीकी शब्दों के लिए अंग्रेजी का प्रयोग कर सकते हैं, लेकिन व्याख्या हिन्दी में दें। Respond in Hindi — you may use English for technical terms, but keep explanations in Hindi.',
  es: 'Responde en español. Puedes usar términos técnicos en inglés, pero las explicaciones deben estar en español.',
  fr: 'Réponds en français. Tu peux utiliser des termes techniques en anglais, mais les explications doivent être en français.',
};

// ---------------------------------------------------------------------------
// Translation function
// ---------------------------------------------------------------------------

export function translate(key: StringKey, lang: Language = 'en'): string {
  const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
  return dict[key] ?? TRANSLATIONS.en[key] ?? key;
}

export function getLanguageMeta(lang: Language): LanguageMeta {
  return LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];
}
