"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    accept?: string;
    label?: string;
}

export function FileUpload({ onFileSelect, accept = ".pdf,.docx", label = "Upload Document" }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            onFileSelect(selectedFile);
        }
    };

    const clearFile = () => {
        setFile(null);
        onFileSelect(null);
    };

    return (
        <div className="w-full">
            {!file ? (
                <div className="flex items-center gap-2">
                    <Input
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className="hidden"
                        id={`file-upload-${label}`}
                    />
                    <label
                        htmlFor={`file-upload-${label}`}
                        className="flex items-center gap-2 cursor-pointer border border-dashed border-black px-4 py-2 rounded-md hover:bg-gray-50 text-sm"
                    >
                        <Upload className="h-4 w-4" />
                        {label}
                    </label>
                </div>
            ) : (
                <div className="flex items-center gap-2 border border-black px-3 py-2 rounded-md bg-gray-50">
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    <Button variant="ghost" size="sm" onClick={clearFile} className="h-6 w-6 p-0 hover:bg-gray-200">
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}
