import React from 'react';
import { Loader as PromptKitLoader } from './ui/loader';

const Loader: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-[411px] py-[100px] md:py-[180px]">
      <div className="flex flex-col items-center gap-8 w-full max-w-[600px]">
        <div className="h-[120px] md:h-[200px] flex flex-col items-center justify-center gap-6">
          <PromptKitLoader variant="wave" size="lg" />
        </div>

        <PromptKitLoader
          variant="text-shimmer"
          size="lg"
          text="Composing your masterpiece"
          className="!text-3xl md:!text-5xl !font-medium text-center leading-none"
        />
        
        <div className="w-full max-w-[400px] text-center">
          <PromptKitLoader
            variant="text-shimmer"
            size="lg"
            text="BeatBloom AI is warming up its vocal chords and tuning the instruments"
          />
        </div>
      </div>
    </div>
  );
};

export default Loader;
