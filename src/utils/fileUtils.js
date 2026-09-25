/**
 * Utilities for client-side file compression and Base64 conversion
 * Strictly adheres to Google Apps Script payload expectations.
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB max pre-compression
export const TARGET_MAX_WIDTH = 1800;
export const TARGET_MAX_HEIGHT = 1800;
export const COMPRESSION_QUALITY = 0.82;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

/**
 * Format bytes to readable string (e.g. "1.4 MB")
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Compresses an image client-side using an HTML canvas if larger than threshold,
 * preserving crisp readability of text and screenshot details.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function optimizeImageFile(file) {
  // If not an image or already small enough (< 300KB) and not oversized, return as-is
  if (!file.type.startsWith("image/") || file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Check if downscaling is necessary
        let needsResize = false;
        if (width > TARGET_MAX_WIDTH || height > TARGET_MAX_HEIGHT) {
          needsResize = true;
          if (width > height) {
            height = Math.round((height * TARGET_MAX_WIDTH) / width);
            width = TARGET_MAX_WIDTH;
          } else {
            width = Math.round((width * TARGET_MAX_HEIGHT) / height);
            height = TARGET_MAX_HEIGHT;
          }
        }

        // If file is PNG and doesn't need resize, keep PNG to preserve text sharpness
        const isPng = file.type === "image/png";
        if (isPng && !needsResize && file.size < 1024 * 1024) {
          resolve(file);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // White background for transparent PNGs converted to JPEG if desired, or keep PNG
        if (isPng && file.size > 1.5 * 1024 * 1024) {
          // Convert heavy PNG to crisp JPEG
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const optimizedFile = new File([blob], file.name.replace(/\.png$/i, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now()
                });
                resolve(optimizedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            COMPRESSION_QUALITY
          );
        } else {
          ctx.drawImage(img, 0, 0, width, height);
          const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const quality = outputType === "image/jpeg" ? COMPRESSION_QUALITY : undefined;

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const optimizedFile = new File([blob], file.name, {
                  type: outputType,
                  lastModified: Date.now()
                });
                resolve(optimizedFile);
              } else {
                resolve(file);
              }
            },
            outputType,
            quality
          );
        }
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a file to pure Base64 without data URL prefix:
 * {
 *   name: "ticket9.png",
 *   mimeType: "image/png",
 *   data: "iVBORw0KGgo..."
 * }
 * @param {File} file
 * @returns {Promise<{name: string, mimeType: string, data: string}>}
 */
export async function fileToBase64(file) {
  // Optimize large screenshot first
  const processedFile = await optimizeImageFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("Failed to read file as string"));
        return;
      }

      // Remove the data URL prefix (e.g., 'data:image/png;base64,')
      const commaIndex = dataUrl.indexOf(",");
      const base64WithoutPrefix = commaIndex !== -1 ? dataUrl.substring(commaIndex + 1) : dataUrl;

      resolve({
        name: processedFile.name,
        mimeType: processedFile.type || "image/png",
        data: base64WithoutPrefix
      });
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(processedFile);
  });
}
