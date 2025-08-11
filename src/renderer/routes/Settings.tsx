import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function Settings() {
  const [youtubeCredentials, setYoutubeCredentials] = useState({
    clientId: '',
    clientSecret: '',
    configured: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const credentials = await window.electronAPI.settings.get('youtubeCredentials');
      if (credentials) {
        setYoutubeCredentials(credentials);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveYouTubeCredentials = async () => {
    if (!youtubeCredentials.clientId || !youtubeCredentials.clientSecret) {
      setMessage('Both Client ID and Client Secret are required');
      return;
    }

    setIsLoading(true);
    try {
      await window.electronAPI.settings.setYouTubeCredentials(
        youtubeCredentials.clientId,
        youtubeCredentials.clientSecret
      );
      setMessage('YouTube credentials saved successfully!');
      setYoutubeCredentials(prev => ({ ...prev, configured: true }));
    } catch (error) {
      setMessage('Failed to save credentials: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openYouTubeSetupGuide = () => {
    window.electronAPI.openExternal('https://console.cloud.google.com/apis/credentials');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        <p className="text-muted-foreground mb-6">
          Configure app preferences and API credentials.
        </p>

        {/* YouTube API Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>YouTube API Configuration</CardTitle>
            <CardDescription>
              Required for uploading videos to YouTube. Get your credentials from Google Cloud Console.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">YouTube Client ID</Label>
                <Input
                  id="clientId"
                  type="password"
                  placeholder="Your YouTube Client ID"
                  value={youtubeCredentials.clientId}
                  onChange={(e) => setYoutubeCredentials(prev => ({ 
                    ...prev, 
                    clientId: e.target.value 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientSecret">YouTube Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Your YouTube Client Secret"
                  value={youtubeCredentials.clientSecret}
                  onChange={(e) => setYoutubeCredentials(prev => ({ 
                    ...prev, 
                    clientSecret: e.target.value 
                  }))}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={saveYouTubeCredentials}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Credentials'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={openYouTubeSetupGuide}
              >
                Setup Guide
              </Button>
            </div>

            {youtubeCredentials.configured && (
              <div className="text-sm text-green-600">
                ✓ YouTube API configured successfully
              </div>
            )}

            {message && (
              <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>
              General application preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Resolution</Label>
                <select className="w-full p-2 border rounded-md">
                  <option value="720p">720p (HD)</option>
                  <option value="1080p" selected>1080p (Full HD)</option>
                  <option value="4K">4K (Ultra HD)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Default FPS</Label>
                <select className="w-full p-2 border rounded-md">
                  <option value="30" selected>30 FPS</option>
                  <option value="60">60 FPS</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}