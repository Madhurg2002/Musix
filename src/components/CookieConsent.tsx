import React, { useState } from 'react';
import { declineConsent, grantConsent, readConsent, type ConsentChoice } from '../utils/consent';
import { clearAllPreferences } from '../utils/preferences';
import { Icon } from './Icon';

interface CookieConsentProps {
  /** Held true while the footer's "Cookie settings" button wants the panel open. */
  forceOpen?: boolean;
  onClose?: () => void;
}

/**
 * The permission bar for preference storage.
 *
 * It appears on a first visit, before anything has been written, and can be reopened from
 * the footer so the choice is never one-way. "Allow" releases the writes made while the
 * learner was deciding; "Not now" records a refusal and forgets them, and reopening later
 * offers to forget what is already stored.
 */
export const CookieConsent: React.FC<CookieConsentProps> = ({ forceOpen = false, onClose }) => {
  const [choice, setChoice] = useState<ConsentChoice | null>(() => readConsent());

  const visible = choice === null || forceOpen;

  const decide = (next: ConsentChoice) => {
    if (next === 'granted') {
      grantConsent();
    } else {
      declineConsent();
      clearAllPreferences();
    }
    setChoice(next);
    onClose?.();
  };

  if (!visible) return null;

  const secondary =
    choice === 'granted'
      ? { label: 'Forget my preferences', action: () => decide('declined') }
      : choice === 'declined'
        ? { label: 'Close', action: () => onClose?.() }
        : { label: 'Not now', action: () => decide('declined') };

  return (
    <aside className="consent-bar print:hidden" role="dialog" aria-labelledby="consent-title">
      <div className="consent-bar__text">
        <strong className="consent-bar__title" id="consent-title">
          Remember my settings?
        </strong>
        <p className="consent-bar__copy">
          Musix can keep your key, instrument, theme, scale, and practice settings on this
          device between visits. First-party cookies only — no analytics, no ads, no third
          parties, and nothing ever leaves your browser.
        </p>
      </div>

      <div className="consent-bar__actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={choice === 'granted'}
          onClick={() => decide('granted')}
        >
          {choice === 'granted' ? (
            <>
              <Icon name="check" /> Allowed
            </>
          ) : (
            'Allow preferences'
          )}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={secondary.action}>
          {secondary.label}
        </button>
      </div>

      <p className="consent-bar__note">
        Declining keeps settings for this visit only. Change your mind any time from
        <strong> Cookie settings</strong> in the footer.
      </p>
    </aside>
  );
};

export default CookieConsent;
