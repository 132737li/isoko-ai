import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

export default function Security() {
  const { t } = useTranslation();
  const [factors, setFactors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const checkMfaStatus = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) setFactors(data.totp.filter(f => f.status === 'verified'));
    setIsLoading(false);
  };

  useEffect(() => { checkMfaStatus(); }, []);

  const handleStartEnroll = async () => {
    setError(''); setSuccess(''); setIsEnrolling(true);
    const { data: allFactors } = await supabase.auth.mfa.listFactors();
    if (allFactors?.all) {
      for (const f of allFactors.all) if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) { setError(error.message); setIsEnrolling(false); return; }
    setFactorId(data.id); setQrCode(data.totp.qr_code);
  };

  const handleVerifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) { setError(challenge.error.message); return; }
    const verify = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: verifyCode });
    if (verify.error) setError("Code invalide.");
    else {
      setSuccess(t('mfa_success')); setIsEnrolling(false); setQrCode(''); setVerifyCode(''); checkMfaStatus();
    }
  };

  const handleDisableMfa = async (id: string) => {
    if (!window.confirm("Désactiver la 2FA ?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) setError(error.message);
    else { setSuccess(t('mfa_disabled_success')); checkMfaStatus(); }
  };

  if (isLoading) return <div className="p-6">{t('loading')}</div>;

  const isMfaEnabled = factors.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('security')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/dashboard" className="text-teal-600 hover:underline">{t('back_dashboard')}</Link>
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">{success}</div>}

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            {isMfaEnabled ? <ShieldCheck className="text-green-500 w-10 h-10 shrink-0" /> : <ShieldAlert className="text-orange-500 w-10 h-10 shrink-0" />}
            <div>
              <h2 className="text-lg font-bold text-gray-800">{t('mfa_title')}</h2>
              <p className="text-gray-600 text-sm mt-1">{t('mfa_desc')}</p>
            </div>
          </div>

          {!isMfaEnabled && !isEnrolling && (
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
              <span className="text-orange-800 text-sm font-medium">{t('mfa_danger')}</span>
              <Button onClick={handleStartEnroll} className="whitespace-nowrap">{t('mfa_enable')}</Button>
            </div>
          )}

          {isEnrolling && (
            <div className="border border-gray-200 p-6 rounded-lg bg-gray-50 flex flex-col items-center">
              <h3 className="font-bold text-gray-800 mb-2">{t('mfa_scan')}</h3>
              <p className="text-sm text-gray-500 mb-4 text-center">{t('mfa_scan_desc')}</p>
              {qrCode && <div className="bg-white p-2 rounded-lg shadow-sm mb-6" dangerouslySetInnerHTML={{ __html: qrCode }} />}
              <form onSubmit={handleVerifyEnroll} className="w-full max-w-xs flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700 text-center">{t('mfa_code_label')}</label>
                <input type="text" placeholder="000000" maxLength={6} value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg" required />
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="secondary" onClick={() => setIsEnrolling(false)} className="w-1/2">{t('cancel')}</Button>
                  <Button type="submit" className="w-1/2">{t('mfa_verify')}</Button>
                </div>
              </form>
            </div>
          )}

          {isMfaEnabled && !isEnrolling && (
            <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
              <span className="text-green-800 text-sm font-medium">2FA ON</span>
              <Button variant="danger" onClick={() => handleDisableMfa(factors[0].id)} className="whitespace-nowrap">{t('mfa_disable')}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}