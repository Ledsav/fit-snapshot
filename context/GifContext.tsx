import {
  GeneratedGif,
  deleteGif,
  getGifs,
  saveGif,
} from "@/services/gifStorage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface GifContextType {
  gifs: GeneratedGif[];
  addGif: (gif: { id: string; uri: string; date: string }) => Promise<{ success: boolean; error?: string }>;
  removeGif: (id: string) => Promise<void>;
  refreshGifs: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const GifContext = createContext<GifContextType | undefined>(undefined);

export const GifProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gifs, setGifs] = useState<GeneratedGif[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshGifs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedGifs = await getGifs();
      setGifs(fetchedGifs);
    } catch (err) {
      setError("Failed to load GIFs. Please try again.");
      console.error("Error refreshing GIFs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshGifs();
  }, []);

  const addGif = async (gif: { id: string; uri: string; date: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      await saveGif(gif);
      await refreshGifs();
      return { success: true };
    } catch (err) {
      const errorMessage = "Failed to save GIF. Please try again.";
      setError(errorMessage);
      console.error("Error adding GIF:", err);
      return { success: false, error: errorMessage };
    }
  };

  const removeGif = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteGif(id);
      setGifs((prevGifs) => prevGifs.filter((gif) => gif.id !== id));
    } catch (err) {
      setError("Failed to remove GIF. Please try again.");
      console.error("Error removing GIF:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: GifContextType = {
    gifs,
    addGif,
    removeGif,
    refreshGifs,
    isLoading,
    error,
  };

  return <GifContext.Provider value={value}>{children}</GifContext.Provider>;
};

export const useGifs = () => {
  const context = useContext(GifContext);
  if (context === undefined) {
    throw new Error("useGifs must be used within a GifProvider");
  }
  return context;
};
