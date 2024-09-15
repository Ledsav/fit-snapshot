// src/contexts/PhotoContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Photo,
  getPhotos,
  savePhoto,
  deletePhoto,
} from "@/services/photoStorage";

interface PhotoContextType {
  photos: Photo[];
  addPhoto: (photo: Photo) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  refreshPhotos: () => Promise<void>;
  getPhotosByType: (type: "front" | "side" | "back") => Photo[];
  getLatestPhotoByType: (type: "front" | "side" | "back") => Photo | undefined;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export const PhotoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const refreshPhotos = async () => {
    const fetchedPhotos = await getPhotos();
    setPhotos(fetchedPhotos);
  };

  useEffect(() => {
    refreshPhotos();
  }, []);

  const addPhoto = async (photo: Photo) => {
    await savePhoto(photo);
    setPhotos((prevPhotos) => [...prevPhotos, photo]);
  };

  const removePhoto = async (id: string) => {
    await deletePhoto(id);
    setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== id));
  };

  const getPhotosByType = (type: "front" | "side" | "back") => {
    return photos.filter((photo) => photo.type === type);
  };

  const getLatestPhotoByType = (type: "front" | "side" | "back") => {
    const typedPhotos = getPhotosByType(type);
    return typedPhotos.length > 0
      ? typedPhotos[typedPhotos.length - 1]
      : undefined;
  };

  const value = {
    photos,
    addPhoto,
    removePhoto,
    refreshPhotos,
    getPhotosByType,
    getLatestPhotoByType,
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
