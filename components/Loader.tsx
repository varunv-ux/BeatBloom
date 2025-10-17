import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-[411px] py-[180px]">
      <div className="flex flex-col items-center gap-10 w-[600px]">
        <h2 className="text-5xl font-medium text-black text-center leading-none h-36 flex items-center">
          Composing your masterpiece
        </h2>
        
        <div className="h-[200px] flex flex-col items-center justify-center gap-2.5">
          <div className="relative w-[120px] h-[110px] flex items-center justify-center">
            {/* Animated bouncing bars */}
            <div className="absolute flex items-end gap-2">
              <div 
                className="w-1 bg-stone-300 rounded-sm animate-bounce"
                style={{
                  height: '39px',
                  animationDelay: '0s',
                  animationDuration: '1.5s'
                }}
              />
              <div 
                className="w-1 bg-stone-300 rounded-sm animate-bounce"
                style={{
                  height: '39px',
                  animationDelay: '0.2s',
                  animationDuration: '1.5s'
                }}
              />
              <div 
                className="w-1 bg-stone-300 rounded-sm animate-bounce"
                style={{
                  height: '16px',
                  animationDelay: '0.4s',
                  animationDuration: '1.5s'
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="w-[400px] text-center">
          <p className="text-xl font-normal text-stone-500 leading-7">
            BeatBloom AI is warming up its vocal chords and tuning the instruments
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loader;
