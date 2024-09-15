import React, { createContext, useState, useContext, useEffect } from "react";
import * as Localization from "expo-localization";
import { translations } from "@/localization/translations";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LocalizationContextType = {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(
  undefined
);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocale] = useState(Localization.locale.split("-")[0]);

  useEffect(() => {
    AsyncStorage.getItem("userLocale").then((savedLocale) => {
      if (savedLocale) {
        setLocale(savedLocale);
      }
    });
  }, []);

  const setLocaleAndSave = (newLocale: string) => {
    setLocale(newLocale);
    AsyncStorage.setItem("userLocale", newLocale);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let translation: any = translations[locale] || translations.en;

    for (const k of keys) {
      translation = translation[k];
      if (!translation) break;
    }

    return translation || key;
  };

  return (
    <LocalizationContext.Provider
      value={{ t, locale, setLocale: setLocaleAndSave }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error(
      "useLocalization must be used within a LocalizationProvider"
    );
  }
  return context;
};
