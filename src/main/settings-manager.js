const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

class SettingsManager {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.configPath = path.join(this.userDataPath, 'config.json');
    this.envPath = path.join(this.userDataPath, '.env');
    this.encryptionKey = this.getOrCreateEncryptionKey();
    
    this.ensureConfigExists();
    this.generateEnvFile();
  }

  getOrCreateEncryptionKey() {
    const keyPath = path.join(this.userDataPath, '.key');
    
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath);
    } else {
      const key = crypto.randomBytes(32);
      fs.writeFileSync(keyPath, key);
      return key;
    }
  }

  encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText) {
    if (!encryptedText) return null;
    try {
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift(), 'hex');
      const encryptedData = textParts.join(':');
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  ensureConfigExists() {
    const defaultConfig = {
      version: '1.0.0',
      firstRun: true,
      youtube: {
        clientId: '',
        clientSecret: '',
        configured: false
      },
      app: {
        theme: 'dark',
        defaultResolution: '1080p',
        defaultFps: 30,
        maxConcurrentJobs: 3,
        outputDirectory: path.join(this.userDataPath, 'output')
      },
      telemetry: {
        enabled: false,
        userId: crypto.randomUUID()
      }
    };

    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    }

    // Ensure output directory exists
    if (!fs.existsSync(defaultConfig.app.outputDirectory)) {
      fs.mkdirSync(defaultConfig.app.outputDirectory, { recursive: true });
    }
  }

  generateEnvFile() {
    const config = this.getConfig();
    const envContent = `# Auto-generated environment file - DO NOT EDIT MANUALLY
NODE_ENV=development
USER_DATA_PATH=${this.userDataPath}
OUTPUT_PATH=${config.app.outputDirectory}
YOUTUBE_CLIENT_ID=${this.decrypt(config.youtube.clientId) || ''}
YOUTUBE_CLIENT_SECRET=${this.decrypt(config.youtube.clientSecret) || ''}
YOUTUBE_REDIRECT_URI=http://localhost:8080/oauth2callback
APP_VERSION=${config.version}
USER_ID=${config.telemetry.userId}
`;

    fs.writeFileSync(this.envPath, envContent);
    
    // Load into process.env
    require('dotenv').config({ path: this.envPath });
  }

  getConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      console.error('Error reading config:', error);
      this.ensureConfigExists();
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    }
  }

  updateConfig(updates) {
    const config = this.getConfig();
    
    // Deep merge updates
    const mergedConfig = this.deepMerge(config, updates);
    
    fs.writeFileSync(this.configPath, JSON.stringify(mergedConfig, null, 2));
    
    // Regenerate .env file if needed
    if (updates.youtube) {
      this.generateEnvFile();
    }
    
    return mergedConfig;
  }

  deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  setYouTubeCredentials(clientId, clientSecret) {
    const config = this.getConfig();
    
    config.youtube.clientId = this.encrypt(clientId);
    config.youtube.clientSecret = this.encrypt(clientSecret);
    config.youtube.configured = !!(clientId && clientSecret);
    config.firstRun = false;
    
    this.updateConfig(config);
    
    return { success: true };
  }

  getYouTubeCredentials() {
    const config = this.getConfig();
    
    return {
      clientId: this.decrypt(config.youtube.clientId),
      clientSecret: this.decrypt(config.youtube.clientSecret),
      configured: config.youtube.configured
    };
  }

  isFirstRun() {
    return this.getConfig().firstRun;
  }

  completeFirstRun() {
    this.updateConfig({ firstRun: false });
  }

  getAppSettings() {
    return this.getConfig().app;
  }

  updateAppSettings(settings) {
    return this.updateConfig({ app: settings });
  }

  exportSettings() {
    const config = this.getConfig();
    
    // Remove sensitive data for export
    const exportConfig = {
      ...config,
      youtube: {
        configured: config.youtube.configured
      },
      telemetry: {
        enabled: config.telemetry.enabled
      }
    };
    
    return exportConfig;
  }

  importSettings(importedConfig) {
    // Validate imported config
    if (!importedConfig || typeof importedConfig !== 'object') {
      throw new Error('Invalid configuration data');
    }
    
    const currentConfig = this.getConfig();
    
    // Preserve sensitive data and user ID
    const mergedConfig = {
      ...importedConfig,
      youtube: currentConfig.youtube, // Keep encrypted credentials
      telemetry: {
        enabled: importedConfig.telemetry?.enabled || false,
        userId: currentConfig.telemetry.userId // Keep existing user ID
      }
    };
    
    return this.updateConfig(mergedConfig);
  }

  resetToDefaults() {
    if (fs.existsSync(this.configPath)) {
      fs.unlinkSync(this.configPath);
    }
    
    this.ensureConfigExists();
    this.generateEnvFile();
    
    return { success: true };
  }

  getStoragePaths() {
    return {
      userData: this.userDataPath,
      config: this.configPath,
      env: this.envPath,
      output: this.getAppSettings().outputDirectory,
      database: path.join(this.userDataPath, 'ytbeat.db')
    };
  }
}

module.exports = SettingsManager;