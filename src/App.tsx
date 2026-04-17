import { useEffect, useMemo, useState } from 'react';
import { PortalExperience } from './components/PortalExperience';
import { APP_THEME_VISUALS, THEME_CARDS } from './themePresets';
import type { ShapeMode, ThemeMode } from './types';

const heroShapes: Array<{ label: string; shape: ShapeMode; emoji: string; hint: string }> = [
  { label: 'Tròn', shape: 'circle', emoji: '◯', hint: '2 ngón trỏ bám theo đường kính' },
  { label: 'Bo góc', shape: 'roundedRect', emoji: '▢', hint: '2 ngón trỏ + 2 ngón cái tạo khung' },
  { label: 'Trái tim', shape: 'heart', emoji: '♡', hint: '4 ngón định cỡ trái tim' },
  { label: 'Ngôi sao', shape: 'star', emoji: '✦', hint: '4 ngón định cỡ ngôi sao' },
];

const THEME_STORAGE_KEY = 'time-portal-theme';

const readInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'locketGold';
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  return saved ?? 'locketGold';
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [shape, setShape] = useState<ShapeMode>('circle');
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const [portalKey, setPortalKey] = useState(0);
  const themeVisual = useMemo(() => APP_THEME_VISUALS[theme], [theme]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.body.dataset.uiTheme = theme;
  }, [theme]);

  const handleThemeChange = (nextTheme: ThemeMode) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
    setPortalKey((current) => current + 1);

    window.setTimeout(() => {
      window.location.reload();
    }, 120);
  };

  const isDark = theme.includes('locketGold') || theme === 'neon';

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${themeVisual.page}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.05),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.04),_transparent_32%)]" />
      <div className={`pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full blur-3xl ${themeVisual.orbs[0]}`} />
      <div className={`pointer-events-none absolute bottom-6 right-[-5rem] h-80 w-80 rounded-full blur-3xl ${themeVisual.orbs[1]}`} />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] backdrop-blur ring-1 ${themeVisual.badge}`}>
              ✨ Time Portal Camera
            </div>
            <h1 className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl ${themeVisual.heading}`}>
              Web camera mobile-ready, đổi UI thấy ngay và có cả cụm Locket Gold tối màu.
            </h1>
            <p className={`mt-3 max-w-3xl text-sm leading-7 sm:text-base ${themeVisual.body}`}>
              Mình đã tăng thêm nhiều UI hơn, đặc biệt thêm 4 preset tối kiểu Locket Gold. Giờ theme được gom vào một nút bật/tắt gọn hơn, và sau khi chụp bạn còn có thể lock khung trong để lưu dễ hơn.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className={`inline-flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 ${themeVisual.primaryButton}`}
          >
            {started ? 'Camera đã mở' : 'Bắt đầu mở camera'}
          </button>
        </header>

        {!started ? (
          <section className="my-auto grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className={`${themeVisual.heroCard} p-6 sm:p-8`}>
              <div className="grid gap-6">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${themeVisual.sectionEyebrow}`}>
                    Điểm mới
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className={`rounded-[24px] p-4 shadow-sm ring-1 ${isDark ? 'bg-white/5 text-white ring-white/10' : 'bg-white/70 text-slate-800 ring-white/70'}`}>
                      <p className="text-sm font-semibold">1. Nhiều UI hơn</p>
                      <p className={`mt-2 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Có cả cụm Locket Gold tối màu: Gold, Midnight, Espresso, Velvet.</p>
                    </div>
                    <div className={`rounded-[24px] p-4 shadow-sm ring-1 ${isDark ? 'bg-white/5 text-white ring-white/10' : 'bg-white/70 text-slate-800 ring-white/70'}`}>
                      <p className="text-sm font-semibold">2. Nút theme gọn hơn</p>
                      <p className={`mt-2 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Danh sách theme được gom vào một nút bật/tắt, chọn xong web vẫn tự reload để áp giao diện rõ ràng.</p>
                    </div>
                    <div className={`rounded-[24px] p-4 shadow-sm ring-1 ${isDark ? 'bg-white/5 text-white ring-white/10' : 'bg-white/70 text-slate-800 ring-white/70'}`}>
                      <p className="text-sm font-semibold">3. Có thêm nút lock</p>
                      <p className={`mt-2 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Sau khi chụp có thể lock phần trong portal, chưa ưng thì mở lock ra để canh lại rồi lưu.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${themeVisual.sectionEyebrow}`}>
                    Chọn shape mở đầu
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {heroShapes.map((entry) => {
                      const active = entry.shape === shape;
                      return (
                        <button
                          key={entry.shape}
                          type="button"
                          onClick={() => setShape(entry.shape)}
                          className={`rounded-[26px] px-4 py-4 text-left transition ${
                            active
                              ? `${themeVisual.primaryButton}`
                              : isDark
                                ? 'bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10'
                                : 'bg-white/75 text-slate-700 ring-1 ring-white/80 hover:bg-white'
                          }`}
                        >
                          <div className="text-2xl">{entry.emoji}</div>
                          <div className="mt-2 text-sm font-semibold">{entry.label}</div>
                          <div className={`mt-1 text-xs ${active ? 'text-current/80' : isDark ? 'text-white/60' : 'text-slate-500'}`}>
                            {entry.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${themeVisual.heroCard} relative overflow-hidden p-6 sm:p-8`}>
              <div className={`absolute inset-x-0 top-0 h-36 ${isDark ? 'bg-gradient-to-r from-amber-500/10 via-yellow-200/10 to-transparent' : 'bg-gradient-to-r from-fuchsia-200/50 via-violet-200/30 to-sky-200/50'}`} />
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${themeVisual.sectionEyebrow}`}>
                    UI presets
                  </p>
                  <h2 className={`mt-3 text-2xl font-semibold ${themeVisual.heading}`}>
                    Lần này đổi UI phải thấy rõ, nhất là họ Locket Gold tối màu.
                  </h2>
                  <p className={`mt-3 text-sm leading-7 ${themeVisual.body}`}>
                    Preset mới tập trung vào kiểu tối, gold, sang hơn. Mỗi khi đổi UI, web sẽ reload để áp màu nền, card, sân khấu và panel một cách dứt khoát.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {THEME_CARDS.slice(0, 6).map((item) => {
                    const active = item.value === theme;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleThemeChange(item.value)}
                        className={`rounded-[24px] border p-3 text-left transition ${active ? (isDark ? 'border-amber-400/40 bg-white/10 shadow-[0_18px_30px_rgba(200,159,77,0.16)]' : 'border-fuchsia-300 bg-white shadow-[0_18px_30px_rgba(139,92,246,0.18)]') : (isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-white/70 bg-white/70 hover:bg-white/90')}`}
                      >
                        <div className={`h-12 rounded-2xl bg-gradient-to-r ${item.preview}`} />
                        <div className={`mt-3 text-sm font-semibold ${themeVisual.heading}`}>{item.label}</div>
                        <div className={`text-xs ${themeVisual.body}`}>{item.sublabel}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-6 pb-8">
            <PortalExperience
              key={`${theme}-${portalKey}`}
              shape={shape}
              onShapeChange={setShape}
              theme={theme}
              onThemeChange={handleThemeChange}
            />
          </section>
        )}
      </main>
    </div>
  );
}
