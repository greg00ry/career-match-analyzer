import { useState, useRef } from 'react';
import { FileText, Briefcase, Loader2, Upload, Check, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker - local import
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

interface InputFormProps {
  onAnalyze: (jobDescription: string, resume: string) => void;
  isLoading: boolean;
}

export default function InputForm({ onAnalyze, isLoading }: InputFormProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPdfText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      throw new Error('Failed to parse PDF. Please ensure it is a valid PDF file.');
    }
  };

  const handleFileSelect = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setParseError('Please upload a PDF file');
      return;
    }

    setParseError(null);
    setResumeFile(file);

    try {
      const text = await extractPdfText(file);
      if (text.trim().length === 0) {
        setParseError('PDF appears to be empty or unreadable');
        setResumeFile(null);
        setResume('');
      } else {
        setResume(text);
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Failed to parse PDF');
      setResumeFile(null);
      setResume('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobDescription.trim() && resume.trim()) {
      onAnalyze(jobDescription, resume);
    }
  };

  const isValid = jobDescription.trim().length > 50 && resume.trim().length > 50;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Briefcase className="w-4 h-4" />
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-64 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">
            {jobDescription.length} characters
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <FileText className="w-4 h-4" />
            Your Resume (PDF)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={isLoading}
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-64 px-4 py-8 border-2 border-dashed rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : parseError
                  ? 'border-red-500 bg-red-500/10'
                  : resumeFile
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
          >
            {parseError ? (
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-400 text-sm">{parseError}</p>
                <p className="text-xs text-gray-500 mt-2">Click to try again</p>
              </div>
            ) : resumeFile ? (
              <div className="text-center">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-400 font-medium">{resumeFile.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {resume.length} characters parsed
                </p>
                <p className="text-xs text-gray-500 mt-2">Click to replace</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-300 font-medium">Upload your resume</p>
                <p className="text-xs text-gray-500 mt-1">
                  Drag and drop a PDF or click to browse
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Match'
          )}
        </button>
      </div>
    </form>
  );
}
