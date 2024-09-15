import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Photo,
  getPhotos,
  savePhoto,
  deletePhoto,
} from "@/services/photoStorage";
import { PhotoType } from "@/enums/Photos";

interface PhotoContextType {
  photos: Photo[];
  addPhoto: (photo: Photo) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  refreshPhotos: () => Promise<void>;
  getPhotosByType: (type: PhotoType) => Photo[];
  getLatestPhotoByType: (type: PhotoType) => Photo | undefined;
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

  useEffect(() => {
    refreshPhotos();
  }, []);

  const addPhoto = async (photo: Photo) => {
    setIsLoading(true);
    setError(null);
    try {
      await savePhoto(photo);
      setPhotos((prevPhotos) => [...prevPhotos, photo]);
    } catch (err) {
      setError("Failed to add photo. Please try again.");
      console.error("Error adding photo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deletePhoto(id);
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== id));
    } catch (err) {
      setError("Failed to remove photo. Please try again.");
      console.error("Error removing photo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPhotosByType = (type: PhotoType) => {
    return photos.filter((photo) => photo.type === type);
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
