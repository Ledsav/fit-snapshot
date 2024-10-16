interface TranslationKeys {
  home: {
    title: string;
    streak: string;
    stats: string;
    tips: string;
    latestPhoto: string;
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
  };
  gallery: {
    title: string;
    deletePhoto: string;
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
    },
    gallery: {
      title: "Gallery",
      deletePhoto: "Delete Photo",
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
      language: "English",
      selectLanguage: "Select Language",
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
    },
    gallery: {
      title: "Galería",
      deletePhoto: "Eliminar Foto",
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
      photoSavedMessage: "Foto guardada en la galería con éxito.",
      photoSaveErrorMessage:
        "No se pudo guardar la foto. Por favor, inténtelo de nuevo.",
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
      language: "Español",
      selectLanguage: "Seleccionar Idioma",
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
    },
    gallery: {
      title: "Galleria",
      deletePhoto: "Elimina Foto",
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
      photoSavedMessage: "Foto salvata nella galleria con successo.",
      photoSaveErrorMessage: "Impossibile salvare la foto. Per favore riprova.",
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
      language: "Italiano",
      selectLanguage: "Seleziona Lingua",
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
    },
    gallery: {
      title: "Galerie",
      deletePhoto: "Foto löschen",
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
      photoSavedMessage: "Foto erfolgreich in der Galerie gespeichert.",
      photoSaveErrorMessage:
        "Foto konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
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
      language: "Deutsch",
      selectLanguage: "Sprache auswählen",
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
    },
    gallery: {
      title: "Galerie",
      deletePhoto: "Supprimer la Photo",
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
      photoSavedMessage: "Photo enregistrée dans la galerie avec succès.",
      photoSaveErrorMessage:
        "Échec de l'enregistrement de la photo. Veuillez réessayer.",
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
      language: "Français",
      selectLanguage: "Sélectionner la Langue",
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
