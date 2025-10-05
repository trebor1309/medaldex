// /js/image-utils.js
/**
 * Redimensionne une image avant upload
 * @param {File} file - fichier image d'origine
 * @param {number} maxSize - dimension maximale (1080 par défaut)
 * @returns {Promise<File>} - nouvelle image compressée
 */
export async function resizeImage(file, maxSize = 1080) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width = img.width * scale;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Erreur conversion image"));
          const resizedFile = new File([blob], file.name, { type: file.type });
          resolve(resizedFile);
        },
        file.type,
        0.85 // compression JPEG 85 %
      );
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
