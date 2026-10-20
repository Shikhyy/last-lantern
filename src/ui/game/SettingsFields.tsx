import { audio } from '@/audio/audio';
import { useSettingsStore } from '@/state/settingsStore';
import { Icon } from './Icon';

/**
 * The actual controls, shared by the title gate and the in-match settings
 * sheet. Keeping them in one place means a setting cannot drift between the
 * two surfaces.
 */
export function SettingsFields({ compact = false }: { compact?: boolean }) {
  const settings = useSettingsStore((state) => state.settings);
  const set = useSettingsStore((state) => state.set);
  const reset = useSettingsStore((state) => state.reset);

  const enableSound = () => {
    audio.start();
    audio.sfx('click');
  };

  return (
    <>
      <fieldset className="settings-block">
        <legend>Image quality</legend>
        <p>Lower tiers reduce shadow resolution, texture size, and post-processing. The palace keeps its shape.</p>
        <div className="segmented segmented--wide">
          {(['auto', 'high', 'medium', 'low'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              className={settings.quality === tier ? 'segmented__item is-active' : 'segmented__item'}
              aria-pressed={settings.quality === tier}
              onClick={() => set({ quality: tier })}
            >
              {tier === 'auto' ? 'Automatic' : tier === 'high' ? 'High' : tier === 'medium' ? 'Balanced' : 'Light'}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="settings-block">
        <label className="toggle-row">
          <span>
            <b>Reduced motion</b>
            <small>Camera cuts instead of travel; interface fades instead of slides.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(event) => set({ reducedMotion: event.target.checked })}
          />
          <span className="toggle" aria-hidden="true" />
        </label>
        <label className="toggle-row">
          <span>
            <b>High contrast</b>
            <small>Stronger ivory text, deeper fields, and firmer focus rings.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(event) => set({ highContrast: event.target.checked })}
          />
          <span className="toggle" aria-hidden="true" />
        </label>
        <label className="toggle-row">
          <span>
            <b>Sound</b>
            <small>Generated ambience and struck-brass cues. Nothing is downloaded.</small>
          </span>
          <input
            type="checkbox"
            checked={!settings.muted}
            onChange={(event) => {
              enableSound();
              set({ muted: !event.target.checked });
            }}
          />
          <span className="toggle" aria-hidden="true" />
        </label>
      </div>

      <fieldset className="settings-block" disabled={settings.muted}>
        <legend>Balance</legend>
        <label className="slider-row">
          <span>Master</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.master}
            aria-label="Master volume"
            onChange={(event) => set({ master: Number(event.target.value) })}
          />
          <b>{Math.round(settings.master * 100)}</b>
        </label>
        <label className="slider-row">
          <span>Ambience</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.ambience}
            aria-label="Ambience volume"
            onChange={(event) => set({ ambience: Number(event.target.value) })}
          />
          <b>{Math.round(settings.ambience * 100)}</b>
        </label>
        <label className="slider-row">
          <span>Cues</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.sfx}
            aria-label="Cue volume"
            onChange={(event) => set({ sfx: Number(event.target.value) })}
          />
          <b>{Math.round(settings.sfx * 100)}</b>
        </label>
        <button
          type="button"
          className="button button--quiet"
          onClick={() => {
            enableSound();
            audio.sfx('bell');
          }}
        >
          Test the bell
        </button>
      </fieldset>

      {!compact ? (
        <div className="sheet__actions">
          <button type="button" className="text-button" onClick={reset}>
            Restore defaults
          </button>
        </div>
      ) : (
        <div className="overlay__inline-actions">
          <button type="button" className="text-button" onClick={reset}>
            <Icon name="warning" /> Restore defaults
          </button>
        </div>
      )}
    </>
  );
}
