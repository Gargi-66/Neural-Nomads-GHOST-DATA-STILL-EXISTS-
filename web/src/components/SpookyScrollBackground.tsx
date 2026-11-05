import React from 'react';

export const SpookyScrollBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 1. Subtle, Translucent Continuous Autumn Leaves in background (behind content) */}
      {[
        { emoji: '🍁', left: '3%', anim: 'leaf-fall-1', dur: '18s', delay: '-3s', size: 'text-sm' },
        { emoji: '🍂', left: '9%', anim: 'leaf-fall-2', dur: '22s', delay: '-9s', size: 'text-xs' },
        { emoji: '🍁', left: '18%', anim: 'leaf-fall-3', dur: '25s', delay: '-15s', size: 'text-xs' },
        { emoji: '🍂', left: '30%', anim: 'leaf-fall-1', dur: '20s', delay: '-6s', size: 'text-xs' },
        { emoji: '🍁', left: '70%', anim: 'leaf-fall-2', dur: '26s', delay: '-12s', size: 'text-xs' },
        { emoji: '🍂', left: '82%', anim: 'leaf-fall-3', dur: '19s', delay: '-4s', size: 'text-sm' },
        { emoji: '🍁', left: '91%', anim: 'leaf-fall-1', dur: '23s', delay: '-14s', size: 'text-sm' },
        { emoji: '🍂', left: '96%', anim: 'leaf-fall-2', dur: '17s', delay: '-7s', size: 'text-xs' },
      ].map((leaf, idx) => (
        <div
          key={idx}
          className={`fixed pointer-events-none select-none ${leaf.size} opacity-20 filter blur-[0.2px]`}
          style={{
            left: leaf.left,
            top: 0,
            animation: `${leaf.anim} ${leaf.dur} linear infinite ${leaf.delay}`,
          }}
        >
          <div style={{ animation: 'leaf-sway-horizontal 5s ease-in-out infinite alternate' }}>
            {leaf.emoji}
          </div>
        </div>
      ))}

      {/* 2. Soft Ambient Halloween Twilight Fog (Pure background, no scroll effect) */}
      <div 
        className="absolute top-[280px] -left-1/4 w-[150%] h-40 bg-gradient-to-r from-transparent via-orange-500/[0.025] to-transparent blur-3xl rounded-full"
      />

      <div 
        className="absolute top-[750px] -right-1/4 w-[150%] h-48 bg-gradient-to-r from-transparent via-[#30233D]/[0.02] to-transparent blur-3xl rounded-full"
      />
    </div>
  );
};

