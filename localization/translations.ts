interface TranslationKeys {
  home: {
    title: string;
    streak: string;
    stats: string;
    tips: string;
    latestPhoto: string;
    takePhoto: string;
    weeklyActivity: string;
    takeFirstPhoto: string;
    startJourney: string;
    photoTakenToday: string;
    keepItUp: string;
    takeNextPhoto: string;
    lastPhotoYesterday: string;
    daysSinceLastPhoto: string;
    missedDays: string;
    getBackOnTrack: string;
    transformation: string;
    tapForMore: string;
    achievements: string;
    consistency: string;
    last12Weeks: string;
    last10Weeks: string;
  };
  camera: {
    title: string;
    front: string;
    side: string;
    back: string;
    takePicture: string;
    retake: string;
    permissionMessage: string;
    grantPermission: string;
    confirm: string;
    galleryPermissionDenied: string;
    imagePickerError: string;
  };
  gallery: {
    title: string;
    deletePhoto: string;
    selectPhotoType: string;
    loading: string;
    grouped: string;
    timeline: string;
    selected: string;
    delete: string;
  };
  progress: {
    title: string;
    front: string;
    side: string;
    back: string;
    noPhotosAvailable: string;
    comparePhotos: string;
    timeDifference: string;
    extractPhoto: string;
    photoSavedMessage: string;
    photoSaveErrorMessage: string;
    selectPhotos: string;
    selectFirstPhoto: string;
    selectSecondPhoto: string;
  };
  achievements: {
    firstPhoto: string;
    firstPhotoDesc: string;
    sevenDayStreak: string;
    sevenDayStreakDesc: string;
    thirtyPhotos: string;
    thirtyPhotosDesc: string;
    monthJourney: string;
    monthJourneyDesc: string;
    hundredPhotos: string;
    hundredPhotosDesc: string;
    allTypes: string;
    allTypesDesc: string;
  };
  settings: {
    title: string;
    user: string;
    account: string;
    notifications: string;
    privacy: string;
    reminders: string;
    support: string;
    helpAndFeedback: string;
    language: string;
    selectLanguage: string;
    storage: string;
    totalPhotos: string;
    storageUsed: string;
    refresh: string;
    cleanup: string;
    cleanupTitle: string;
    cleanupMessage: string;
    cleanupSuccess: string;
    cleanupError: string;
    loadingStorageInfo: string;
    failedToLoadStorage: string;
    tutorial: string;
    viewTutorial: string;
    appearance: string;
    theme: string;
    light: string;
    dark: string;
    system: string;
  };
  streakCard: {
    startStreak: string;
    beginToday: string;
    greatStart: string;
    keepItUp: string;
    keepMomentum: string;
    incredibleStreak: string;
    machine: string;
    onFire: string;
    fantasticProgress: string;
    unstoppable: string;
    legendaryDedication: string;
    rewritingHistory: string;
    streakMaster: string;
    achievedGreatness: string;
  };
  latestPhotoCard: {
    noPhotos: string;
  };
  header: {
    motivationalQuotes: string[];
  };
  progressSummary: {
    days: string;
    photos: string;
    active: string;
  };
  onboardingCarousel: {
    takePhoto: {
      title: string;
      subtitle: string;
    };
    seeProgress: {
      title: string;
      subtitle: string;
    };
    shareResults: {
      title: string;
      subtitle: string;
    };
    getStarted: string;
    next: string;
  };
  dailyReminder: {
    title: string;
    addReminder: string;
    setDailyReminder: string;
    hour: string;
    minute: string;
    cancel: string;
    setReminder: string;
    reminderSet: string;
    reminderSetMessage: string;
  };
  shreddedTipsCarousel: {
    tips: string;
  };
  timeDifference: {
    year: string;
    years: string;
    month: string;
    months: string;
    day: string;
    days: string;
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    success: string;
    cancel: string;
  };
  contacts: {
    title: string;
    email: string;
    phone: string;
    website: string;
  };
  permissions: {
    title: string;
    photoSaveMessage: string;
  };
}

type Translations = {
  [key: string]: TranslationKeys;
};

export const translations: Translations = {
  en: {
    home: {
      title: "Fitness Tracker",
      streak: "Streak",
      stats: "Stats",
      tips: "Tips",
      latestPhoto: "Latest Photo",
      takePhoto: "Take Photo",
      weeklyActivity: "Weekly Activity",
      takeFirstPhoto: "Take Your First Photo!",
      startJourney: "Start your transformation journey today",
      photoTakenToday: "Photo Taken Today!",
      keepItUp: "Great job staying consistent",
      takeNextPhoto: "Time for Your Next Photo",
      lastPhotoYesterday: "Last photo was yesterday",
      daysSinceLastPhoto: "days since last photo",
      missedDays: "Days Since Last Photo",
      getBackOnTrack: "Get back on track today!",
      transformation: "Your Transformation",
      tapForMore: "Tap to see full comparison",
      achievements: "Achievements",
      consistency: "Consistency Tracker",
      last12Weeks: "Last 12 weeks",
      last10Weeks: "Last 10 weeks",
    },
    camera: {
      title: "Camera",
      front: "Front",
      side: "Side",
      back: "Back",
      takePicture: "Take Picture",
      retake: "Retake",
      confirm: "Confirm",
      permissionMessage: "We need your permission to show the camera",
      grantPermission: "Grant permission",
      galleryPermissionDenied: "We need media library permissions to import images",
      imagePickerError: "Error selecting image. Please try again",
    },
    gallery: {
      title: "Gallery",
      deletePhoto: "Delete Photo",
      selectPhotoType: "Select Photo Type",
      loading: "Loading...",
      grouped: "Grouped",
      timeline: "Timeline",
      selected: "selected",
      delete: "Delete",
    },
    progress: {
      title: "Your Progress",
      front: "Front",
      side: "Side",
      back: "Back",
      noPhotosAvailable: "No photos available for",
      comparePhotos: "Slide to compare oldest and newest photos",
      timeDifference: "Time difference",
      extractPhoto: "Extract photo",
      photoSavedMessage: "Photo saved successfully",
      photoSaveErrorMessage: "Error saving photo",
      selectPhotos: "Select Photos to Compare",
      selectFirstPhoto: "Select first photo",
      selectSecondPhoto: "Select second photo",
    },
    achievements: {
      firstPhoto: "First Step",
      firstPhotoDesc: "Take your first photo",
      sevenDayStreak: "Week Warrior",
      sevenDayStreakDesc: "7-day streak",
      thirtyPhotos: "Photographer",
      thirtyPhotosDesc: "Take 30 photos",
      monthJourney: "Month Journey",
      monthJourneyDesc: "30 days of tracking",
      hundredPhotos: "Centurion",
      hundredPhotosDesc: "Take 100 photos",
      allTypes: "Complete Set",
      allTypesDesc: "Photo of each angle",
    },
    settings: {
      title: "Settings",
      user: "User",
      account: "Account",
      notifications: "Notifications",
      privacy: "Privacy",
      reminders: "Reminders",
      support: "Support",
      helpAndFeedback: "Help & Feedback",
      language: "Language",
      selectLanguage: "Select Language",
      storage: "Storage",
      totalPhotos: "Total Photos",
      storageUsed: "Storage Used",
      refresh: "Refresh",
      cleanup: "Cleanup",
      cleanupTitle: "Cleanup Storage",
      cleanupMessage: "This will remove any orphaned photo files. Continue?",
      cleanupSuccess: "Storage cleanup completed",
      cleanupError: "Failed to cleanup storage",
      loadingStorageInfo: "Loading storage info...",
      failedToLoadStorage: "Failed to load storage information",
      tutorial: "Tutorial",
      viewTutorial: "View Tutorial",
      appearance: "Appearance",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    streakCard: {
      startStreak: "Start your streak!",
      beginToday: "Begin today",
      greatStart: "Great start!",
      keepItUp: "Keep it up!",
      onFire: "You're on fire!",
      keepMomentum: "Keep the momentum going",
      fantasticProgress: "Fantastic progress!",
      unstoppable: "You're unstoppable",
      incredibleStreak: "Incredible streak!",
      machine: "You're a machine",
      legendaryDedication: "Legendary dedication!",
      rewritingHistory: "You're rewriting history",
      streakMaster: "Streak master!",
      achievedGreatness: "You've achieved greatness",
    },
    latestPhotoCard: {
      noPhotos: "No photos yet",
    },
    header: {
      motivationalQuotes: [
        "Transform your body, transform your life!",
        "Every photo is a step towards your goal.",
        "Capture your progress, fuel your motivation.",
      ],
    },
    progressSummary: {
      days: "days",
      photos: "photos",
      active: "active",
    },
    onboardingCarousel: {
      takePhoto: {
        title: "Take a Photo",
        subtitle: "Take pictures each day",
      },
      seeProgress: {
        title: "See your progress",
        subtitle: "Track your fitness journey",
      },
      shareResults: {
        title: "Share your results",
        subtitle: "Inspire others with your success",
      },
      getStarted: "Get Started",
      next: "Next",
    },
    dailyReminder: {
      title: "Daily Reminders",
      addReminder: "Add Reminder",
      setDailyReminder: "Set Daily Reminder",
      hour: "Hour",
      minute: "Minute",
      cancel: "Cancel",
      setReminder: "Set Reminder",
      reminderSet: "Reminder Set",
      reminderSetMessage: "You'll be reminded daily at",
    },
    shreddedTipsCarousel: {
      tips: JSON.stringify([
        {
          main: "Stay hydrated",
          clarification: "Drink at least 8 glasses of water daily",
          icon: "water-outline",
        },
        {
          main: "Get enough sleep",
          clarification: "Aim for 7-9 hours of sleep each night",
          icon: "moon-outline",
        },
        {
          main: "Balanced diet",
          clarification:
            "Include proteins, carbs, and healthy fats in your meals",
          icon: "nutrition-outline",
        },
        {
          main: "Regular exercise",
          clarification: "Aim for at least 30 minutes of activity daily",
          icon: "fitness-outline",
        },
        {
          main: "Track your progress",
          clarification: "Take photos and measurements regularly",
          icon: "analytics-outline",
        },
      ]),
    },
    timeDifference: {
      year: "year",
      years: "years",
      month: "month",
      months: "months",
      day: "day",
      days: "days",
    },
    common: {
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      success: "Success",
      cancel: "Cancel",
    },
    contacts: {
      title: "Contact Us",
      email: "Email",
      phone: "Phone",
      website: "Website",
    },
    permissions: {
      title: "Permission Required",
      photoSaveMessage:
        "We need your permission to save photos to your gallery.",
    },
  },

  es: {
    home: {
      title: "Seguimiento de Fitness",
      streak: "Racha",
      stats: "Estadísticas",
      tips: "Consejos",
      latestPhoto: "Última Foto",
      takePhoto: "Tomar Foto",
      weeklyActivity: "Actividad Semanal",
      takeFirstPhoto: "¡Toma Tu Primera Foto!",
      startJourney: "Comienza tu viaje de transformación hoy",
      photoTakenToday: "¡Foto Tomada Hoy!",
      keepItUp: "Excelente trabajo manteniéndote consistente",
      takeNextPhoto: "Hora de Tu Próxima Foto",
      lastPhotoYesterday: "La última foto fue ayer",
      daysSinceLastPhoto: "días desde la última foto",
      missedDays: "Días Desde la Última Foto",
      getBackOnTrack: "¡Retoma el rumbo hoy!",
      transformation: "Tu Transformación",
      tapForMore: "Toca para ver la comparación completa",
      achievements: "Logros",
      consistency: "Rastreador de Consistencia",
      last12Weeks: "Últimas 12 semanas",
      last10Weeks: "Últimas 10 semanas",
    },
    camera: {
      title: "Cámara",
      front: "Frente",
      side: "Lado",
      back: "Espalda",
      takePicture: "Tomar Foto",
      retake: "Volver a Tomar",
      confirm: "Confirmar",
      permissionMessage: "Necesitamos tu permiso para mostrar la cámara",
      grantPermission: "Conceder permiso",
      galleryPermissionDenied: "Necesitamos permisos para acceder a la galería de fotos",
      imagePickerError: "Error al seleccionar imagen. Por favor, inténtalo de nuevo",
    },
    gallery: {
      title: "Galería",
      deletePhoto: "Eliminar Foto",
      selectPhotoType: "Seleccionar Tipo de Foto",
      loading: "Cargando...",
      grouped: "Agrupado",
      timeline: "Línea de Tiempo",
      selected: "seleccionado",
      delete: "Eliminar",
    },
    progress: {
      title: "Tu Progreso",
      front: "Frente",
      side: "Lado",
      back: "Espalda",
      noPhotosAvailable: "No hay fotos disponibles para",
      comparePhotos:
        "Desliza para comparar las fotos más antiguas y más recientes",
      timeDifference: "Diferencia de tiempo",
      extractPhoto: "Extraer foto",
      photoSavedMessage: "Foto guardada con éxito",
      photoSaveErrorMessage: "Error al guardar foto",
      selectPhotos: "Seleccionar Fotos para Comparar",
      selectFirstPhoto: "Seleccionar primera foto",
      selectSecondPhoto: "Seleccionar segunda foto",
    },
    achievements: {
      firstPhoto: "Primer Paso",
      firstPhotoDesc: "Toma tu primera foto",
      sevenDayStreak: "Guerrero Semanal",
      sevenDayStreakDesc: "Racha de 7 días",
      thirtyPhotos: "Fotógrafo",
      thirtyPhotosDesc: "Toma 30 fotos",
      monthJourney: "Viaje del Mes",
      monthJourneyDesc: "30 días de seguimiento",
      hundredPhotos: "Centurión",
      hundredPhotosDesc: "Toma 100 fotos",
      allTypes: "Conjunto Completo",
      allTypesDesc: "Foto de cada ángulo",
    },
    settings: {
      title: "Configuración",
      user: "Usuario",
      account: "Cuenta",
      notifications: "Notificaciones",
      privacy: "Privacidad",
      reminders: "Recordatorios",
      support: "Soporte",
      helpAndFeedback: "Ayuda y Comentarios",
      language: "Idioma",
      selectLanguage: "Seleccionar Idioma",
      storage: "Almacenamiento",
      totalPhotos: "Total de Fotos",
      storageUsed: "Almacenamiento Usado",
      refresh: "Actualizar",
      cleanup: "Limpiar",
      cleanupTitle: "Limpiar Almacenamiento",
      cleanupMessage: "Esto eliminará archivos de fotos huérfanos. ¿Continuar?",
      cleanupSuccess: "Limpieza de almacenamiento completada",
      cleanupError: "Error al limpiar el almacenamiento",
      loadingStorageInfo: "Cargando información de almacenamiento...",
      failedToLoadStorage: "Error al cargar la información de almacenamiento",
      tutorial: "Tutorial",
      viewTutorial: "Ver Tutorial",
      appearance: "Apariencia",
      theme: "Tema",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
    },
    streakCard: {
      startStreak: "¡Comienza tu racha!",
      beginToday: "Empieza hoy",
      greatStart: "¡Gran comienzo!",
      keepItUp: "¡Sigue así!",
      onFire: "¡Estás en llamas!",
      keepMomentum: "Mantén el impulso",
      fantasticProgress: "¡Progreso fantástico!",
      unstoppable: "Eres imparable",
      incredibleStreak: "¡Racha increíble!",
      machine: "Eres una máquina",
      legendaryDedication: "¡Dedicación legendaria!",
      rewritingHistory: "Estás reescribiendo la historia",
      streakMaster: "¡Maestro de las rachas!",
      achievedGreatness: "Has logrado la grandeza",
    },
    latestPhotoCard: {
      noPhotos: "Aún no hay fotos",
    },
    header: {
      motivationalQuotes: [
        "¡Transforma tu cuerpo, transforma tu vida!",
        "Cada foto es un paso hacia tu meta.",
        "Captura tu progreso, alimenta tu motivación.",
      ],
    },
    progressSummary: {
      days: "días",
      photos: "fotos",
      active: "activo",
    },
    onboardingCarousel: {
      takePhoto: {
        title: "Toma una foto",
        subtitle: "Toma fotos cada día",
      },
      seeProgress: {
        title: "Ve tu progreso",
        subtitle: "Sigue tu viaje de fitness",
      },
      shareResults: {
        title: "Comparte tus resultados",
        subtitle: "Inspira a otros con tu éxito",
      },
      getStarted: "Comenzar",
      next: "Siguiente",
    },
    dailyReminder: {
      title: "Recordatorios Diarios",
      addReminder: "Añadir Recordatorio",
      setDailyReminder: "Establecer Recordatorio Diario",
      hour: "Hora",
      minute: "Minuto",
      cancel: "Cancelar",
      setReminder: "Establecer Recordatorio",
      reminderSet: "Recordatorio Establecido",
      reminderSetMessage: "Se te recordará diariamente a las",
    },
    shreddedTipsCarousel: {
      tips: JSON.stringify([
        {
          main: "Mantente hidratado",
          clarification: "Bebe al menos 8 vasos de agua al día",
          icon: "water-outline",
        },
        {
          main: "Duerme lo suficiente",
          clarification: "Apunta a dormir de 7 a 9 horas cada noche",
          icon: "moon-outline",
        },
        {
          main: "Dieta equilibrada",
          clarification:
            "Incluye proteínas, carbohidratos y grasas saludables en tus comidas",
          icon: "nutrition-outline",
        },
        {
          main: "Ejercicio regular",
          clarification: "Apunta a al menos 30 minutos de actividad diaria",
          icon: "fitness-outline",
        },
        {
          main: "Sigue tu progreso",
          clarification: "Toma fotos y medidas regularmente",
          icon: "analytics-outline",
        },
      ]),
    },
    timeDifference: {
      year: "año",
      years: "años",
      month: "mes",
      months: "meses",
      day: "día",
      days: "días",
    },
    common: {
      loading: "Cargando...",
      error: "Ocurrió un error",
      retry: "Reintentar",
      success: "Exito",
      cancel: "Cancelar",
    },
    contacts: {
      title: "Contáctanos",
      email: "Correo electrónico",
      phone: "Teléfono",
      website: "Sitio web",
    },
    permissions: {
      title: "Permiso Requerido",
      photoSaveMessage:
        "Necesitamos su permiso para guardar fotos en su galería.",
    },
  },

  it: {
    home: {
      title: "Tracker Fitness",
      streak: "Serie",
      stats: "Statistiche",
      tips: "Consigli",
      latestPhoto: "Ultima Foto",
      takePhoto: "Scatta Foto",
      weeklyActivity: "Attività Settimanale",
      takeFirstPhoto: "Scatta la Tua Prima Foto!",
      startJourney: "Inizia il tuo viaggio di trasformazione oggi",
      photoTakenToday: "Foto Scattata Oggi!",
      keepItUp: "Ottimo lavoro nel restare costante",
      takeNextPhoto: "È Ora della Tua Prossima Foto",
      lastPhotoYesterday: "L'ultima foto è stata ieri",
      daysSinceLastPhoto: "giorni dall'ultima foto",
      missedDays: "Giorni Dall'Ultima Foto",
      getBackOnTrack: "Torna in carreggiata oggi!",
      transformation: "La Tua Trasformazione",
      tapForMore: "Tocca per vedere il confronto completo",
      achievements: "Obiettivi",
      consistency: "Tracciatore di Costanza",
      last12Weeks: "Ultime 12 settimane",
      last10Weeks: "Ultime 10 settimane",
    },
    camera: {
      title: "Fotocamera",
      front: "Fronte",
      side: "Lato",
      back: "Retro",
      takePicture: "Scatta Foto",
      retake: "Rifare",
      confirm: "Conferma",
      permissionMessage:
        "Abbiamo bisogno del tuo permesso per mostrare la fotocamera",
      grantPermission: "Concedi permesso",
      galleryPermissionDenied: "Abbiamo bisogno del permesso per accedere alla galleria foto",
      imagePickerError: "Errore durante la selezione dell'immagine. Riprova",
    },
    gallery: {
      title: "Galleria",
      deletePhoto: "Elimina Foto",
      selectPhotoType: "Seleziona Tipo di Foto",
      loading: "Caricamento...",
      grouped: "Raggruppato",
      timeline: "Timeline",
      selected: "selezionato",
      delete: "Elimina",
    },
    progress: {
      title: "I Tuoi Progressi",
      front: "Fronte",
      side: "Lato",
      back: "Retro",
      noPhotosAvailable: "Nessuna foto disponibile per",
      comparePhotos: "Scorri per confrontare le foto più vecchie e più recenti",
      timeDifference: "Differenza di tempo",
      extractPhoto: "Estrai foto",
      photoSavedMessage: "Foto salvata con successo",
      photoSaveErrorMessage: "Errore nel salvare la foto",
      selectPhotos: "Seleziona Foto da Confrontare",
      selectFirstPhoto: "Seleziona prima foto",
      selectSecondPhoto: "Seleziona seconda foto",
    },
    achievements: {
      firstPhoto: "Primo Passo",
      firstPhotoDesc: "Scatta la tua prima foto",
      sevenDayStreak: "Guerriero Settimanale",
      sevenDayStreakDesc: "Serie di 7 giorni",
      thirtyPhotos: "Fotografo",
      thirtyPhotosDesc: "Scatta 30 foto",
      monthJourney: "Viaggio del Mese",
      monthJourneyDesc: "30 giorni di monitoraggio",
      hundredPhotos: "Centurione",
      hundredPhotosDesc: "Scatta 100 foto",
      allTypes: "Set Completo",
      allTypesDesc: "Foto di ogni angolazione",
    },
    settings: {
      title: "Impostazioni",
      user: "Utente",
      account: "Account",
      notifications: "Notifiche",
      privacy: "Privacy",
      reminders: "Promemoria",
      support: "Supporto",
      helpAndFeedback: "Aiuto & Feedback",
      language: "Lingua",
      selectLanguage: "Seleziona Lingua",
      storage: "Archiviazione",
      totalPhotos: "Foto Totali",
      storageUsed: "Spazio Utilizzato",
      refresh: "Aggiorna",
      cleanup: "Pulisci",
      cleanupTitle: "Pulisci Archiviazione",
      cleanupMessage: "Questo rimuoverà i file di foto orfani. Continuare?",
      cleanupSuccess: "Pulizia dell'archiviazione completata",
      cleanupError: "Impossibile pulire l'archiviazione",
      loadingStorageInfo: "Caricamento informazioni archiviazione...",
      failedToLoadStorage: "Impossibile caricare le informazioni di archiviazione",
      tutorial: "Tutorial",
      viewTutorial: "Visualizza Tutorial",
      appearance: "Aspetto",
      theme: "Tema",
      light: "Chiaro",
      dark: "Scuro",
      system: "Sistema",
    },
    streakCard: {
      startStreak: "Inizia la tua serie!",
      beginToday: "Inizia oggi",
      greatStart: "Ottimo inizio!",
      keepItUp: "Continua così!",
      onFire: "Sei in fiamma!",
      keepMomentum: "Mantieni lo slancio",
      fantasticProgress: "Progressi fantastici!",
      unstoppable: "Sei inarrestabile",
      incredibleStreak: "Serie incredibile!",
      machine: "Sei una macchina",
      legendaryDedication: "Dedica leggendaria!",
      rewritingHistory: "Stai riscrivendo la storia",
      streakMaster: "Maestro delle serie!",
      achievedGreatness: "Hai raggiunto la grandezza",
    },
    latestPhotoCard: {
      noPhotos: "Nessuna foto ancora",
    },
    header: {
      motivationalQuotes: [
        "Trasforma il tuo corpo, trasforma la tua vita!",
        "Ogni foto è un passo verso il tuo obiettivo.",
        "Cattura i tuoi progressi, alimenta la tua motivazione.",
      ],
    },
    progressSummary: {
      days: "giorni",
      photos: "foto",
      active: "attivo",
    },
    onboardingCarousel: {
      takePhoto: {
        title: "Scatta una Foto",
        subtitle: "Scatta foto ogni giorno",
      },
      seeProgress: {
        title: "Vedi i tuoi progressi",
        subtitle: "Traccia il tuo percorso fitness",
      },
      shareResults: {
        title: "Condividi i tuoi risultati",
        subtitle: "Ispira gli altri con il tuo successo",
      },
      getStarted: "Inizia",
      next: "Avanti",
    },
    dailyReminder: {
      title: "Promemoria Giornalieri",
      addReminder: "Aggiungi Promemoria",
      setDailyReminder: "Imposta Promemoria Giornaliero",
      hour: "Ora",
      minute: "Minuto",
      cancel: "Annulla",
      setReminder: "Imposta Promemoria",
      reminderSet: "Promemoria Impostato",
      reminderSetMessage: "Riceverai un promemoria giornaliero alle",
    },
    shreddedTipsCarousel: {
      tips: JSON.stringify([
        {
          main: "Mantieniti idratato",
          clarification: "Bevi almeno 8 bicchieri d'acqua al giorno",
          icon: "water-outline",
        },
        {
          main: "Dormi a sufficienza",
          clarification: "Punta a dormire 7-9 ore ogni notte",
          icon: "moon-outline",
        },
        {
          main: "Dieta equilibrata",
          clarification:
            "Includi proteine, carboidrati e grassi sani nei tuoi pasti",
          icon: "nutrition-outline",
        },
        {
          main: "Esercizio regolare",
          clarification: "Punta ad almeno 30 minuti di attività al giorno",
          icon: "fitness-outline",
        },
        {
          main: "Traccia i tuoi progressi",
          clarification: "Scatta foto e prendi misure regolarmente",
          icon: "analytics-outline",
        },
      ]),
    },
    timeDifference: {
      year: "anno",
      years: "anni",
      month: "mese",
      months: "mesi",
      day: "giorno",
      days: "giorni",
    },
    common: {
      loading: "Caricamento...",
      error: "Si è verificato un errore",
      retry: "Riprova",
      success: "Successo",
      cancel: "Annulla",
    },
    contacts: {
      title: "Contattaci",
      email: "Email",
      phone: "Telefono",
      website: "Sito web",
    },
    permissions: {
      title: "Autorizzazione Richiesta",
      photoSaveMessage:
        "Abbiamo bisogno del tuo permesso per salvare le foto nella tua galleria.",
    },
  },
  de: {
    home: {
      title: "Fitness-Tracker",
      streak: "Serie",
      stats: "Statistiken",
      tips: "Tipps",
      latestPhoto: "Neuestes Foto",
      takePhoto: "Foto aufnehmen",
      weeklyActivity: "Wöchentliche Aktivität",
      takeFirstPhoto: "Nehmen Sie Ihr Erstes Foto Auf!",
      startJourney: "Beginnen Sie heute Ihre Transformation",
      photoTakenToday: "Foto Heute Aufgenommen!",
      keepItUp: "Großartige Arbeit, bleiben Sie konsequent",
      takeNextPhoto: "Zeit für Ihr Nächstes Foto",
      lastPhotoYesterday: "Das letzte Foto war gestern",
      daysSinceLastPhoto: "Tage seit dem letzten Foto",
      missedDays: "Tage Seit dem Letzten Foto",
      getBackOnTrack: "Kommen Sie heute zurück auf Kurs!",
      transformation: "Ihre Transformation",
      tapForMore: "Tippen Sie, um den vollständigen Vergleich zu sehen",
      achievements: "Erfolge",
      consistency: "Konsistenz-Tracker",
      last12Weeks: "Letzte 12 Wochen",
      last10Weeks: "Letzte 10 Wochen",
    },
    camera: {
      title: "Kamera",
      front: "Vorderseite",
      side: "Seite",
      back: "Rückseite",
      takePicture: "Foto aufnehmen",
      retake: "Neu aufnehmen",
      confirm: "Bestätigen",
      permissionMessage:
        "Wir benötigen Ihre Erlaubnis, um die Kamera zu zeigen",
      grantPermission: "Erlaubnis erteilen",
      galleryPermissionDenied: "Wir benötigen die Berechtigung zum Zugriff auf die Fotogalerie",
      imagePickerError: "Fehler beim Auswählen des Bildes. Bitte versuchen Sie es erneut",
    },
    gallery: {
      title: "Galerie",
      deletePhoto: "Foto löschen",
      selectPhotoType: "Fototyp auswählen",
      loading: "Lädt...",
      grouped: "Gruppiert",
      timeline: "Zeitstrahl",
      selected: "ausgewählt",
      delete: "Löschen",
    },
    progress: {
      title: "Ihr Fortschritt",
      front: "Vorderseite",
      side: "Seite",
      back: "Rückseite",
      noPhotosAvailable: "Keine Fotos verfügbar für",
      comparePhotos:
        "Schieben Sie, um älteste und neueste Fotos zu vergleichen",
      timeDifference: "Zeitunterschied",
      extractPhoto: "Foto extrahieren",
      photoSavedMessage: "Foto erfolgreich gespeichert",
      photoSaveErrorMessage: "Fehler beim Speichern des Fotos",
      selectPhotos: "Fotos zum Vergleichen Auswählen",
      selectFirstPhoto: "Erstes Foto auswählen",
      selectSecondPhoto: "Zweites Foto auswählen",
    },
    achievements: {
      firstPhoto: "Erster Schritt",
      firstPhotoDesc: "Nehmen Sie Ihr erstes Foto auf",
      sevenDayStreak: "Wochen-Krieger",
      sevenDayStreakDesc: "7-Tage-Serie",
      thirtyPhotos: "Fotograf",
      thirtyPhotosDesc: "30 Fotos aufnehmen",
      monthJourney: "Monats-Reise",
      monthJourneyDesc: "30 Tage Tracking",
      hundredPhotos: "Zenturio",
      hundredPhotosDesc: "100 Fotos aufnehmen",
      allTypes: "Komplettes Set",
      allTypesDesc: "Foto von jedem Winkel",
    },
    settings: {
      title: "Einstellungen",
      user: "Benutzer",
      account: "Konto",
      notifications: "Benachrichtigungen",
      privacy: "Datenschutz",
      reminders: "Erinnerungen",
      support: "Unterstützung",
      helpAndFeedback: "Hilfe & Feedback",
      language: "Sprache",
      selectLanguage: "Sprache auswählen",
      storage: "Speicher",
      totalPhotos: "Gesamtfotos",
      storageUsed: "Verwendeter Speicher",
      refresh: "Aktualisieren",
      cleanup: "Bereinigen",
      cleanupTitle: "Speicher Bereinigen",
      cleanupMessage: "Dies entfernt verwaiste Fotodateien. Fortfahren?",
      cleanupSuccess: "Speicherbereinigung abgeschlossen",
      cleanupError: "Fehler beim Bereinigen des Speichers",
      loadingStorageInfo: "Lade Speicherinformationen...",
      failedToLoadStorage: "Fehler beim Laden der Speicherinformationen",
      tutorial: "Anleitung",
      viewTutorial: "Anleitung Anzeigen",
      appearance: "Darstellung",
      theme: "Design",
      light: "Hell",
      dark: "Dunkel",
      system: "System",
    },
    streakCard: {
      startStreak: "Starten Sie Ihre Serie!",
      beginToday: "Beginnen Sie heute",
      greatStart: "Großartiger Start!",
      keepItUp: "Weiter so!",
      onFire: "Sie sind auf Feuer!",
      keepMomentum: "Behalten Sie den Schwung bei",
      fantasticProgress: "Fantastischer Fortschritt!",
      unstoppable: "Sie sind unaufhaltsam",
      incredibleStreak: "Unglaubliche Serie!",
      machine: "Sie sind eine Maschine",
      legendaryDedication: "Legendäre Hingabe!",
      rewritingHistory: "Sie schreiben Geschichte neu",
      streakMaster: "Serien-Meister!",
      achievedGreatness: "Sie haben Großes erreicht",
    },
    latestPhotoCard: {
      noPhotos: "Noch keine Fotos",
    },
    header: {
      motivationalQuotes: [
        "Transformieren Sie Ihren Körper, transformieren Sie Ihr Leben!",
        "Jedes Foto ist ein Schritt zu Ihrem Ziel.",
        "Erfassen Sie Ihren Fortschritt, nähren Sie Ihre Motivation.",
      ],
    },
    progressSummary: {
      days: "Tage",
      photos: "Fotos",
      active: "aktiv",
    },
    onboardingCarousel: {
      takePhoto: {
        title: "Machen Sie ein Foto",
        subtitle: "Machen Sie täglich Fotos",
      },
      seeProgress: {
        title: "Sehen Sie Ihren Fortschritt",
        subtitle: "Verfolgen Sie Ihre Fitness-Reise",
      },
      shareResults: {
        title: "Teilen Sie Ihre Ergebnisse",
        subtitle: "Inspirieren Sie andere mit Ihrem Erfolg",
      },
      getStarted: "Loslegen",
      next: "Weiter",
    },
    dailyReminder: {
      title: "Tägliche Erinnerungen",
      addReminder: "Erinnerung hinzufügen",
      setDailyReminder: "Tägliche Erinnerung einstellen",
      hour: "Stunde",
      minute: "Minute",
      cancel: "Abbrechen",
      setReminder: "Erinnerung einstellen",
      reminderSet: "Erinnerung eingestellt",
      reminderSetMessage: "Sie werden täglich erinnert um",
    },
    shreddedTipsCarousel: {
      tips: JSON.stringify([
        {
          main: "Bleiben Sie hydratisiert",
          clarification: "Trinken Sie mindestens 8 Gläser Wasser täglich",
          icon: "water-outline",
        },
        {
          main: "Ausreichend Schlaf",
          clarification: "Streben Sie 7-9 Stunden Schlaf jede Nacht an",
          icon: "moon-outline",
        },
        {
          main: "Ausgewogene Ernährung",
          clarification:
            "Schließen Sie Proteine, Kohlenhydrate und gesunde Fette in Ihre Mahlzeiten ein",
          icon: "nutrition-outline",
        },
        {
          main: "Regelmäßige Bewegung",
          clarification:
            "Streben Sie mindestens 30 Minuten Aktivität täglich an",
          icon: "fitness-outline",
        },
        {
          main: "Verfolgen Sie Ihren Fortschritt",
          clarification: "Machen Sie regelmäßig Fotos und Messungen",
          icon: "analytics-outline",
        },
      ]),
    },
    timeDifference: {
      year: "Jahr",
      years: "Jahre",
      month: "Monat",
      months: "Monate",
      day: "Tag",
      days: "Tage",
    },
    common: {
      loading: "Laden...",
      error: "Ein Fehler ist aufgetreten",
      retry: "Erneut versuchen",
      success: "Erfolgreich",
      cancel: "Abbrechen",
    },
    contacts: {
      title: "Kontaktieren Sie uns",
      email: "E-Mail",
      phone: "Telefon",
      website: "Webseite",
    },
    permissions: {
      title: "Berechtigung Erforderlich",
      photoSaveMessage:
        "Wir benötigen Ihre Erlaubnis, um Fotos in Ihrer Galerie zu speichern.",
    },
  },
  fr: {
    home: {
      title: "Suivi de Fitness",
      streak: "Série",
      stats: "Statistiques",
      tips: "Conseils",
      latestPhoto: "Dernière Photo",
      takePhoto: "Prendre une Photo",
      weeklyActivity: "Activité Hebdomadaire",
      takeFirstPhoto: "Prenez Votre Première Photo !",
      startJourney: "Commencez votre voyage de transformation aujourd'hui",
      photoTakenToday: "Photo Prise Aujourd'hui !",
      keepItUp: "Excellent travail pour rester constant",
      takeNextPhoto: "Il Est Temps de Prendre Votre Prochaine Photo",
      lastPhotoYesterday: "La dernière photo était hier",
      daysSinceLastPhoto: "jours depuis la dernière photo",
      missedDays: "Jours Depuis la Dernière Photo",
      getBackOnTrack: "Reprenez le bon chemin aujourd'hui !",
      transformation: "Votre Transformation",
      tapForMore: "Appuyez pour voir la comparaison complète",
      achievements: "Réalisations",
      consistency: "Suivi de Constance",
      last12Weeks: "12 dernières semaines",
      last10Weeks: "10 dernières semaines",
    },
    camera: {
      title: "Appareil Photo",
      front: "Face",
      side: "Côté",
      back: "Dos",
      takePicture: "Prendre une Photo",
      retake: "Reprendre",
      confirm: "Confirmer",
      permissionMessage:
        "Nous avons besoin de votre permission pour afficher l'appareil photo",
      grantPermission: "Accorder la permission",
      galleryPermissionDenied: "Nous avons besoin de l'autorisation d'accéder à la galerie de photos",
      imagePickerError: "Erreur lors de la sélection de l'image. Veuillez réessayer",
    },
    gallery: {
      title: "Galerie",
      deletePhoto: "Supprimer la Photo",
      selectPhotoType: "Sélectionner le Type de Photo",
      loading: "Chargement...",
      grouped: "Groupé",
      timeline: "Chronologie",
      selected: "sélectionné",
      delete: "Supprimer",
    },
    progress: {
      title: "Votre Progrès",
      front: "Face",
      side: "Côté",
      back: "Dos",
      noPhotosAvailable: "Aucune photo disponible pour",
      comparePhotos:
        "Faites glisser pour comparer les photos les plus anciennes et les plus récentes",
      timeDifference: "Différence de temps",
      extractPhoto: "Extraire la photo",
      photoSavedMessage: "Photo enregistrée avec succès",
      photoSaveErrorMessage: "Erreur lors de l'enregistrement de la photo",
      selectPhotos: "Sélectionner des Photos à Comparer",
      selectFirstPhoto: "Sélectionner la première photo",
      selectSecondPhoto: "Sélectionner la deuxième photo",
    },
    achievements: {
      firstPhoto: "Premier Pas",
      firstPhotoDesc: "Prenez votre première photo",
      sevenDayStreak: "Guerrier Hebdomadaire",
      sevenDayStreakDesc: "Série de 7 jours",
      thirtyPhotos: "Photographe",
      thirtyPhotosDesc: "Prendre 30 photos",
      monthJourney: "Voyage du Mois",
      monthJourneyDesc: "30 jours de suivi",
      hundredPhotos: "Centurion",
      hundredPhotosDesc: "Prendre 100 photos",
      allTypes: "Ensemble Complet",
      allTypesDesc: "Photo de chaque angle",
    },
    settings: {
      title: "Paramètres",
      user: "Utilisateur",
      account: "Compte",
      notifications: "Notifications",
      privacy: "Confidentialité",
      reminders: "Rappels",
      support: "Support",
      helpAndFeedback: "Aide & Commentaires",
      language: "Langue",
      selectLanguage: "Sélectionner la Langue",
      storage: "Stockage",
      totalPhotos: "Total de Photos",
      storageUsed: "Stockage Utilisé",
      refresh: "Actualiser",
      cleanup: "Nettoyer",
      cleanupTitle: "Nettoyer le Stockage",
      cleanupMessage: "Cela supprimera les fichiers photo orphelins. Continuer ?",
      cleanupSuccess: "Nettoyage du stockage terminé",
      cleanupError: "Échec du nettoyage du stockage",
      loadingStorageInfo: "Chargement des informations de stockage...",
      failedToLoadStorage: "Échec du chargement des informations de stockage",
      tutorial: "Tutoriel",
      viewTutorial: "Voir le Tutoriel",
      appearance: "Apparence",
      theme: "Thème",
      light: "Clair",
      dark: "Sombre",
      system: "Système",
    },
    streakCard: {
      startStreak: "Commencez votre série !",
      beginToday: "Commencez aujourd'hui",
      greatStart: "Excellent début !",
      keepItUp: "Continuez comme ça !",
      onFire: "Vous êtes en feu !",
      keepMomentum: "Gardez l'élan",
      fantasticProgress: "Progrès fantastique !",
      unstoppable: "Vous êtes inarrêtable",
      incredibleStreak: "Série incroyable !",
      machine: "Vous êtes une machine",
      legendaryDedication: "Dévouement légendaire !",
      rewritingHistory: "Vous réécrivez l'histoire",
      streakMaster: "Maître des séries !",
      achievedGreatness: "Vous avez atteint la grandeur",
    },
    latestPhotoCard: {
      noPhotos: "Pas encore de photos",
    },
    header: {
      motivationalQuotes: [
        "Transformez votre corps, transformez votre vie !",
        "Chaque photo est un pas vers votre objectif.",
        "Capturez vos progrès, alimentez votre motivation.",
      ],
    },
    progressSummary: {
      days: "jours",
      photos: "photos",
      active: "actif",
    },
    onboardingCarousel: {
      takePhoto: {
        title: "Prenez une Photo",
        subtitle: "Prenez des photos chaque jour",
      },
      seeProgress: {
        title: "Voyez vos progrès",
        subtitle: "Suivez votre parcours fitness",
      },
      shareResults: {
        title: "Partagez vos résultats",
        subtitle: "Inspirez les autres avec votre succès",
      },
      getStarted: "Commencer",
      next: "Suivant",
    },
    dailyReminder: {
      title: "Rappels Quotidiens",
      addReminder: "Ajouter un Rappel",
      setDailyReminder: "Définir un Rappel Quotidien",
      hour: "Heure",
      minute: "Minute",
      cancel: "Annuler",
      setReminder: "Définir le Rappel",
      reminderSet: "Rappel Défini",
      reminderSetMessage: "Vous serez rappelé quotidiennement à",
    },
    shreddedTipsCarousel: {
      tips: JSON.stringify([
        {
          main: "Restez hydraté",
          clarification: "Buvez au moins 8 verres d'eau par jour",
          icon: "water-outline",
        },
        {
          main: "Dormez suffisamment",
          clarification: "Visez 7-9 heures de sommeil chaque nuit",
          icon: "moon-outline",
        },
        {
          main: "Alimentation équilibrée",
          clarification:
            "Incluez des protéines, des glucides et des graisses saines dans vos repas",
          icon: "nutrition-outline",
        },
        {
          main: "Exercice régulier",
          clarification: "Visez au moins 30 minutes d'activité quotidienne",
          icon: "fitness-outline",
        },
        {
          main: "Suivez vos progrès",
          clarification: "Prenez des photos et des mesures régulièrement",
          icon: "analytics-outline",
        },
      ]),
    },
    timeDifference: {
      year: "an",
      years: "ans",
      month: "mois",
      months: "mois",
      day: "jour",
      days: "jours",
    },
    common: {
      loading: "Chargement...",
      error: "Une erreur s'est produite",
      retry: "Réessayer",
      success: "Succès",
      cancel: "Annuler",
    },
    contacts: {
      title: "Contactez-nous",
      email: "Email",
      phone: "Téléphone",
      website: "Site Web",
    },
    permissions: {
      title: "Autorisation Requise",
      photoSaveMessage:
        "Nous avons besoin de votre autorisation pour enregistrer des photos dans votre galerie.",
    },
  },
};
