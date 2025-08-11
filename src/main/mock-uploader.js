// Mock YouTube uploader that simulates upload without actually uploading
class MockYouTubeUploader {
  constructor() {
    this.mockAccounts = [
      {
        id: 1,
        email: 'test@example.com',
        channel_name: 'Test Channel',
        is_active: 1
      }
    ];
  }

  getAuthUrl() {
    return 'https://accounts.google.com/oauth/authorize?mock=true';
  }

  async handleAuthCallback(code) {
    // Mock successful authentication
    console.log('[MOCK] YouTube OAuth callback with code:', code);
    
    return {
      success: true,
      account: {
        email: 'test@example.com',
        channel_name: 'Mock Test Channel',
        channel_id: 'UC_mock_channel_id',
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_expiry: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }
    };
  }

  async uploadVideo(videoPath, metadata, accountId) {
    console.log('[MOCK] YouTube Upload - Video Path:', videoPath);
    console.log('[MOCK] YouTube Upload - Metadata:', metadata);
    console.log('[MOCK] YouTube Upload - Account ID:', accountId);

    // Simulate upload delay
    await this.delay(2000);

    const mockVideoId = 'mock_' + Date.now();
    
    return {
      success: true,
      videoId: mockVideoId,
      url: `https://www.youtube.com/watch?v=${mockVideoId}`,
      mock: true
    };
  }

  async getAccounts() {
    return this.mockAccounts;
  }

  async removeAccount(accountId) {
    console.log('[MOCK] Removing account:', accountId);
    return { changes: 1 };
  }

  async getUploadHistory(limit = 50) {
    return [
      {
        id: 1,
        youtube_id: 'mock_video_123',
        title: 'Mock Beat Upload',
        upload_date: new Date().toISOString(),
        channel_name: 'Mock Channel'
      }
    ];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MockYouTubeUploader;