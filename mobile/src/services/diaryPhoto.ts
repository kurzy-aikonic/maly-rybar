import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "react-native";

import { supabase } from "../lib/supabase";

export const CATCH_PHOTOS_BUCKET = "catch-photos";

/**
 * V databazi je jen retezec cesty (desitky bajtu na zaznam) — zadny obrazovy blob.
 * Objem dat je ve Storage; WebP = typicky mensi nez JPEG pri stejne srozitelnosti (bezne u webu).
 */
const MAX_EDGE_PX = 1280;
const WEBP_QUALITY = 0.78;

async function prepareWebImageForUpload(localUri: string): Promise<string> {
  try {
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(localUri, (w, h) => resolve({ width: w, height: h }), reject);
    });

    const maxSide = Math.max(width, height);
    const resize =
      maxSide > MAX_EDGE_PX
        ? width >= height
          ? [{ resize: { width: MAX_EDGE_PX } }]
          : [{ resize: { height: MAX_EDGE_PX } }]
        : [];

    const manipulated = await ImageManipulator.manipulateAsync(localUri, resize, {
      compress: WEBP_QUALITY,
      format: ImageManipulator.SaveFormat.WEBP
    });
    return manipulated.uri;
  } catch {
    const manipulated = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: MAX_EDGE_PX } }],
      { compress: WEBP_QUALITY, format: ImageManipulator.SaveFormat.WEBP }
    );
    return manipulated.uri;
  }
}

/** Nahraje WebP do Supabase Storage; vraci cestu pro `photo_storage_path`. */
export async function uploadCatchPhoto(userId: string, clientId: string, localUri: string): Promise<string> {
  const path = `${userId}/${clientId}.webp`;
  const outUri = await prepareWebImageForUpload(localUri);
  const response = await fetch(outUri);
  const blob = await response.blob();
  const { error } = await supabase.storage.from(CATCH_PHOTOS_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: "image/webp"
  });
  if (error) throw error;
  return path;
}

export async function deleteCatchPhoto(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(CATCH_PHOTOS_BUCKET).remove([storagePath]);
  if (error) throw error;
}

export async function getCatchPhotoSignedUrl(
  storagePath: string,
  ttlSec = 7200
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CATCH_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, ttlSec);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
