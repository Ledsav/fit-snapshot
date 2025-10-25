import { PhotoType } from "@/enums/Photos";
import featureFlagService from "@/services/featureFlagService";
import {
  Photo,
  cleanupOrphanedFiles,
  deletePhoto,
  getPhotos,
  getStorageInfo,
  savePhoto,
} from "@/services/photoStorage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface PhotoContextType {
  photos: Photo[];
  addPhoto: (photo: Photo) => Promise<{ success: boolean; error?: string }>;
  removePhoto: (id: string) => Promise<void>;
  refreshPhotos: () => Promise<void>;
  getPhotosByType: (type: PhotoType) => Photo[];
  getLatestPhotoByType: (type: PhotoType) => Photo | undefined;
  getStorageInfo: () => Promise<{
    totalPhotos: number;
    directorySize: number;
    directoryPath: string;
  }>;
  cleanupStorage: () => Promise<void>;
  canAddPhoto: () => { allowed: boolean; reason?: string; limit?: number };
  isLoading: boolean;
  error: string | null;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export const PhotoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPhotos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      
      const fetchedPhotos = await getPhotos();
      setPhotos(fetchedPhotos);
    } catch (err) {
      setError("Failed to load photos. Please try again.");
      console.error("Error refreshing photos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStorageInfoWrapper = async () => {
    return await getStorageInfo();
  };

  const cleanupStorage = async () => {
    setIsLoading(true);
    try {
      await cleanupOrphanedFiles();
      await refreshPhotos(); 
    } catch (err) {
      setError("Failed to cleanup storage. Please try again.");
      console.error("Error cleaning up storage:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPhotos();
  }, []);

  const canAddPhoto = () => {
    return featureFlagService.canAddPhoto();
  };

  const addPhoto = async (photo: Photo): Promise<{ success: boolean; error?: string }> => {
    
    const canAdd = featureFlagService.canAddPhoto();
    if (!canAdd.allowed) {
      return { success: false, error: canAdd.reason };
    }

    setIsLoading(true);
    setError(null);
    try {
      await savePhoto(photo);
      await featureFlagService.incrementPhotoCount();
      setPhotos((prevPhotos) => [...prevPhotos, photo]);
      return { success: true };
    } catch (err) {
      const errorMessage = "Failed to add photo. Please try again.";
      setError(errorMessage);
      console.error("Error adding photo:", err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deletePhoto(id);
      await featureFlagService.decrementPhotoCount();
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== id));
    } catch (err) {
      setError("Failed to remove photo. Please try again.");
      console.error("Error removing photo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPhotosByType = (type: PhotoType) => {
    return photos
      .filter((photo) => photo.type === type)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getLatestPhotoByType = (type: PhotoType) => {
    const typedPhotos = getPhotosByType(type);
    return typedPhotos.length > 0
      ? typedPhotos[typedPhotos.length - 1]
      : undefined;
  };

  const value: PhotoContextType = {
    photos,
    addPhoto,
    removePhoto,
    refreshPhotos,
    getPhotosByType,
    getLatestPhotoByType,
    getStorageInfo: getStorageInfoWrapper,
    cleanupStorage,
    canAddPhoto,
    isLoading,
    error,
  };

  return (
    <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>
  );
};

export const usePhotos = () => {
  const context = useContext(PhotoContext);
  if (context === undefined) {
    throw new Error("usePhotos must be used within a PhotoProvider");
  }
  return context;
};
