import React, { useState } from 'react';
import { Radar, Sparkles, CheckCircle2, AlertOctagon, RotateCw, Volume2, VolumeX } from 'lucide-react';

interface GhostRadarWidgetProps {
  onInspectCase: (caseId: string) => void;
}

export const GhostRadarWidget: React.FC<GhostRadarWidgetProps> = ({ onInspectCase }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [activeBlip, setActiveBlip] = useState<number>(0);
  const [exorcisedCount, setExorcisedCount] = useState(190);
  const [ghostsRemaining, setGhostsRemaining] = useState(323);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Subtle synthesized audio feedback using Web Audio API
  const playBlipSound = (freq = 440, type: OscillatorType = 'sine', duration = 0.1) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext blocked
    }
  };

  const blips = [
    {
      id: 0,
      name: 'failover_replica_db.sql',
      system: 'account_service',
      caseId: 'case_05',
      distance: '320ms lag',
      threat: 'Phantom Record Survived',
      x: 35,
      y: 28,
    },
    {
      id: 1,
      name: 'account_replication_cluster',
      system: 'integration_service',
      caseId: 'case_11',
      distance: 'Active cron',
      threat: 'Zombie Sync Resuscitation',
      x: 72,
      y: 45,
    },
    {
      id: 2,
      name: 'backup_service_export.json',
      system: 'backup_service',
      caseId: 'case_09',
      distance: '48h snapshot',
      threat: 'Cold DR Backup Restore',
      x: 48,
      y: 75,
    },
    {
      id: 3,
      name: 'support_ticket_export.pdf',
      system: 'support_platform',
      caseId: 'case_07',
      distance: 'Orphaned S3',
      threat: 'Spectral PII Attachment',
      x: 22,
      y: 65,
    },
  ];

  const handleScan = () => {
    setIsScanning(true);
    playBlipSound(587.33, 'triangle', 0.15);
    
    setTimeout(() => {
      playBlipSound(880, 'sine', 0.12);
      setActiveBlip(1);
    }, 500);

    setTimeout(() => {
      playBlipSound(1046.5, 'sine', 0.12);
      setActiveBlip(2);
    }, 1000);

    setTimeout(() => {
      playBlipSound(659.25, 'triangle', 0.2);
      setIsScanning(false);
      setActiveBlip(0);
    }, 1500);
  };

  const handleExorciseActive = () => {
    playBlipSound(523.25, 'sine', 0.08);
    setTimeout(() => playBlipSound(659.25, 'sine', 0.08), 80);
    setTimeout(() => playBlipSound(783.99, 'sine', 0.15), 160);
    
    setExorcisedCount(prev => prev + 1);
    setGhostsRemaining(prev => Math.max(0, prev - 1));
  };

  const currentBlip = blips.find(b => b.id === activeBlip) || blips[0];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center">
            <Radar className="w-4 h-4 animate-spin text-[#EA580C]" style={{ animationDuration: isScanning ? '1.5s' : '9s' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <span>Spectral Ectoplasm Scanner</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-medium">
                Live
              </span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Pinging 94 distributed evidence artifacts for unpurged residual data
            </p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50 text-xs transition-colors cursor-pointer"
          title={soundEnabled ? 'Mute radar synth blips' : 'Enable sound'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#EA580C]" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Grid: Radar Screen on Left, Detection Dossier on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Radar Circular Display (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-[#18181B] border border-stone-300 shadow-inner overflow-hidden flex items-center justify-center">
            
            {/* Concentric distance rings */}
            <div className="absolute inset-4 rounded-full border border-stone-700/40 pointer-events-none"></div>
            <div className="absolute inset-10 rounded-full border border-stone-700/50 pointer-events-none"></div>
            <div className="absolute inset-18 rounded-full border border-stone-700/60 pointer-events-none"></div>
            
            {/* Crosshair grid lines */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-stone-700/40 pointer-events-none"></div>
            <div className="absolute inset-y-0 left-1/2 w-px bg-stone-700/40 pointer-events-none"></div>

            {/* Sweeping Radar Beam */}
            <div 
              className="absolute inset-0 origin-center pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg at 50% 50%, rgba(234, 88, 12, 0.28) 0deg, transparent 60deg, transparent 360deg)',
                animation: `spin ${isScanning ? '1.5s' : '5s'} linear infinite`
              }}
            ></div>

            {/* Ghost Blips on Screen */}
            {blips.map((blip) => {
              const isActive = activeBlip === blip.id;
              return (
                <button
                  key={blip.id}
                  onClick={() => {
                    setActiveBlip(blip.id);
                    playBlipSound(isActive ? 880 : 587.33, 'sine', 0.1);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-20"
                  style={{ left: `${blip.x}%`, top: `${blip.y}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-[#EA580C] flex items-center justify-center text-[7px] text-white font-bold shadow-xs">
                      👻
                    </span>
                    <span className="absolute -inset-1 rounded-full border border-[#EA580C] animate-ping opacity-60"></span>
                  </div>
                </button>
              );
            })}

            {/* Center Anchor Point */}
            <div className="w-2 h-2 rounded-full bg-[#EA580C] ring-2 ring-orange-500/30 z-10"></div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Ping Systems'}</span>
            </button>
            <span className="text-[10px] font-mono text-stone-500">
              {isScanning ? 'Detecting latency' : 'Sweep ready'}
            </span>
          </div>
        </div>

        {/* Selected Blip Detail Dossier (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">👻</span>
                <span className="text-xs font-mono font-bold text-stone-900">
                  Target #{currentBlip.id + 1}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-stone-700 border border-stone-200 font-semibold shadow-2xs">
                {currentBlip.threat}
              </span>
            </div>

            <div className="font-mono text-xs font-bold text-stone-900 truncate mb-1">
              {currentBlip.name}
            </div>
            <div className="text-[11px] text-stone-500 mb-3 leading-relaxed">
              System: <strong className="text-stone-800">{currentBlip.system}</strong> &bull; Metric: <strong className="text-[#EA580C]">{currentBlip.distance}</strong>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => onInspectCase(currentBlip.caseId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <span>Inspect {currentBlip.caseId}</span>
                <span className="text-xs">&rarr;</span>
              </button>

              <button
                onClick={handleExorciseActive}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Simulate Exorcism</span>
              </button>
            </div>
          </div>

          {/* Real-time Ectoplasm Counter Ticker */}
          <div className="grid grid-cols-2 gap-2.5 font-mono text-center">
            <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="text-[10px] uppercase text-stone-500 font-medium">Residual Records</div>
              <div className="text-sm font-bold text-[#EA580C] flex items-center justify-center gap-1 mt-0.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{ghostsRemaining}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="text-[10px] uppercase text-stone-500 font-medium">Exorcised Clean</div>
              <div className="text-sm font-bold text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{exorcisedCount}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
