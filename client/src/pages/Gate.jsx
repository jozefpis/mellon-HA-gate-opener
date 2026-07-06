import { useParams } from 'react-router-dom';
import { useGate } from '../useGate.js';
import { useI18n, LocaleSwitcher } from '../i18n.jsx';
import BasicGate from '../themes/BasicGate.jsx';
import LotrGate from '../themes/LotrGate.jsx';

export default function Gate() {
  const { token } = useParams();
  const { t } = useI18n();
  const gate = useGate(token);

  if (gate.status === 'loading') {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (gate.status === 'notfound') {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <LocaleSwitcher />
        <div className="center-msg">
          <h1 style={{ fontSize: '1.3rem' }}>{t('gate_notfound_title')}</h1>
          <p>{t('gate_notfound_text')}</p>
        </div>
      </div>
    );
  }

  const Theme = gate.link?.theme === 'lotr' ? LotrGate : BasicGate;
  return <Theme {...gate} />;
}
