const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const db = require('./db');

class YouTubeUploader {
  constructor() {
    this.oauth2Client = null;
    this.youtube = null;
    this.initOAuth();
  }

  initOAuth() {
    // OAuth 2.0 credentials (should be in .env or config)
    const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || 'your_client_id';
    const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || 'your_client_secret';
    const REDIRECT_URI = 'http://localhost:8080/oauth2callback';

    this.oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async handleAuthCallback(code) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get channel info
      const channelResponse = await this.youtube.channels.list({
        part: 'snippet',
        mine: true
      });

      const channel = channelResponse.data.items[0];
      
      // Store account in database
      const account = {
        email: channel.snippet.title, // This might need adjustment
        channel_name: channel.snippet.title,
        channel_id: channel.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(tokens.expiry_date).toISOString()
      };

      db.prepare(`
        INSERT OR REPLACE INTO accounts 
        (email, channel_name, channel_id, access_token, refresh_token, token_expiry)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        account.email,
        account.channel_name,
        account.channel_id,
        account.access_token,
        account.refresh_token,
        account.token_expiry
      );

      return { success: true, account };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return { success: false, error: error.message };
    }
  }

  async refreshTokenIfNeeded(accountId) {
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const tokenExpiry = new Date(account.token_expiry);
    const now = new Date();
    
    // Refresh if token expires in less than 5 minutes
    if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
      this.oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token
      });

      try {
        const { tokens } = await this.oauth2Client.refreshAccessToken();
        
        // Update database
        db.prepare(`
          UPDATE accounts 
          SET access_token = ?, token_expiry = ?
          WHERE id = ?
        `).run(
          tokens.access_token,
          new Date(tokens.expiry_date).toISOString(),
          accountId
        );

        return tokens;
      } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
      }
    }

    return {
      access_token: account.access_token,
      refresh_token: account.refresh_token
    };
  }

  async uploadVideo(videoPath, metadata, accountId) {
    try {
      // Refresh token if needed
      const tokens = await this.refreshTokenIfNeeded(accountId);
      this.oauth2Client.setCredentials(tokens);

      const videoMetadata = {
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [],
          categoryId: this.getCategoryId(metadata.category || 'Music'),
          defaultLanguage: 'en',
          defaultAudioLanguage: 'en'
        },
        status: {
          privacyStatus: metadata.visibility || 'public',
          publishAt: metadata.scheduledDate ? new Date(metadata.scheduledDate).toISOString() : undefined
        }
      };

      // Start resumable upload
      const response = await this.youtube.videos.insert({
        part: 'snippet,status',
        requestBody: videoMetadata,
        media: {
          body: fs.createReadStream(videoPath)
        }
      });

      // Store in history
      const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
      db.prepare(`
        INSERT INTO history (youtube_id, title, upload_date, account_id)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?)
      `).run(response.data.id, metadata.title, accountId);

      return {
        success: true,
        videoId: response.data.id,
        url: `https://www.youtube.com/watch?v=${response.data.id}`
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  getCategoryId(category) {
    const categories = {
      'Music': '10',
      'Entertainment': '24',
      'Education': '27',
      'Gaming': '20'
    };
    return categories[category] || '10'; // Default to Music
  }

  async getAccounts() {
    return db.prepare('SELECT id, email, channel_name, is_active FROM accounts WHERE is_active = 1').all();
  }

  async removeAccount(accountId) {
    return db.prepare('UPDATE accounts SET is_active = 0 WHERE id = ?').run(accountId);
  }

  async getUploadHistory(limit = 50) {
    return db.prepare(`
      SELECT h.*, a.channel_name 
      FROM history h
      JOIN accounts a ON h.account_id = a.id
      ORDER BY h.upload_date DESC
      LIMIT ?
    `).all(limit);
  }

  async retryUpload(historyId) {
    // Implementation for retry logic with exponential backoff
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Retry upload logic here
        console.log(`Upload attempt ${attempt}/${maxRetries}`);
        // ... retry implementation
        break;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

module.exports = YouTubeUploader;