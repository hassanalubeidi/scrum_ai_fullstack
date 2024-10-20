"use client";

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadFile, selectUploadStatus, selectResourceError } from './resourceSlice';
import { AppDispatch } from '../../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, File } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export function ResourceUploader() {
  const dispatch = useDispatch<AppDispatch>();
  const uploadStatus = useSelector(selectUploadStatus);
  const error = useSelector(selectResourceError);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      dispatch(uploadFile(file));
    } else {
      alert('Please select a file to upload.');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Upload Resource
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select File</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="flex-grow"
            />
            <Button onClick={handleUpload} disabled={uploadStatus === 'loading' || !file}>
              {uploadStatus === 'loading' ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>

        {file && (
          <div className="bg-secondary p-3 rounded-md flex items-center space-x-2">
            <File className="h-5 w-5" />
            <span className="text-sm font-medium">{file.name}</span>
          </div>
        )}

        {uploadStatus === 'loading' && (
          <div className="space-y-2">
            <Progress value={33} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">Uploading and indexing...</p>
          </div>
        )}

        {uploadStatus === 'succeeded' && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              File uploaded and indexed successfully.
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'failed' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
