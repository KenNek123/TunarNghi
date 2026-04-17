import { useEffect, useRef, useState, type ReactNode } from 'react';
import type {
  CameraFacingMode,
  CameraStatus,
  CameraZoomState,
  ShapeMode,
  ThemeMode,
  TrackerStatus,
} from '../types';
import { APP_THEME_VISUALS, THEME_CARDS } from '../themePresets';

interface ControlPanelProps {
  shape: ShapeMode;
  onShapeChange: (shape: ShapeMode) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onReset: () => void;
  onSave: () => void;
  onFacingModeChange: (mode: CameraFacingMode) => void;
  cameraFacingMode: CameraFacingMode;
  onZoomChange: (value: number) => void;
  zoom: CameraZoomState;
  cameraStatus: CameraStatus;
  trackerStatus: TrackerStatus;
  holdProgress: number;
  hasCapture: boolean;
  captureLocked: boolean;
  onToggleCaptureLock: () => void;
}

const shapes: Array<{ value: ShapeMode; label: string; sublabel: string }> = [
  { value: 'circle', label: 'Tròn', sublabel: '2 ngón trỏ làm đường kính' },
  { value: 'roundedRect', label: 'Bo góc', sublabel: '4 ngón dựng khung mềm' },
  { value: 'heart', label: 'Trái tim', sublabel: '4 ngón định cỡ tim' },
  { value: 'star', label: 'Ngôi sao', sublabel: '4 ngón định cỡ sao' },
];

const ShapeIcon = ({ shape, active }: { shape: ShapeMode; active: boolean }) => {
  const className = active ? 'opacity-100' : 'opacity-80';

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shape === 'circle' && <circle cx="24" cy="24" r="14" />}
      {shape === 'roundedRect' && <rect x="9" y="14" width="30" height="20" rx="8" />}
      {shape === 'heart' && (
        <path d="M24 37.5c-7.3-4.5-12-8.7-12-14.6 0-4 3.1-7.2 7.1-7.2 2.4 0 4.1 1 4.9 2.3.8-1.3 2.5-2.3 4.9-2.3 4 0 7.1 3.2 7.1 7.2 0 5.9-4.7 10.1-12 14.6Z" />
      )}
      {shape === 'star' && (
        <path d="M24 8.5 28.7 18l10.5 1.5-7.6 7.4 1.8 10.5L24 32.5 14.6 37.4l1.8-10.5-7.6-7.4L19.3 18 24 8.5Z" />
      )}
    </svg>
  );
};

const StatusChip = ({ label, status, dark }: { label: string; status: CameraStatus | TrackerStatus; dark: boolean }) => {
  const isReady = status === 'ready';
  const isPending = status === 'loading' || status === 'requesting';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 backdrop-blur ${dark ? 'bg-white/5 text-white ring-white/10' : 'bg-white/70 text-slate-700 ring-white/65'}`}>
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          isReady
            ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]'
            : isPending
              ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
              : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.75)]'
        }`}
      />
      <span>{label}: {isReady ? 'Sẵn sàng' : isPending ? 'Đang khởi động' : 'Cần kiểm tra'}</span>
    </div>
  );
};

const ActionButton = ({ children, onClick, disabled = false, emphasis = false, dark = false }: { children: ReactNode; onClick: () => void; disabled?: boolean; emphasis?: boolean; dark?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-45 ${
      emphasis
        ? dark
          ? 'bg-gradient-to-r from-[#7b5a21] via-[#deb96f] to-[#9a7430] text-[#16110d] shadow-[0_18px_36px_rgba(214,181,109,0.22)] hover:-translate-y-0.5'
          : 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 text-white shadow-[0_18px_36px_rgba(139,92,246,0.3)] hover:-translate-y-0.5'
        : dark
          ? 'bg-white/6 text-white ring-1 ring-white/10 backdrop-blur hover:bg-white/10'
          : 'bg-white/75 text-slate-700 ring-1 ring-white/70 backdrop-blur hover:bg-white/90'
    }`}
  >
    {children}
  </button>
);

export function ControlPanel({ shape, onShapeChange, theme, onThemeChange, onReset, onSave, onFacingModeChange, cameraFacingMode, onZoomChange, zoom, cameraStatus, trackerStatus, holdProgress, hasCapture, captureLocked, onToggleCaptureLock }: ControlPanelProps) {
  const dark = theme.includes('locketGold') || theme === 'neon';
  const appTheme = APP_THEME_VISUALS[theme];
  const [themeOpen, setThemeOpen] = useState(false);
  const themePopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!themeOpen) {
      return undefined;
    }

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && themePopoverRef.current?.contains(target)) {
        return;
      }
      setThemeOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [themeOpen]);

  const currentThemeCard = THEME_CARDS.find((item) => item.value === theme) ?? THEME_CARDS[0];

  return (
    <div className={`${dark ? 'pretty-card-dark' : 'pretty-card'} relative overflow-hidden p-4 sm:p-5`}>
      <div className={`absolute inset-x-0 top-0 h-20 ${dark ? 'bg-gradient-to-r from-amber-500/12 via-yellow-200/10 to-transparent' : 'bg-gradient-to-r from-fuchsia-200/55 via-violet-200/40 to-sky-200/50'}`} />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${appTheme.sectionEyebrow}`}>Bảng điều khiển camera</p>
            <h2 className={`mt-1 text-lg font-semibold sm:text-xl ${appTheme.heading}`}>Chọn UI, đổi camera, zoom rồi chụp như vibe ảnh mẫu.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip label="Camera" status={cameraStatus} dark={dark} />
            <StatusChip label="Tay" status={trackerStatus} dark={dark} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${dark ? 'text-white/55' : 'text-slate-500'}`}>UI / Theme</p>
            <p className={`text-xs ${dark ? 'text-[#e0c588]' : 'text-slate-500'}`}>1 nút mở / đóng theme</p>
          </div>

          <div ref={themePopoverRef} className="relative">
            <button
              type="button"
              onClick={() => setThemeOpen((current) => !current)}
              className={`group flex w-full items-center justify-between gap-3 rounded-[24px] border px-4 py-3 text-left transition ${dark ? 'border-amber-300/25 bg-white/6 text-white hover:bg-white/10' : 'border-white/75 bg-white/75 text-slate-800 hover:bg-white'} shadow-[0_16px_30px_rgba(15,23,42,0.08)]`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={`h-11 w-20 shrink-0 rounded-2xl bg-gradient-to-r ${currentThemeCard.preview} ring-1 ${dark ? 'ring-white/10' : 'ring-black/5'}`} />
                <div className="min-w-0">
                  <div className={`truncate text-sm font-semibold ${appTheme.heading}`}>Theme hiện tại · {currentThemeCard.label}</div>
                  <div className={`truncate text-xs ${appTheme.body}`}>{currentThemeCard.sublabel}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentThemeCard.badge && <span className={`rounded-full px-2 py-0.5 text-[10px] ${dark ? 'bg-amber-400/10 text-amber-200' : 'bg-slate-100 text-slate-500'}`}>{currentThemeCard.badge}</span>}
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dark ? 'bg-[#1b1208] text-[#f0d18a]' : 'bg-slate-100 text-slate-600'}`}>{themeOpen ? 'Ẩn' : 'Mở'}</span>
              </div>
            </button>

            {themeOpen && (
              <div className={`absolute inset-x-0 top-[calc(100%+12px)] z-20 rounded-[28px] border p-3 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl ${dark ? 'border-amber-300/20 bg-[#120d09]/95' : 'border-white/70 bg-white/92'}`}>
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${dark ? 'text-[#f0d18a]' : 'text-slate-500'}`}>Chọn theme rồi web auto reload</p>
                  <button
                    type="button"
                    onClick={() => setThemeOpen(false)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${dark ? 'bg-white/6 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Đóng
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {THEME_CARDS.map((item) => {
                    const active = item.value === theme;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setThemeOpen(false);
                          onThemeChange(item.value);
                        }}
                        className={`rounded-[24px] border p-3 text-left transition ${active ? (dark ? 'border-amber-400/40 bg-white/10 shadow-[0_14px_30px_rgba(217,187,109,0.12)]' : 'border-fuchsia-300 bg-white/90 shadow-[0_14px_30px_rgba(217,70,239,0.16)]') : (dark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-white/70 bg-white/60 hover:bg-white/85')}`}
                      >
                        <div className={`h-12 rounded-2xl bg-gradient-to-r ${item.preview}`} />
                        <div className={`mt-3 flex items-center justify-between gap-2 text-sm font-semibold ${appTheme.heading}`}>
                          <span>{item.label}</span>
                          {item.badge && <span className={`rounded-full px-2 py-0.5 text-[10px] ${dark ? 'bg-amber-400/10 text-amber-200' : 'bg-slate-100 text-slate-500'}`}>{item.badge}</span>}
                        </div>
                        <div className={`text-xs ${appTheme.body}`}>{item.sublabel}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {shapes.map((shapeOption) => {
            const active = shape === shapeOption.value;
            return (
              <button
                key={shapeOption.value}
                type="button"
                onClick={() => onShapeChange(shapeOption.value)}
                className={`group flex items-center gap-3 rounded-3xl border px-3.5 py-3 text-left transition ${active ? (dark ? 'border-amber-400/30 bg-white/10 text-white shadow-[0_14px_28px_rgba(217,187,109,0.12)]' : 'border-fuchsia-300 bg-gradient-to-r from-white to-fuchsia-50/90 text-slate-900 shadow-[0_14px_28px_rgba(217,70,239,0.16)]') : (dark ? 'border-white/10 bg-white/5 text-white/75 hover:border-amber-300/20 hover:bg-white/10' : 'border-white/70 bg-white/60 text-slate-600 hover:border-fuchsia-200 hover:bg-white/85')}`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${active ? (dark ? 'bg-amber-400/10 text-amber-200' : 'bg-fuchsia-100 text-fuchsia-600') : (dark ? 'bg-white/6 text-white/70' : 'bg-slate-100 text-slate-500')}`}>
                  <ShapeIcon active={active} shape={shapeOption.value} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{shapeOption.label}</span>
                  <span className={`block text-xs ${dark ? 'text-white/55' : 'text-slate-500'}`}>{shapeOption.sublabel}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className={`rounded-[28px] p-4 ring-1 ${dark ? 'bg-white/5 ring-white/10' : 'bg-white/75 ring-white/70'}`}>
            <div className={`flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.2em] ${dark ? 'text-white/60' : 'text-slate-500'}`}>
              <span>Zoom camera</span>
              <span>{zoom.supported ? `${zoom.value.toFixed(1)}x` : 'Trình duyệt giới hạn'}</span>
            </div>
            <input type="range" min={zoom.min} max={zoom.max} step={zoom.step} value={Math.min(zoom.max, Math.max(zoom.min, zoom.value))} disabled={!zoom.supported} onChange={(event) => onZoomChange(Number(event.target.value))} className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-fuchsia-500 disabled:cursor-not-allowed" />
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton dark={dark} onClick={() => onFacingModeChange(cameraFacingMode === 'user' ? 'environment' : 'user')}>
                ↺ {cameraFacingMode === 'user' ? 'Cam sau' : 'Cam trước'}
              </ActionButton>
              <div className={`inline-flex items-center rounded-2xl px-4 py-3 text-xs font-semibold ${dark ? 'bg-[#0f0b08] text-[#e7d3a4]' : 'bg-slate-900/90 text-white'}`}>
                {zoom.supported ? 'Zoom thật nếu máy hỗ trợ' : 'Máy này không hỗ trợ zoom thật'}
              </div>
            </div>
          </div>

          <div className={`rounded-[28px] p-4 ring-1 ${dark ? 'bg-white/5 ring-white/10' : 'bg-white/75 ring-white/70'}`}>
            <div className={`flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] ${dark ? 'text-white/60' : 'text-slate-500'}`}>
              <span>Giữ khung</span>
              <span>{Math.round(holdProgress * 100)}%</span>
            </div>
            <div className={`mt-3 h-3 overflow-hidden rounded-full ${dark ? 'bg-white/8' : 'bg-slate-200/90'}`}>
              <div
                className={`h-full rounded-full transition-all duration-150 ${dark ? 'bg-gradient-to-r from-[#836126] via-[#efcf89] to-[#8d6a31]' : 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500'}`}
                style={{ width: `${Math.max(8, holdProgress * 100)}%` }}
              />
            </div>
            <p className={`mt-3 text-xs leading-6 ${appTheme.body}`}>
              Khi khung ổn định đủ lâu, ảnh bên ngoài portal sẽ được chụp lại. Sau đó bạn có thể bật Lock để khóa luôn phần bên trong khung rồi lưu dễ hơn.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <ActionButton dark={dark} emphasis={hasCapture} onClick={onSave} disabled={!hasCapture}>
            ⤓ Lưu ảnh portal
          </ActionButton>
          <ActionButton dark={dark} emphasis={hasCapture && captureLocked} onClick={onToggleCaptureLock} disabled={!hasCapture}>
            {captureLocked ? '🔓 Mở lock khung trong' : '🔒 Lock khung trong'}
          </ActionButton>
          <ActionButton dark={dark} onClick={onReset}>
            ↺ {hasCapture ? 'Chụp lại từ đầu' : 'Reset portal'}
          </ActionButton>
          <div className={`rounded-[24px] px-4 py-3 text-sm ${dark ? 'bg-white/6 text-white/70 ring-1 ring-white/10' : 'bg-white/75 text-slate-600 ring-1 ring-white/70'}`}>
            {hasCapture
              ? captureLocked
                ? 'Đang khóa cả khung trong để bạn canh và lưu dễ hơn.'
                : 'Đã chụp phần ngoài portal. Bật Lock nếu muốn giữ nguyên phần trong khung.'
              : 'Canh tay vào khung, giữ yên để portal tự chụp.'}
          </div>
        </div>
      </div>
    </div>
  );
}
