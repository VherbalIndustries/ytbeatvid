import React, { useState } from 'react';
import { DragDropZone } from '../components/DragDropZone';
import { Button } from '../components/ui/button';

export function QuickMode() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setMessage(`Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  };

  const testFFmpeg = async () => {
    setIsProcessing(true);
    setMessage('Testing FFmpeg...');
    
    try {
      const result = await window.electronAPI.ffmpeg.checkInstallation();
      setMessage(`FFmpeg Status: ${result.installed ? '✅ Ready' : '❌ Not Found'} - ${result.version || result.error}`);
    } catch (error) {
      setMessage(`❌ FFmpeg test failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const testRender = async () => {
    if (!selectedFile) {
      setMessage('Please select an audio file first');
      return;
    }

    setIsProcessing(true);
    setMessage('🎬 Starting render test...');

    try {
      // Mock render process for testing
      const jobData = {
        beatPath: selectedFile.path,
        templateId: 1,
        accountId: 1,
        visualConfig: {
          waveform: { type: 'line', color: '#00ff00' },
          spectrum: { type: 'bars', color: '#ff0000' },
          resolution: { width: 1920, height: 1080 },
          fps: 30
        },
        metadata: {
          beatName: selectedFile.name.replace(/\.[^/.]+$/, ''),
          producerName: 'Test Producer'
        },
        renderOnly: true
      };

      const jobId = await window.electronAPI.queue.addJob(jobData);
      setMessage(`✅ Render job created: #${jobId}. Check Batch Queue tab for progress.`);
    } catch (error) {
      setMessage(`❌ Render failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const testUpload = async () => {
    setIsProcessing(true);
    setMessage('📤 Testing YouTube upload (mock)...');

    try {
      const result = await window.electronAPI.youtube.upload(
        '/mock/path/video.mp4',
        {
          title: 'Test Upload',
          description: 'Test description',
          tags: 'test,mock',
          visibility: 'private'
        },
        1
      );

      if (result.mock) {
        setMessage(`✅ Mock upload successful! Video ID: ${result.videoId}`);
      } else {
        setMessage(`✅ Upload successful: ${result.url}`);
      }
    } catch (error) {
      setMessage(`❌ Upload test failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Mode</h2>
        <p className="text-muted-foreground mb-6">
          Drag your beat, choose a preset, and upload to YouTube in seconds.
        </p>
        
        <DragDropZone onFileSelect={handleFileSelect} />
        
        <div className="mt-6 space-y-4">
          <div className="flex gap-4">
            <Button 
              size="lg" 
              className="flex-1"
              onClick={testRender}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Render & Upload'}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="flex-1"
              onClick={testRender}
              disabled={!selectedFile || isProcessing}
            >
              Render Only
            </Button>
          </div>

          {/* Test Buttons */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">🧪 Test Functions:</p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline"
                onClick={testFFmpeg}
                disabled={isProcessing}
              >
                Test FFmpeg
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={testUpload}
                disabled={isProcessing}
              >
                Test YouTube (Mock)
              </Button>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}