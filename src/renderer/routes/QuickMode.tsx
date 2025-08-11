import React from 'react';
import { DragDropZone } from '../components/DragDropZone';
import { Button } from '../components/ui/button';

export function QuickMode() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Mode</h2>
        <p className="text-muted-foreground mb-6">
          Drag your beat, choose a preset, and upload to YouTube in seconds.
        </p>
        
        <DragDropZone />
        
        <div className="mt-6 flex gap-4">
          <Button size="lg" className="flex-1">
            Render & Upload
          </Button>
          <Button size="lg" variant="outline" className="flex-1">
            Render Only
          </Button>
        </div>
      </div>
    </div>
  );
}