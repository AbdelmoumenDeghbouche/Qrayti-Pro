import React, { useState, useCallback } from 'react';

interface ImageUploadProps {
  onImagesChange: (files: File[], dataUrls: string[]) => void;
  currentImageUrls: string[];
  onClearImages: () => void;
}

const MAX_IMAGES_UPLOAD = 5; // Maximum number of images that can be uploaded

const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesChange, currentImageUrls, onClearImages }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    if (selectedFiles.length > MAX_IMAGES_UPLOAD) {
      setError(`يمكنك تحميل ${MAX_IMAGES_UPLOAD} صور كحد أقصى في المرة الواحدة.`);
      event.target.value = ''; // Reset file input
      return;
    }

    const newFiles: File[] = [];
    const newDataUrls: string[] = [];
    let processingError: string | null = null;

    const filePromises = Array.from(selectedFiles).map(file => {
      return new Promise<void>((resolve, reject) => {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
          processingError = (processingError || '') + `الملف ${file.name}: نوع ملف غير صالح. يرجى تحميل JPG, PNG, WEBP أو GIF. `;
          reject(new Error('Invalid file type'));
          return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit per file
          processingError = (processingError || '') + `الملف ${file.name}: كبير جداً. الحد الأقصى 5 ميجابايت. `;
          reject(new Error('File too large'));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          newFiles.push(file);
          newDataUrls.push(reader.result as string);
          resolve();
        };
        reader.onerror = () => {
          processingError = (processingError || '') + `الملف ${file.name}: فشل في القراءة. `;
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      await Promise.all(filePromises);
    } catch (e) {
      // Errors are collected in processingError
    }

    if (processingError) {
      setError(processingError.trim());
    }

    if (newFiles.length > 0) {
      onImagesChange(newFiles, newDataUrls);
    }
    
    event.target.value = ''; // Reset file input to allow re-selecting the same file(s)
  }, [onImagesChange]);

  const handleClear = () => {
    setError(null);
    onClearImages();
  }

  return (
    <div className="space-y-8"> {/* Increased spacing */}
      <div>
        <input
          id="image-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileChange}
          className="sr-only"
        />
        <label
          htmlFor="image-upload"
          className="mt-2 flex flex-col items-center justify-center w-full min-h-[220px] sm:min-h-[250px] px-6 py-10 border-2 border-teal-400 dark:border-teal-600/70 border-dashed rounded-2xl cursor-pointer bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 transition-all duration-200 ease-in-out group"
        >
          <svg className="w-16 h-16 mb-4 text-teal-500 dark:text-teal-400 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <span className="text-xl sm:text-2xl font-semibold text-teal-700 dark:text-teal-300 group-hover:text-teal-800 dark:group-hover:text-teal-200 transition-colors">اختر صور الدرس أو اسحبها هنا</span>
          <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
            (الحد الأقصى {MAX_IMAGES_UPLOAD} صور، 5 ميجا لكل ملف، JPG/PNG/WEBP/GIF)
          </p>
        </label>
        {error && <p className="text-lg text-rose-600 dark:text-rose-400 mt-3">{error}</p>}
      </div>
      
      {currentImageUrls.length > 0 && (
        <div className="mt-8 space-y-5">
          <div className="flex justify-between items-center">
            <p className="text-xl font-medium text-slate-700 dark:text-slate-200">الصور المرفوعة ({currentImageUrls.length}):</p>
            <button
              onClick={handleClear}
              className="px-5 py-2 text-base font-medium text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-800/50 hover:bg-rose-200 dark:hover:bg-rose-700/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-rose-500 dark:focus:ring-offset-slate-800 transition-colors"
            >
              مسح كل الصور
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"> {/* Increased gap */}
            {currentImageUrls.map((url, index) => (
              <div key={index} className="border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 aspect-w-1 aspect-h-1 flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={url} 
                  alt={`Uploaded preview ${index + 1}`} 
                  className="max-w-full max-h-full object-contain rounded-md" 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;