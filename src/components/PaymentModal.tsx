import React, { useState, useEffect } from "react";
import { X, QrCode, CreditCard, Banknote, ShieldCheck, RefreshCw } from "lucide-react";

interface PaymentModalProps {
  onClose: () => void;
}

export default function PaymentModal({ onClose }: PaymentModalProps) {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState<boolean>(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await response.json();
        if (data && data.rates && data.rates.LKR) {
          setExchangeRate(data.rates.LKR);
        }
      } catch (err) {
        console.error("Failed to fetch exchange rate", err);
        setExchangeRate(300); // Fallback estimate
      } finally {
        setLoadingRate(false);
      }
    };
    fetchRate();
  }, []);

  const standardUsd = 15;
  const proUsd = 35;

  const getLkrString = (usd: number) => {
    if (loadingRate) return "Calculating...";
    if (!exchangeRate) return "LKR (Error)";
    return `~LKR ${(usd * exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131422] border border-emerald-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] relative flex flex-col max-h-[90vh]">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />
        
        <div className="p-6 pb-4 border-b border-white/10 flex justify-between items-center bg-[#181a2b]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Purchasing Plan & Payment Options
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Plan Options */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-white/10 bg-white/5 rounded-xl p-5 hover:border-emerald-500/50 transition cursor-pointer relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-lg font-bold text-white mb-2">Creator Standard</h3>
              <div className="text-2xl font-black text-emerald-400 mb-0">${standardUsd} <span className="text-sm text-slate-500 font-normal">/ month</span></div>
              <div className="text-xs text-slate-400 font-mono mb-3">{getLkrString(standardUsd)}</div>
              <ul className="text-sm text-slate-400 space-y-1.5 flex-1">
                <li>• All AI Core Features</li>
                <li>• Standard Resolution Exports</li>
                <li>• Basic Font Library</li>
              </ul>
            </div>
            
            <div className="border border-cyan-500 bg-cyan-950/20 rounded-xl p-5 hover:border-cyan-400 transition cursor-pointer relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">MOST POPULAR</div>
              <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-lg font-bold text-white mb-2">Pro Studio UltraX</h3>
              <div className="text-2xl font-black text-cyan-400 mb-0">${proUsd} <span className="text-sm text-slate-500 font-normal">/ month</span></div>
              <div className="text-xs text-slate-400 font-mono mb-3">{getLkrString(proUsd)}</div>
              <ul className="text-sm text-slate-400 space-y-1.5 flex-1">
                <li>• Access to Premium Skins & Themes</li>
                <li>• 4K Ultra Lossless Exports</li>
                <li>• Priority Cloud Rendering</li>
              </ul>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-[#0f101a] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Secure Payment Gateway
            </h3>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* eZ Cash */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  <Banknote className="w-5 h-5 text-orange-400" />
                  <span className="font-bold text-orange-50 text-base">eZ Cash (Sri Lanka)</span>
                </div>
                <div className="bg-orange-950/20 border border-orange-500/20 rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-slate-400 text-sm">Send your payment to this number:</span>
                  <a href="tel:0760666970" className="text-xl font-mono font-bold text-orange-400 hover:text-orange-300 cursor-pointer block tracking-wider bg-orange-950/50 px-3 py-1 rounded">
                    0760666970
                  </a>
                  <p className="text-[11px] text-slate-500 mt-2">After transferring, send us a WhatsApp message with the receipt to activate your plan.</p>
                </div>
              </div>

              <div className="hidden md:block w-px bg-white/10" />

              {/* PayPal / QR */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  <QrCode className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-blue-50 text-base">International (PayPal)</span>
                </div>
                
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="bg-white p-2.5 rounded-xl inline-block shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform">
                    {/* Placeholder for QR Code, rendering an artistic grid as a mock QR */}
                    <div className="w-24 h-24 bg-white flex items-center justify-center rounded">
                      <QrCode className="w-20 h-20 text-black" strokeWidth={1} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-2">Scan QR to pay directly</p>
                    <a 
                      href="https://paypal.me" 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                    >
                      Pay via PayPal
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
