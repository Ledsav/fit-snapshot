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
    },
  },
};
