import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function MfaEnroll({ onEnrolled }: { onEnrolled: () => void }) {
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code); // L'API renvoie une image SVG encodée
    })();
  }, []);

  const handleEnable = async () => {
    setError('');
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) return setError(challenge.error.message);

    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: verifyCode,
    });

    if (verify.error) setError(verify.error.message);
    else onEnrolled();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Activez la Double Authentification</h2>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <p className="text-sm text-gray-600 mb-4">Scannez ce QR Code avec Google Authenticator ou Authy.</p>
      {qrCode && <img src={qrCode} alt="QR Code MFA" className="mx-auto mb-4" />}
      <input
        type="text" placeholder="Code à 6 chiffres"
        value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.trim())}
        className="w-full border p-2 rounded mb-4"
      />
      <button onClick={handleEnable} className="w-full bg-teal-600 text-white p-2 rounded">
        Activer le MFA
      </button>
    </div>
  );
}