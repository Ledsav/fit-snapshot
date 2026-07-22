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
    thisWeek: string;
    pro: string;
    streakBest: string;
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
    confirmHelper: string;
    galleryPermissionDenied: string;
    imagePickerError: string;
    photoLimitReached: string;
    photosUsed: string;
    photoLimitMessage: string;
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
    selectAll: string;
    deselectAll: string;
    deleteConfirmMessage: string;
    deleteBulkConfirmMessage: string;
    gifsTitle: string;
    deleteGif: string;
    deleteGifConfirmMessage: string;
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
    takeMorePhotosHint: string;
    tapToChangeSelection: string;
    firstPhoto: string;
    secondPhoto: string;
    compareSelectedPhotos: string;
    gifGenerating: string;
    gifGenerateButton: string;
    gifRateLimitTitle: string;
    gifRateLimitMessage: string;
    gifErrorTitle: string;
    gifAuthRequired: string;
    gifGoToSettings: string;
    modeSlider: string;
    modeSideBySide: string;
    modeGif: string;
    modeGrid: string;
    modePair: string;
    view: string;
    change: string;
    syncedZoomSwap: string;
    syncedZoomReset: string;
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
    premiumActive: string;
    thankYouMessage: string;
    photos: string;
    limit: string;
    manageSubscription: string;
    upgradeToPremium: string;
    unlimitedPhotosAnalytics: string;
    photosUsed: string;
    seePlans: string;
    testPremium: string;
    on: string;
    off: string;
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
    consistency: string;
    thisWeek: string;
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
    before: string;
    after: string;
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
  paywall: {
    upgradeTitle: string;
    upgradeSubtitle: string;
    premiumBenefits: string;
    choosePlan: string;
    annual: string;
    monthly: string;
    lifetime: string;
    billedMonthly: string;
    oneTimePayment: string;
    mostPopular: string;
    save: string;
    processing: string;
    continueToPayment: string;
    cancelAnytime: string;
    trustLine: string;
    termsAgreement: string;
    perMonth: string;
    currency: string;
  };
  featureGate: {
    premiumFeature: string;
    pro: string;
    upgradeMessage: string;
    upgrade: string;
    upgradeNow: string;
  };
  premiumBenefits: {
    unlimitedStorageTitle: string;
    unlimitedStorageDesc: string;
    advancedAnalyticsTitle: string;
    advancedAnalyticsDesc: string;
    customComparisonsTitle: string;
    customComparisonsDesc: string;
    gifExportTitle: string;
    gifExportDesc: string;
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
      thisWeek: "This Week",
      pro: "Pro",
      streakBest: "Best",
    },
    camera: {
      title: "Camera",
      front: "Front",
      side: "Side",
      back: "Back",
      takePicture: "Take Picture",
      retake: "Retake",
      confirm: "Confirm",
      confirmHelper: "Review your photo before saving",
      permissionMessage: "We need your permission to show the camera",
      grantPermission: "Grant permission",
      galleryPermissionDenied: "We need media library permissions to import images",
      imagePickerError: "Error selecting image. Please try again",
      photoLimitReached: "Photo Limit Reached",
      photosUsed: "photos",
      photoLimitMessage: "You've reached the free tier limit. Upgrade to Premium for unlimited photos.",
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
      selectAll: "Select All",
      deselectAll: "Deselect All",
      deleteConfirmMessage: "This photo will be permanently deleted. This can't be undone.",
      deleteBulkConfirmMessage: "selected photos will be permanently deleted. This can't be undone.",
      gifsTitle: "GIFs",
      deleteGif: "Delete GIF",
      deleteGifConfirmMessage: "This GIF will be permanently deleted. This can't be undone.",
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
      takeMorePhotosHint: "Take more photos to see your progress over time",
      tapToChangeSelection: "Tap to change selection",
      firstPhoto: "1st Photo",
      secondPhoto: "2nd Photo",
      compareSelectedPhotos: "Compare Selected Photos",
      gifGenerating: "Generating GIF...",
      gifGenerateButton: "Generate Before/After GIF",
      gifRateLimitTitle: "Weekly Limit Reached",
      gifRateLimitMessage: "You can generate 1 GIF per week. Your next GIF will be available soon.",
      gifErrorTitle: "Unable to Generate GIF",
      gifAuthRequired: "Sign in required to generate GIFs",
      gifGoToSettings: "Go to Settings to Sign In",
      modeSlider: "Slider",
      modeSideBySide: "Side-by-side",
      modePair: "Pair",
      modeGif: "GIF",
      modeGrid: "Grid",
      view: "View",
      change: "Change",
      syncedZoomSwap: "Swap",
      syncedZoomReset: "Reset zoom",
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
      premiumActive: "Premium Active",
      thankYouMessage: "Thank you for supporting FitSnapshot!",
      photos: "Photos",
      limit: "Limit",
      manageSubscription: "Manage Subscription",
      upgradeToPremium: "Upgrade to Premium",
      unlimitedPhotosAnalytics: "Unlimited photos, analytics & more",
      photosUsed: "photos used",
      seePlans: "See Plans",
      testPremium: "Test Premium",
      on: "ON",
      off: "OFF",
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
      consistency: "consistency",
      thisWeek: "this week",
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
      before: "Before",
      after: "After",
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
    paywall: {
      upgradeTitle: "Upgrade to Premium",
      upgradeSubtitle: "Unlock unlimited photos, advanced analytics, and more",
      premiumBenefits: "Premium Benefits",
      choosePlan: "Choose Your Plan",
      annual: "Annual",
      monthly: "Monthly",
      lifetime: "Lifetime",
      billedMonthly: "Billed monthly",
      oneTimePayment: "One-time payment",
      mostPopular: "MOST POPULAR",
      save: "Save",
      processing: "Processing...",
      continueToPayment: "Continue to Payment",
      cancelAnytime: "Cancel anytime. No commitment.",
      trustLine: "Your photos stay yours either way.",
      termsAgreement: "By continuing, you agree to our Terms & Privacy Policy",
      perMonth: "/month",
      currency: "$",
    },
    featureGate: {
      premiumFeature: "Premium Feature",
      pro: "Pro",
      upgradeMessage: "Upgrade to Premium to unlock this feature",
      upgrade: "Upgrade",
      upgradeNow: "Upgrade Now",
    },
    premiumBenefits: {
      unlimitedStorageTitle: "Unlimited Photo Storage",
      unlimitedStorageDesc: "Free is capped at 20 photos — Premium removes the limit",
      advancedAnalyticsTitle: "Full Progress Analytics",
      advancedAnalyticsDesc: "Unlock your weekly activity chart, consistency heatmap, and achievement badges",
      customComparisonsTitle: "Custom Photo Comparisons",
      customComparisonsDesc: "Pick any two photos to compare, not just your oldest and newest",
      gifExportTitle: "Before/After GIF Export",
      gifExportDesc: "Create and save one before/after transformation GIF every month",
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
      thisWeek: "Esta Semana",
      pro: "Pro",
      streakBest: "Mejor",
    },
    camera: {
      title: "Cámara",
      front: "Frente",
      side: "Lado",
      back: "Espalda",
      takePicture: "Tomar Foto",
      retake: "Volver a Tomar",
      confirm: "Confirmar",
      confirmHelper: "Revisa tu foto antes de guardar",
      permissionMessage: "Necesitamos tu permiso para mostrar la cámara",
      grantPermission: "Conceder permiso",
      galleryPermissionDenied: "Necesitamos permisos para acceder a la galería de fotos",
      imagePickerError: "Error al seleccionar imagen. Por favor, inténtalo de nuevo",
      photoLimitReached: "Límite de Fotos Alcanzado",
      photosUsed: "fotos",
      photoLimitMessage: "Has alcanzado el límite del plan gratuito. Actualiza a Premium para fotos ilimitadas.",
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
      selectAll: "Seleccionar Todo",
      deselectAll: "Deseleccionar Todo",
      deleteConfirmMessage: "Esta foto se eliminará permanentemente. Esta acción no se puede deshacer.",
      deleteBulkConfirmMessage: "fotos seleccionadas se eliminarán permanentemente. Esta acción no se puede deshacer.",
      gifsTitle: "GIFs",
      deleteGif: "Eliminar GIF",
      deleteGifConfirmMessage: "Este GIF se eliminará permanentemente. Esta acción no se puede deshacer.",
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
      takeMorePhotosHint: "Toma más fotos para ver tu progreso con el tiempo",
      tapToChangeSelection: "Toca para cambiar selección",
      firstPhoto: "1ª Foto",
      secondPhoto: "2ª Foto",
      compareSelectedPhotos: "Comparar Fotos Seleccionadas",
      gifGenerating: "Generando GIF...",
      gifGenerateButton: "Generar GIF Antes/Después",
      gifRateLimitTitle: "Límite Semanal Alcanzado",
      gifRateLimitMessage: "Puedes generar 1 GIF por semana. Tu próximo GIF estará disponible pronto.",
      gifErrorTitle: "No se Puede Generar GIF",
      gifAuthRequired: "Se requiere iniciar sesión para generar GIFs",
      gifGoToSettings: "Ir a Configuración para Iniciar Sesión",
      modeSlider: "Deslizador",
      modeSideBySide: "Lado a lado",
      modePair: "Par",
      modeGif: "GIF",
      modeGrid: "Cuadrícula",
      view: "Vista",
      change: "Cambiar",
      syncedZoomSwap: "Intercambiar",
      syncedZoomReset: "Restablecer zoom",
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
      premiumActive: "Premium Activo",
      thankYouMessage: "¡Gracias por apoyar a FitSnapshot!",
      photos: "Fotos",
      limit: "Límite",
      manageSubscription: "Administrar Suscripción",
      upgradeToPremium: "Actualizar a Premium",
      unlimitedPhotosAnalytics: "Fotos ilimitadas, análisis y más",
      photosUsed: "fotos usadas",
      seePlans: "Ver Planes",
      testPremium: "Probar Premium",
      on: "ACTIVADO",
      off: "DESACTIVADO",
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
      consistency: "consistencia",
      thisWeek: "esta semana",
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
      before: "Antes",
      after: "Después",
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
    paywall: {
      upgradeTitle: "Actualizar a Premium",
      upgradeSubtitle: "Desbloquea fotos ilimitadas, análisis avanzados y más",
      premiumBenefits: "Beneficios Premium",
      choosePlan: "Elige tu Plan",
      annual: "Anual",
      monthly: "Mensual",
      lifetime: "De por Vida",
      billedMonthly: "Facturado mensualmente",
      oneTimePayment: "Pago único",
      mostPopular: "MÁS POPULAR",
      save: "Ahorra",
      processing: "Procesando...",
      continueToPayment: "Continuar al Pago",
      cancelAnytime: "Cancela en cualquier momento. Sin compromiso.",
      trustLine: "Tus fotos siguen siendo tuyas en cualquier caso.",
      termsAgreement: "Al continuar, aceptas nuestros Términos y Política de Privacidad",
      perMonth: "/mes",
      currency: "€",
    },
    featureGate: {
      premiumFeature: "Función Premium",
      pro: "Pro",
      upgradeMessage: "Actualiza a Premium para desbloquear esta función",
      upgrade: "Actualizar",
      upgradeNow: "Actualizar Ahora",
    },
    premiumBenefits: {
      unlimitedStorageTitle: "Almacenamiento Ilimitado de Fotos",
      unlimitedStorageDesc: "El plan gratuito tiene un límite de 20 fotos — Premium elimina el límite",
      advancedAnalyticsTitle: "Análisis Completo de Progreso",
      advancedAnalyticsDesc: "Desbloquea tu gráfico de actividad semanal, mapa de calor de constancia e insignias de logros",
      customComparisonsTitle: "Comparaciones de Fotos Personalizadas",
      customComparisonsDesc: "Elige dos fotos cualquiera para comparar, no solo la más antigua y la más reciente",
      gifExportTitle: "Exportación de GIF Antes/Después",
      gifExportDesc: "Crea y guarda un GIF de transformación antes/después cada mes",
    },
  },

  it: {
    home: {
      title: "Tracker Forma",
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
      thisWeek: "Questa Settimana",
      pro: "Pro",
      streakBest: "Migliore",
    },
    camera: {
      title: "Fotocamera",
      front: "Fronte",
      side: "Lato",
      back: "Retro",
      takePicture: "Scatta Foto",
      retake: "Rifare",
      confirm: "Conferma",
      confirmHelper: "Rivedi la tua foto prima di salvarla",
      permissionMessage:
        "Abbiamo bisogno del tuo permesso per mostrare la fotocamera",
      grantPermission: "Concedi permesso",
      galleryPermissionDenied: "Abbiamo bisogno del permesso per accedere alla galleria foto",
      imagePickerError: "Errore durante la selezione dell'immagine. Riprova",
      photoLimitReached: "Limite Foto Raggiunto",
      photosUsed: "foto",
      photoLimitMessage: "Hai raggiunto il limite del piano gratuito. Passa a Premium per foto illimitate.",
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
      selectAll: "Seleziona Tutto",
      deselectAll: "Deseleziona Tutto",
      deleteConfirmMessage: "Questa foto verrà eliminata definitivamente. Questa azione non può essere annullata.",
      deleteBulkConfirmMessage: "foto selezionate verranno eliminate definitivamente. Questa azione non può essere annullata.",
      gifsTitle: "GIF",
      deleteGif: "Elimina GIF",
      deleteGifConfirmMessage: "Questa GIF verrà eliminata definitivamente. Questa azione non può essere annullata.",
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
      takeMorePhotosHint: "Scatta più foto per vedere i tuoi progressi nel tempo",
      tapToChangeSelection: "Tocca per cambiare selezione",
      firstPhoto: "1ª Foto",
      secondPhoto: "2ª Foto",
      compareSelectedPhotos: "Confronta Foto Selezionate",
      gifGenerating: "Generazione GIF...",
      gifGenerateButton: "Genera GIF Prima/Dopo",
      gifRateLimitTitle: "Limite Settimanale Raggiunto",
      gifRateLimitMessage: "Puoi generare 1 GIF a settimana. La tua prossima GIF sarà disponibile pronto.",
      gifErrorTitle: "Impossibile Generare GIF",
      gifAuthRequired: "Accesso richiesto per generare GIF",
      gifGoToSettings: "Vai alle Impostazioni per Accedere",
      modeSlider: "Slider",
      modeSideBySide: "Affiancate",
      modePair: "Coppia",
      modeGif: "GIF",
      modeGrid: "Griglia",
      view: "Vista",
      change: "Cambia",
      syncedZoomSwap: "Scambia",
      syncedZoomReset: "Reimposta zoom",
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
      premiumActive: "Premium Attivo",
      thankYouMessage: "Grazie per il supporto a FitSnapshot!",
      photos: "Foto",
      limit: "Limite",
      manageSubscription: "Gestisci Abbonamento",
      upgradeToPremium: "Passa a Premium",
      unlimitedPhotosAnalytics: "Foto illimitate, analisi e altro",
      photosUsed: "foto utilizzate",
      seePlans: "Vedi Piani",
      testPremium: "Testa Premium",
      on: "ATTIVO",
      off: "DISATTIVO",
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
      consistency: "costanza",
      thisWeek: "questa settimana",
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
      before: "Prima",
      after: "Dopo",
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
    paywall: {
      upgradeTitle: "Passa a Premium",
      upgradeSubtitle: "Sblocca foto illimitate, analisi avanzate e altro",
      premiumBenefits: "Vantaggi Premium",
      choosePlan: "Scegli il Tuo Piano",
      annual: "Annuale",
      monthly: "Mensile",
      lifetime: "A Vita",
      billedMonthly: "Costo mensile",
      oneTimePayment: "Pagamento unico",
      mostPopular: "PIÙ POPOLARE",
      save: "Risparmia",
      processing: "Elaborazione...",
      continueToPayment: "Continua al Pagamento",
      cancelAnytime: "Annulla in qualsiasi momento. Nessun impegno.",
      trustLine: "Le tue foto restano tue in ogni caso.",
      termsAgreement: "Continuando, accetti i nostri Termini e la Politica sulla Privacy",
      perMonth: "/mese",
      currency: "€",
    },
    featureGate: {
      premiumFeature: "Funzione Premium",
      pro: "Pro",
      upgradeMessage: "Passa a Premium per sbloccare questa funzione",
      upgrade: "Aggiorna",
      upgradeNow: "Aggiorna Ora",
    },
    premiumBenefits: {
      unlimitedStorageTitle: "Archiviazione Foto Illimitata",
      unlimitedStorageDesc: "Il piano gratuito è limitato a 20 foto — Premium rimuove il limite",
      advancedAnalyticsTitle: "Analisi Complete dei Progressi",
      advancedAnalyticsDesc: "Sblocca il grafico dell'attività settimanale, la heatmap di costanza e i badge dei traguardi",
      customComparisonsTitle: "Confronti Foto Personalizzati",
      customComparisonsDesc: "Scegli due foto qualsiasi da confrontare, non solo la più vecchia e la più recente",
      gifExportTitle: "Esportazione GIF Prima/Dopo",
      gifExportDesc: "Crea e salva una GIF di trasformazione prima/dopo ogni mese",
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
      thisWeek: "Diese Woche",
      pro: "Pro",
      streakBest: "Beste",
    },
    camera: {
      title: "Kamera",
      front: "Vorderseite",
      side: "Seite",
      back: "Rückseite",
      takePicture: "Foto aufnehmen",
      retake: "Neu aufnehmen",
      confirm: "Bestätigen",
      confirmHelper: "Überprüfen Sie Ihr Foto vor dem Speichern",
      permissionMessage:
        "Wir benötigen Ihre Erlaubnis, um die Kamera zu zeigen",
      grantPermission: "Erlaubnis erteilen",
      galleryPermissionDenied: "Wir benötigen die Berechtigung zum Zugriff auf die Fotogalerie",
      imagePickerError: "Fehler beim Auswählen des Bildes. Bitte versuchen Sie es erneut",
      photoLimitReached: "Fotolimit Erreicht",
      photosUsed: "Fotos",
      photoLimitMessage: "Sie haben das Limit des kostenlosen Plans erreicht. Upgraden Sie auf Premium für unbegrenzte Fotos.",
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
      selectAll: "Alle Auswählen",
      deselectAll: "Alle Abwählen",
      deleteConfirmMessage: "Dieses Foto wird dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.",
      deleteBulkConfirmMessage: "ausgewählte Fotos werden dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.",
      gifsTitle: "GIFs",
      deleteGif: "GIF löschen",
      deleteGifConfirmMessage: "Dieses GIF wird dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.",
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
      takeMorePhotosHint: "Machen Sie mehr Fotos, um Ihren Fortschritt im Laufe der Zeit zu sehen",
      tapToChangeSelection: "Tippen, um Auswahl zu ändern",
      firstPhoto: "1. Foto",
      secondPhoto: "2. Foto",
      compareSelectedPhotos: "Ausgewählte Fotos Vergleichen",
      gifGenerating: "GIF wird erstellt...",
      gifGenerateButton: "Vorher/Nachher-GIF Erstellen",
      gifRateLimitTitle: "Wöchentliches Limit Erreicht",
      gifRateLimitMessage: "Sie können 1 GIF pro Woche erstellen. Ihr nächstes GIF wird bald verfügbar sein.",
      gifErrorTitle: "GIF Konnte Nicht Erstellt Werden",
      gifAuthRequired: "Anmeldung erforderlich zum Erstellen von GIFs",
      gifGoToSettings: "Zu Einstellungen Gehen um sich Anzumelden",
      modeSlider: "Schieberegler",
      modeSideBySide: "Nebeneinander",
      modePair: "Paar",
      modeGif: "GIF",
      modeGrid: "Raster",
      view: "Ansicht",
      change: "Ändern",
      syncedZoomSwap: "Tauschen",
      syncedZoomReset: "Zoom zurücksetzen",
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
      premiumActive: "Premium Aktiv",
      thankYouMessage: "Vielen Dank für die Unterstützung von FitSnapshot!",
      photos: "Fotos",
      limit: "Limit",
      manageSubscription: "Abonnement Verwalten",
      upgradeToPremium: "Auf Premium Upgraden",
      unlimitedPhotosAnalytics: "Unbegrenzte Fotos, Analysen & mehr",
      photosUsed: "Fotos verwendet",
      seePlans: "Pläne Ansehen",
      testPremium: "Premium Testen",
      on: "AN",
      off: "AUS",
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
      consistency: "Konsistenz",
      thisWeek: "diese Woche",
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
      before: "Vorher",
      after: "Nachher",
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
    paywall: {
      upgradeTitle: "Auf Premium upgraden",
      upgradeSubtitle: "Unbegrenzte Fotos, erweiterte Analysen und mehr freischalten",
      premiumBenefits: "Premium-Vorteile",
      choosePlan: "Wählen Sie Ihren Plan",
      annual: "Jährlich",
      monthly: "Monatlich",
      lifetime: "Lebenslang",
      billedMonthly: "Monatlich abgerechnet",
      oneTimePayment: "Einmalige Zahlung",
      mostPopular: "AM BELIEBTESTEN",
      save: "Sparen",
      processing: "Verarbeitung...",
      continueToPayment: "Weiter zur Zahlung",
      cancelAnytime: "Jederzeit kündbar. Keine Verpflichtung.",
      trustLine: "Deine Fotos bleiben so oder so deine.",
      termsAgreement: "Indem Sie fortfahren, stimmen Sie unseren Bedingungen und Datenschutzrichtlinien zu",
      perMonth: "/Monat",
      currency: "€",
    },
    featureGate: {
      premiumFeature: "Premium-Funktion",
      pro: "Pro",
      upgradeMessage: "Upgraden Sie auf Premium, um diese Funktion freizuschalten",
      upgrade: "Upgraden",
      upgradeNow: "Jetzt Upgraden",
    },
    premiumBenefits: {
      unlimitedStorageTitle: "Unbegrenzter Fotospeicher",
      unlimitedStorageDesc: "Die kostenlose Version ist auf 20 Fotos begrenzt — Premium hebt das Limit auf",
      advancedAnalyticsTitle: "Vollständige Fortschrittsanalyse",
      advancedAnalyticsDesc: "Schalten Sie Ihr wöchentliches Aktivitätsdiagramm, die Konsistenz-Heatmap und Erfolgs-Abzeichen frei",
      customComparisonsTitle: "Individuelle Fotovergleiche",
      customComparisonsDesc: "Wählen Sie zwei beliebige Fotos zum Vergleich aus, nicht nur das älteste und neueste",
      gifExportTitle: "Vorher/Nachher-GIF-Export",
      gifExportDesc: "Erstellen und speichern Sie jeden Monat ein Vorher/Nachher-Transformations-GIF",
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
      thisWeek: "Cette Semaine",
      pro: "Pro",
      streakBest: "Record",
    },
    camera: {
      title: "Appareil Photo",
      front: "Face",
      side: "Côté",
      back: "Dos",
      takePicture: "Prendre une Photo",
      retake: "Reprendre",
      confirm: "Confirmer",
      confirmHelper: "Vérifiez votre photo avant de l'enregistrer",
      permissionMessage:
        "Nous avons besoin de votre permission pour afficher l'appareil photo",
      grantPermission: "Accorder la permission",
      galleryPermissionDenied: "Nous avons besoin de l'autorisation d'accéder à la galerie de photos",
      imagePickerError: "Erreur lors de la sélection de l'image. Veuillez réessayer",
      photoLimitReached: "Limite de Photos Atteinte",
      photosUsed: "photos",
      photoLimitMessage: "Vous avez atteint la limite du plan gratuit. Passez à Premium pour des photos illimitées.",
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
      selectAll: "Tout Sélectionner",
      deselectAll: "Tout Désélectionner",
      deleteConfirmMessage: "Cette photo sera définitivement supprimée. Cette action est irréversible.",
      deleteBulkConfirmMessage: "photos sélectionnées seront définitivement supprimées. Cette action est irréversible.",
      gifsTitle: "GIFs",
      deleteGif: "Supprimer le GIF",
      deleteGifConfirmMessage: "Ce GIF sera définitivement supprimé. Cette action est irréversible.",
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
      takeMorePhotosHint: "Prenez plus de photos pour voir vos progrès au fil du temps",
      tapToChangeSelection: "Appuyez pour changer la sélection",
      firstPhoto: "1ère Photo",
      secondPhoto: "2ème Photo",
      compareSelectedPhotos: "Comparer les Photos Sélectionnées",
      gifGenerating: "Génération du GIF...",
      gifGenerateButton: "Générer un GIF Avant/Après",
      gifRateLimitTitle: "Limite Hebdomadaire Atteinte",
      gifRateLimitMessage: "Vous pouvez générer 1 GIF par semaine. Votre prochain GIF sera bientôt disponible.",
      gifErrorTitle: "Impossible de Générer le GIF",
      gifAuthRequired: "Connexion requise pour générer des GIF",
      gifGoToSettings: "Aller aux Paramètres pour se Connecter",
      modeSlider: "Curseur",
      modeSideBySide: "Côte à côte",
      modePair: "Paire",
      modeGif: "GIF",
      modeGrid: "Grille",
      view: "Vue",
      change: "Changer",
      syncedZoomSwap: "Inverser",
      syncedZoomReset: "Réinitialiser le zoom",
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
      premiumActive: "Premium Actif",
      thankYouMessage: "Merci de soutenir FitSnapshot!",
      photos: "Photos",
      limit: "Limite",
      manageSubscription: "Gérer l'Abonnement",
      upgradeToPremium: "Passer à Premium",
      unlimitedPhotosAnalytics: "Photos illimitées, analyses & plus",
      photosUsed: "photos utilisées",
      seePlans: "Voir les Plans",
      testPremium: "Tester Premium",
      on: "ACTIVÉ",
      off: "DÉSACTIVÉ",
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
      consistency: "constance",
      thisWeek: "cette semaine",
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
      before: "Avant",
      after: "Après",
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
    paywall: {
      upgradeTitle: "Passer à Premium",
      upgradeSubtitle: "Débloquez des photos illimitées, des analyses avancées et plus encore",
      premiumBenefits: "Avantages Premium",
      choosePlan: "Choisissez Votre Plan",
      annual: "Annuel",
      monthly: "Mensuel",
      lifetime: "À Vie",
      billedMonthly: "Facturé mensuellement",
      oneTimePayment: "Paiement unique",
      mostPopular: "LE PLUS POPULAIRE",
      save: "Économiser",
      processing: "Traitement...",
      continueToPayment: "Continuer vers le Paiement",
      cancelAnytime: "Annulez à tout moment. Aucun engagement.",
      trustLine: "Vos photos restent les vôtres, quoi qu'il arrive.",
      termsAgreement: "En continuant, vous acceptez nos Conditions et notre Politique de Confidentialité",
      perMonth: "/mois",
      currency: "€",
    },
    featureGate: {
      premiumFeature: "Fonctionnalité Premium",
      pro: "Pro",
      upgradeMessage: "Passez à Premium pour débloquer cette fonctionnalité",
      upgrade: "Mettre à Niveau",
      upgradeNow: "Mettre à Niveau Maintenant",
    },
    premiumBenefits: {
      unlimitedStorageTitle: "Stockage de Photos Illimité",
      unlimitedStorageDesc: "La version gratuite est limitée à 20 photos — Premium supprime la limite",
      advancedAnalyticsTitle: "Analyses Complètes de Progression",
      advancedAnalyticsDesc: "Débloquez votre graphique d'activité hebdomadaire, votre carte de chaleur de régularité et vos badges de réussite",
      customComparisonsTitle: "Comparaisons de Photos Personnalisées",
      customComparisonsDesc: "Choisissez deux photos quelconques à comparer, pas seulement la plus ancienne et la plus récente",
      gifExportTitle: "Export GIF Avant/Après",
      gifExportDesc: "Créez et enregistrez un GIF de transformation avant/après chaque mois",
    },
  },
};
