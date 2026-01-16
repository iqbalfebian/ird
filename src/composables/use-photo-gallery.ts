import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { onMounted, ref, watch } from "vue";
import { ref, watch, onMounted } from "vue";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import type { Photo } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { isPlatform } from "@ionic/vue";
import { Capacitor } from "@capacitor/core";

export const usePhotoGallery = () => {
  const photos = ref<UserPhoto[]>([]);

  const PHOTO_STORAGE = "photos";

  const addNewToGallery = async () => {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });

    const fileName = Date.now() + ".jpeg";
    const savedImageFile = await savePicture(capturedPhoto, fileName);

    photos.value = [savedImageFile, ...photos.value];
  };

  // CHANGE: Update `savePicture()` method
  const savePicture = async (
    photo: Photo,
    fileName: string
  ): Promise<UserPhoto> => {
    let base64Data: string | Blob;

    // CHANGE: Add platform check
    // "hybrid" will detect mobile - iOS or Android
    if (isPlatform("hybrid")) {
      const readFile = await Filesystem.readFile({
        path: photo.path!,
      });
      base64Data = readFile.data;
    } else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      base64Data = (await convertBlobToBase64(blob)) as string;
    }

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    // CHANGE: Add platform check
    if (isPlatform("hybrid")) {
      // Display the new image by rewriting the 'file://' path to HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
      };
    }
  };

  const convertBlobToBase64 = (blob: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  };

  const cachePhotos = () => {
    Preferences.set({
      key: PHOTO_STORAGE,
      value: JSON.stringify(photos.value),
    });
  };

  // CHANGE: Update `loadSaved` method
  const loadSaved = async () => {
    const photoList = await Preferences.get({ key: PHOTO_STORAGE });
    const photosInPreferences = photoList.value
      ? JSON.parse(photoList.value)
      : [];

    // CHANGE: Add platform check
    // If running on the web...
    if (!isPlatform("hybrid")) {
      for (const photo of photosInPreferences) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });
        // Web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }

    photos.value = photosInPreferences;
  };

  const deletePhoto = async (photo: UserPhoto) => {
    // Remove this photo from the Photos reference data array
    photos.value = photos.value.filter((p) => p.filepath !== photo.filepath);

    // Delete photo file from filesystem
    const filename = photo.filepath.slice(photo.filepath.lastIndexOf("/") + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
  };

  // CHANGE: Add call to `onMounted()` with the `loadSaved()` method
  onMounted(loadSaved);
  watch(photos, cachePhotos);

  return {
    addNewToGallery,
    photos,
    deletePhoto,
  };
};

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}
