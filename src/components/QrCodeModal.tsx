import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode as QrIcon, Copy, Check, ExternalLink, Download } from 'lucide-react';
import { RedirectLink } from '../types/redirect';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: RedirectLink | null;
  baseUrl: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  link,
  baseUrl,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const fullUrl = link ? `${baseUrl}/r/${link.slug}` : '';

  useEffect(() => {
    if (isOpen && fullUrl) {
      QRCode.toDataURL(fullUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setDataUrl(url))
        .catch((err) => console.error('Failed generating QR code:', err));
    }
  }, [isOpen, fullUrl]);

  if (!isOpen || !link) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-title"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-3">
          <QrIcon className="w-5 h-5" />
        </div>

        <h3 id="qr-title" className="text-base font-bold text-white mb-1">
          Scan to Test Mobile Redirection
        </h3>
        <p className="text-xs text-slate-400 mb-4 truncate" title={link.title}>
          {link.title} (<span className="text-cyan-300 font-mono">/r/{link.slug}</span>)
        </p>

        {/* QR Canvas / Image */}
        <div className="bg-white p-3 rounded-xl inline-block shadow-inner mb-4">
          {dataUrl ? (
            <img src={dataUrl} alt={`QR Code for /r/${link.slug}`} className="w-56 h-56 mx-auto" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-500 text-xs">
              Generating QR...
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono break-all mb-4">
          {fullUrl}
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          {dataUrl && (
            <a
              href={dataUrl}
              download={`qrcode-${link.slug}.png`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
