const db = require('./db');

class SeoTemplateManager {
  constructor() {
    this.createDefaultTemplates();
  }

  createDefaultTemplates() {
    const defaults = [
      {
        name: 'Hip Hop Beat',
        title: '{beat_name} - {producer_name} (Free/Paid) [{genre}]',
        description: `🔥 {beat_name} by {producer_name}

🎵 BPM: {bpm}
🎹 Key: {key}
📧 Contact: contact@{producer_name}.com

💰 Purchase (Untagged + Stems):
[Your Store Link Here]

📱 Follow {producer_name}:
Instagram: @{producer_name}
Twitter: @{producer_name}
SoundCloud: soundcloud.com/{producer_name}

#beats #hiphop #{genre} #instrumental #producer`,
        tags: 'beats,hip hop,{genre},instrumental,{producer_name},free beat,{bpm}bpm',
        category: 'Music',
        visibility: 'public'
      },
      {
        name: 'Trap Beat',
        title: '[FREE] {beat_name} | Trap Beat | {producer_name}',
        description: `💯 FREE Trap Beat "{beat_name}" 

Producer: {producer_name}
BPM: {bpm}
Key: {key}

🔥 LEASE/EXCLUSIVE: [Your Link]

Follow for more beats:
📸 IG: @{producer_name}
🎵 YT: youtube.com/@{producer_name}
💽 All Beats: [Your Link]

Tags: #trapbeat #freebeat #instrumental`,
        tags: 'trap beat,free beat,{producer_name},{bpm}bpm,instrumental,rap beat',
        category: 'Music',
        visibility: 'public'
      },
      {
        name: 'R&B Soul',
        title: '{beat_name} - Smooth R&B Soul Beat | {producer_name}',
        description: `✨ Smooth R&B/Soul instrumental "{beat_name}"

🎹 Key: {key}
🥁 BPM: {bpm}
🎤 Perfect for: R&B, Neo-Soul, Vocals

🛒 Purchase: [Your Store]
📧 Collab: {producer_name}@gmail.com

Connect:
Instagram: @{producer_name}
Spotify: [Your Profile]

#RnB #Soul #Smooth #Beat #Instrumental`,
        tags: 'rnb,soul,smooth,beat,{producer_name},{key},{bpm}bpm',
        category: 'Music',
        visibility: 'public'
      }
    ];

    defaults.forEach(template => {
      const existing = db.prepare('SELECT id FROM seo_templates WHERE name = ?').get(template.name);
      if (!existing) {
        db.prepare(`
          INSERT INTO seo_templates (name, title, description, tags, category, visibility)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(template.name, template.title, template.description, template.tags, template.category, template.visibility);
      }
    });
  }

  getAllTemplates() {
    return db.prepare('SELECT * FROM seo_templates ORDER BY created_at DESC').all();
  }

  getTemplate(id) {
    return db.prepare('SELECT * FROM seo_templates WHERE id = ?').get(id);
  }

  createTemplate(data) {
    const { name, title, description, tags, category, visibility } = data;
    
    if (!name || !title) {
      throw new Error('Name and title are required');
    }

    return db.prepare(`
      INSERT INTO seo_templates (name, title, description, tags, category, visibility)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, title, description, tags, category || 'Music', visibility || 'public');
  }

  updateTemplate(id, data) {
    const { name, title, description, tags, category, visibility } = data;
    
    return db.prepare(`
      UPDATE seo_templates 
      SET name = ?, title = ?, description = ?, tags = ?, category = ?, visibility = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, title, description, tags, category, visibility, id);
  }

  deleteTemplate(id) {
    return db.prepare('DELETE FROM seo_templates WHERE id = ?').run(id);
  }

  resolvePlaceholders(templateData, metadata) {
    const placeholders = {
      beat_name: metadata.beatName || 'Untitled Beat',
      producer_name: metadata.producerName || 'Producer',
      genre: metadata.genre || 'Hip Hop',
      bpm: metadata.bpm || '120',
      key: metadata.key || 'C Major',
      year: new Date().getFullYear().toString()
    };

    let resolved = { ...templateData };

    Object.entries(placeholders).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      
      if (resolved.title) {
        resolved.title = resolved.title.replace(regex, value);
      }
      if (resolved.description) {
        resolved.description = resolved.description.replace(regex, value);
      }
      if (resolved.tags) {
        resolved.tags = resolved.tags.replace(regex, value);
      }
    });

    return resolved;
  }

  validateTitle(title) {
    if (!title) return { valid: false, error: 'Title is required' };
    if (title.length > 100) return { valid: false, error: 'Title must be 100 characters or less' };
    return { valid: true };
  }

  validateDescription(description) {
    if (!description) return { valid: false, error: 'Description is required' };
    if (description.length > 5000) return { valid: false, error: 'Description must be 5000 characters or less' };
    return { valid: true };
  }

  validateTags(tags) {
    if (!tags) return { valid: true }; // Tags are optional
    
    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    if (tagArray.length > 500) {
      return { valid: false, error: 'Too many tags (max 500)' };
    }
    
    const invalidTags = tagArray.filter(tag => tag.length > 30);
    if (invalidTags.length > 0) {
      return { valid: false, error: `Tag too long: "${invalidTags[0]}" (max 30 chars)` };
    }
    
    return { valid: true };
  }

  validateTemplate(template) {
    const titleCheck = this.validateTitle(template.title);
    if (!titleCheck.valid) return titleCheck;
    
    const descCheck = this.validateDescription(template.description);
    if (!descCheck.valid) return descCheck;
    
    const tagsCheck = this.validateTags(template.tags);
    if (!tagsCheck.valid) return tagsCheck;
    
    return { valid: true };
  }
}

module.exports = SeoTemplateManager;