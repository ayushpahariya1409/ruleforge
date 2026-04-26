import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineCloudArrowUp, HiOutlineDocumentCheck, HiOutlineDocumentText, HiOutlineXMark } from 'react-icons/hi2';
import Button from '../shared/Button';

const FileDropzone = ({ onFileSelect, currentFile = null }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localFile, setLocalFile] = useState(null);

  const displayFile = localFile || currentFile;

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const allowedExts = ['.xlsx', '.xls', '.csv'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (allowedExts.includes(ext)) {
        setLocalFile(file);
        onFileSelect(file);
      } else {
        toast.error('Please select an Excel (.xlsx, .xls) or CSV (.csv) file');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExts = ['.xlsx', '.xls', '.csv'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (allowedExts.includes(ext)) {
        setLocalFile(file);
        onFileSelect(file);
      } else {
        toast.error('Please select an Excel (.xlsx, .xls) or CSV (.csv) file');
        e.target.value = ''; // Clear the input
      }
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setLocalFile(null);
    onFileSelect(null);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group w-full p-12 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden ${
        isDragging
          ? 'border-primary-500 bg-primary-600/5 shadow-lg shadow-primary-500/10 scale-[1.01]'
          : displayFile
          ? 'border-success-500/50 bg-success-500/5'
          : 'border-gray-300 bg-gray-50 hover:bg-white hover:border-primary-400'
      }`}
      onClick={() => document.getElementById('file-upload').click()}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileInput}
      />

      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
        displayFile ? 'bg-success-500/20 text-success-500' : 'bg-gray-100 text-gray-400 group-hover:bg-primary-600/20 group-hover:text-primary-400 group-hover:scale-110'
      }`}>
        {displayFile ? (
          <HiOutlineDocumentCheck className="w-10 h-10 animate-scale-in" />
        ) : (
          <HiOutlineCloudArrowUp className="w-10 h-10" />
        )}
      </div>

      {displayFile ? (
        <div className="animate-fade-in z-10">
          <p className="text-xl font-bold text-gray-900 mb-2 truncate max-w-md">{displayFile.name}</p>
          <p className="text-sm text-gray-500 mb-6">
            {displayFile.size ? `${(displayFile.size / 1024).toFixed(1)} KB — ` : ''}Ready for evaluation
          </p>
          
          <div className="flex gap-3 justify-center items-center">
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 text-primary-800 text-sm border border-primary-200">
               <HiOutlineDocumentText className="w-4 h-4 text-primary-400" />
               Excel File Detected
             </div>
             <button
                onClick={removeFile}
                className="p-2 rounded-xl bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 hover:text-gray-700 transition-all font-medium flex items-center gap-2 group/btn"
                title="Remove file"
             >
                <HiOutlineXMark className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
             </button>
          </div>
        </div>
      ) : (
        <div className="z-10 group-hover:translate-y-[-4px] transition-transform duration-300 pointer-events-none">
          <h3 className="text-2xl font-black text-surface-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Drop your dataset here
          </h3>
          <div className="space-y-1 mb-8">
            <p className="text-surface-500 max-w-md mx-auto font-medium">
              Drag and drop your spreadsheet or click to browse files
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary-500">
              Excel (.xlsx, .xls) and CSV supported
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary-600 text-white font-bold text-sm group-hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20">
             Select File
          </div>
        </div>
      )}

      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_#4f46e5_0%,_transparent_20%)] animate-pulse" />
      </div>
    </div>
  );
};

export default FileDropzone;
