// Mock licensing system for testing
class LicenseManager {
  constructor() {
    this.licenseType = 'free'; // 'free', 'premium', 'lifetime'
    this.features = this.getLicenseFeatures();
  }

  getLicenseFeatures() {
    const features = {
      free: {
        watermark: true,
        linkInDescription: true,
        uploadsPerDay: 5,
        resolutions: ['720p', '1080p'],
        batchSize: 3,
        templates: 3
      },
      premium: {
        watermark: false,
        linkInDescription: false,
        uploadsPerDay: 50,
        resolutions: ['720p', '1080p', '4K'],
        batchSize: 20,
        templates: 'unlimited',
        customBranding: true,
        scheduling: true
      },
      lifetime: {
        watermark: false,
        linkInDescription: false,
        uploadsPerDay: 'unlimited',
        resolutions: ['720p', '1080p', '4K'],
        batchSize: 'unlimited',
        templates: 'unlimited',
        customBranding: true,
        scheduling: true,
        prioritySupport: true
      }
    };

    return features[this.licenseType];
  }

  async validateLicense() {
    // Mock validation - always returns true for testing
    return {
      valid: true,
      type: this.licenseType,
      features: this.features,
      expiresAt: this.licenseType === 'premium' ? 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : // 30 days from now
        null // Lifetime or free doesn't expire
    };
  }

  async checkFeature(featureName) {
    const validation = await this.validateLicense();
    if (!validation.valid) {
      return { allowed: false, reason: 'Invalid license' };
    }

    const hasFeature = validation.features[featureName];
    
    if (hasFeature === true || hasFeature === 'unlimited') {
      return { allowed: true };
    }

    if (hasFeature === false) {
      return { 
        allowed: false, 
        reason: `Feature '${featureName}' not available in ${this.licenseType} license`,
        upgradeRequired: this.licenseType === 'free'
      };
    }

    // For numeric limits, we'd need to check current usage
    return { allowed: true, limit: hasFeature };
  }

  async getCurrentUsage() {
    // Mock usage data
    return {
      uploadsToday: 2,
      templatesCreated: 1,
      currentBatchSize: 1
    };
  }

  async canUpload() {
    const featureCheck = await this.checkFeature('uploadsPerDay');
    if (!featureCheck.allowed) return featureCheck;

    if (featureCheck.limit === 'unlimited') {
      return { allowed: true };
    }

    const usage = await this.getCurrentUsage();
    if (usage.uploadsToday >= featureCheck.limit) {
      return {
        allowed: false,
        reason: `Daily upload limit reached (${featureCheck.limit})`,
        upgradeRequired: this.licenseType === 'free'
      };
    }

    return { allowed: true, remaining: featureCheck.limit - usage.uploadsToday };
  }

  async shouldAddWatermark() {
    const check = await this.checkFeature('watermark');
    return check.allowed === false ? false : this.features.watermark;
  }

  async shouldAddDescriptionLink() {
    const check = await this.checkFeature('linkInDescription');
    return check.allowed === false ? false : this.features.linkInDescription;
  }

  getUpgradeUrl() {
    return 'https://example.com/upgrade'; // Mock upgrade URL
  }

  // Mock upgrade functions for testing UI
  mockUpgradeToLifetime() {
    this.licenseType = 'lifetime';
    this.features = this.getLicenseFeatures();
    console.log('Mock upgraded to lifetime license');
  }

  mockUpgradeToPremium() {
    this.licenseType = 'premium';
    this.features = this.getLicenseFeatures();
    console.log('Mock upgraded to premium license');
  }

  mockDowngradeToFree() {
    this.licenseType = 'free';
    this.features = this.getLicenseFeatures();
    console.log('Mock downgraded to free license');
  }

  getLicenseInfo() {
    return {
      type: this.licenseType,
      features: this.features,
      isMock: true
    };
  }
}

module.exports = LicenseManager;