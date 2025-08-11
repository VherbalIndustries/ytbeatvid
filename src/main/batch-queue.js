const EventEmitter = require('events');
const db = require('./db');
const OfflineRenderer = require('../visualizer/offline-renderer');
const { renderFromFrames } = require('../ffmpeg/encode');
const YouTubeUploader = require('./youtube-uploader');
const SeoTemplateManager = require('./seo-templates');

class BatchQueue extends EventEmitter {
  constructor() {
    super();
    this.isProcessing = false;
    this.currentJob = null;
    this.maxConcurrency = 1; // Start with 1, can be increased
    this.youtubeUploader = new YouTubeUploader();
    this.seoManager = new SeoTemplateManager();
  }

  addJob(jobData) {
    const {
      beatPath,
      templateId,
      accountId,
      visualConfig,
      metadata,
      scheduledDate,
      renderOnly = false
    } = jobData;

    if (!beatPath) {
      throw new Error('Beat path is required');
    }

    const job = db.prepare(`
      INSERT INTO jobs (beat_path, template_id, account_id, metadata, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(
      beatPath,
      templateId,
      renderOnly ? null : accountId,
      JSON.stringify({
        visualConfig,
        metadata,
        scheduledDate,
        renderOnly
      })
    );

    this.emit('jobAdded', { jobId: job.lastInsertRowid });
    this.processNext();

    return job.lastInsertRowid;
  }

  async processNext() {
    if (this.isProcessing) return;

    const nextJob = db.prepare(`
      SELECT * FROM jobs 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      LIMIT 1
    `).get();

    if (!nextJob) return;

    this.isProcessing = true;
    this.currentJob = nextJob;

    try {
      await this.processJob(nextJob);
    } catch (error) {
      console.error('Job processing error:', error);
      this.updateJobStatus(nextJob.id, 'failed', error.message);
      this.emit('jobFailed', { jobId: nextJob.id, error: error.message });
    } finally {
      this.isProcessing = false;
      this.currentJob = null;
      // Process next job
      setImmediate(() => this.processNext());
    }
  }

  async processJob(job) {
    const metadata = JSON.parse(job.metadata);
    this.updateJobStatus(job.id, 'rendering');
    this.emit('jobStarted', { jobId: job.id });

    // Step 1: Render video
    const videoPath = await this.renderVideo(job, metadata);
    this.updateJobProgress(job.id, 50);

    if (metadata.renderOnly) {
      this.updateJobStatus(job.id, 'completed');
      this.emit('jobCompleted', { jobId: job.id, videoPath });
      return;
    }

    // Step 2: Upload to YouTube
    this.updateJobStatus(job.id, 'uploading');
    await this.uploadVideo(job, videoPath, metadata);
    
    this.updateJobStatus(job.id, 'completed');
    this.updateJobProgress(job.id, 100);
    this.emit('jobCompleted', { jobId: job.id, videoPath });
  }

  async renderVideo(job, metadata) {
    const { visualConfig, metadata: videoMetadata } = metadata;
    
    // Initialize offline renderer
    const renderer = new OfflineRenderer({
      width: visualConfig.resolution?.width || 1920,
      height: visualConfig.resolution?.height || 1080,
      fps: visualConfig.fps || 30
    });

    try {
      // Extract audio data
      await renderer.init(job.beat_path);

      // Export frames
      const frameResult = await renderer.exportFrames(visualConfig, (progress) => {
        const renderProgress = Math.floor(progress.percent * 0.7); // 70% of total for rendering
        this.updateJobProgress(job.id, renderProgress);
        this.emit('jobProgress', { jobId: job.id, progress: renderProgress });
      });

      // Combine frames with audio
      const outputPath = `./output/video_${job.id}_${Date.now()}.mp4`;
      
      await renderFromFrames(
        frameResult.frameDir,
        job.beat_path,
        outputPath,
        {
          fps: frameResult.fps,
          resolution: `${visualConfig.resolution?.width || 1920}x${visualConfig.resolution?.height || 1080}`
        }
      );

      // Cleanup frames
      await renderer.cleanup();

      // Update job with output path
      db.prepare('UPDATE jobs SET output_path = ? WHERE id = ?').run(outputPath, job.id);

      return outputPath;

    } catch (error) {
      await renderer.cleanup();
      throw error;
    }
  }

  async uploadVideo(job, videoPath, metadata) {
    // Get SEO template and resolve placeholders
    let seoData = {};
    if (job.template_id) {
      const template = this.seoManager.getTemplate(job.template_id);
      if (template) {
        seoData = this.seoManager.resolvePlaceholders(template, metadata.metadata);
      }
    }

    const uploadMetadata = {
      title: seoData.title || metadata.metadata.beatName || 'Untitled Beat',
      description: seoData.description || '',
      tags: seoData.tags || '',
      category: seoData.category || 'Music',
      visibility: seoData.visibility || 'public',
      scheduledDate: metadata.scheduledDate
    };

    const result = await this.youtubeUploader.uploadVideo(
      videoPath,
      uploadMetadata,
      job.account_id
    );

    if (!result.success) {
      throw new Error(`Upload failed: ${result.error}`);
    }

    // Update job with YouTube info
    db.prepare(`
      UPDATE jobs 
      SET metadata = json_set(metadata, '$.youtubeId', ?, '$.youtubeUrl', ?)
      WHERE id = ?
    `).run(result.videoId, result.url, job.id);

    return result;
  }

  updateJobStatus(jobId, status, errorMessage = null) {
    const stmt = db.prepare(`
      UPDATE jobs 
      SET status = ?, error_message = ?, 
          completed_at = CASE WHEN ? IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `);
    stmt.run(status, errorMessage, status, jobId);
  }

  updateJobProgress(jobId, progress) {
    db.prepare('UPDATE jobs SET progress = ? WHERE id = ?').run(progress, jobId);
  }

  pauseQueue() {
    this.isProcessing = false;
    this.emit('queuePaused');
  }

  resumeQueue() {
    if (!this.isProcessing) {
      this.processNext();
      this.emit('queueResumed');
    }
  }

  cancelJob(jobId) {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'pending') {
      this.updateJobStatus(jobId, 'cancelled');
      this.emit('jobCancelled', { jobId });
      return true;
    }

    // If it's the current job, we'll need to handle cancellation differently
    if (this.currentJob && this.currentJob.id === jobId) {
      // Implementation for cancelling current job
      this.updateJobStatus(jobId, 'cancelled');
      this.emit('jobCancelled', { jobId });
      return true;
    }

    return false;
  }

  getQueueStatus() {
    const stats = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM jobs 
      GROUP BY status
    `).all();

    const statusMap = {};
    stats.forEach(stat => {
      statusMap[stat.status] = stat.count;
    });

    return {
      pending: statusMap.pending || 0,
      rendering: statusMap.rendering || 0,
      uploading: statusMap.uploading || 0,
      completed: statusMap.completed || 0,
      failed: statusMap.failed || 0,
      cancelled: statusMap.cancelled || 0,
      currentJob: this.currentJob,
      isProcessing: this.isProcessing
    };
  }

  getJobHistory(limit = 50) {
    return db.prepare(`
      SELECT 
        j.*,
        a.channel_name,
        t.name as template_name
      FROM jobs j
      LEFT JOIN accounts a ON j.account_id = a.id
      LEFT JOIN seo_templates t ON j.template_id = t.id
      ORDER BY j.created_at DESC
      LIMIT ?
    `).all(limit);
  }

  retryJob(jobId) {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job || job.status !== 'failed') {
      throw new Error('Job not found or not in failed state');
    }

    this.updateJobStatus(jobId, 'pending');
    this.updateJobProgress(jobId, 0);
    db.prepare('UPDATE jobs SET error_message = NULL WHERE id = ?').run(jobId);
    
    this.emit('jobRetried', { jobId });
    this.processNext();
  }

  clearCompleted() {
    const result = db.prepare(`
      DELETE FROM jobs 
      WHERE status IN ('completed', 'cancelled') 
      AND completed_at < datetime('now', '-7 days')
    `).run();

    return result.changes;
  }
}

module.exports = BatchQueue;