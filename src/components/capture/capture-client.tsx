
'use client';

import { useState, useRef, useEffect } from 'react';
import Textarea from 'react-textarea-autosize';

export function CaptureClient() {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col items-center justify-start h-full pt-8">
      <div className="w-full max-w-2xl">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capturez vos pensées, idées, tâches..."
          className="w-full bg-transparent text-lg md:text-xl text-foreground placeholder:text-muted-foreground/50 border-none focus:ring-0 resize-none p-0"
          minRows={5}
        />
      </div>
    </div>
  );
}
