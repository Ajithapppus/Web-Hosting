import React, { useState } from 'react';
import {
  X,
  Check,
  ShieldCheck,
  Zap,
  CreditCard,
  Building2,
  Lock,
  ArrowRight,
  AlertCircle,
  Rocket,
} from 'lucide-react';
import { HostingPlan, HostingStats } from '../types';
import { api } from '../lib/api';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: HostingPlan[];
  currentStats: HostingStats | null;
  onSuccess: (message: string) => void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  plans,
  currentStats,
  onSuccess,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'razorpay'>('stripe');
  const [step, setStep] = useState<'compare' | 'checkout' | 'success'>('compare');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [upiId, setUpiId] = useState('dev@okhdfcbank');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upgradedDetails, setUpgradedDetails] = useState<any>(null);

  if (!isOpen) return null;

  const currentPlanId = currentStats?.planId || 'starter';
  const targetPlan = plans.find((p) => p.id === selectedPlanId) || plans[1] || plans[0];
  const targetPrice = billingCycle === 'annual' ? targetPlan.priceAnnual : targetPlan.priceMonthly;

  const handleStartCheckout = (planId: string) => {
    setSelectedPlanId(planId);
    setStep('checkout');
    setErrorMessage(null);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const sessionRes = await api.createCheckoutSession(targetPlan.id, billingCycle, paymentProvider);
      const verifyRes = await api.verifyPayment({
        sessionId: sessionRes.sessionId,
        planId: targetPlan.id,
        billingCycle,
        provider: paymentProvider,
        paymentMethod: paymentProvider === 'razorpay' ? `UPI (${upiId})` : `Visa (${cardNumber.slice(-4)})`,
        simulateFailure,
      });

      setUpgradedDetails(verifyRes);
      setStep('success');
      onSuccess(verifyRes.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('compare');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-indigo-100 text-indigo-700 rounded-md">
                <Rocket className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {step === 'checkout' ? 'Complete Hosting Tier Checkout' : step === 'success' ? 'Hosting Upgraded' : 'Select Cloud Hosting Tier'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active plan: <strong className="text-slate-900">{currentStats?.currentPlan}</strong> ({currentStats?.totalProjects} of {currentStats?.maxProjects} hosted websites)
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'compare' && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-center">
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <span>Annual</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                    Save ~20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((p) => {
                const isCurrent = p.id === currentPlanId;
                const price = billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;
                const isHighlighted = p.isPopular;

                return (
                  <div
                    key={p.id}
                    className={`relative rounded-xl p-6 transition-all border flex flex-col justify-between ${
                      isHighlighted
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-1 ring-indigo-600'
                        : isCurrent
                        ? 'border-slate-300 bg-slate-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-full uppercase tracking-wider">
                        Recommended
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                        {isCurrent && (
                          <span className="text-xs font-medium text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.tagline}</p>

                      <div className="mt-4 pb-4 border-b border-slate-200/60">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                            ${price}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            /{billingCycle === 'annual' ? 'yr' : 'mo'}
                          </span>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-indigo-700">
                          <Rocket className="w-3.5 h-3.5" />
                          <span>Capacity: <strong className="font-mono tabular-nums">{p.maxProjects} hosted websites</strong></span>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2 text-xs text-slate-600">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2.5 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"
                        >
                          Current Active Plan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartCheckout(p.id)}
                          className={`w-full py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs ${
                            isHighlighted
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          <span>Switch to {p.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 'checkout' && (
          <form onSubmit={handleExecutePayment} className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
            {errorMessage && (
              <div className="p-3.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Selected Hosting Tier:</p>
                <h4 className="text-base font-bold text-slate-900">{targetPlan.name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Expand capacity to <strong className="font-mono tabular-nums">{targetPlan.maxProjects} hosted websites</strong> & {targetPlan.bandwidthLimitGB} GB Edge bandwidth
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  ${targetPrice}
                </div>
                <div className="text-xs text-slate-500">/{billingCycle === 'annual' ? 'year' : 'month'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentProvider('stripe')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between ${
                  paymentProvider === 'stripe' ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Stripe</p>
                    <p className="text-[11px] text-slate-500">Cards</p>
                  </div>
                </div>
                {paymentProvider === 'stripe' && <Check className="w-4 h-4 text-indigo-600" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentProvider('razorpay')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between ${
                  paymentProvider === 'razorpay' ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Razorpay</p>
                    <p className="text-[11px] text-slate-500">UPI / NetBanking</p>
                  </div>
                </div>
                {paymentProvider === 'razorpay' && <Check className="w-4 h-4 text-indigo-600" />}
              </button>
            </div>

            {paymentProvider === 'stripe' ? (
              <div className="space-y-3 p-4 bg-slate-50/60 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Expires</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200">
                <label className="block text-[11px] text-slate-500 mb-1">UPI Virtual ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('compare')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                &larr; Back
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Verifying with Edge Gateway...' : `Confirm & Upgrade ($${targetPrice})`}</span>
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="p-8 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Hosting Capacity Activated</h3>
            <p className="text-xs text-slate-600">
              Your account has been upgraded to <strong>{upgradedDetails?.stats?.currentPlan}</strong>. You can now host up to <strong className="font-mono tabular-nums">{upgradedDetails?.stats?.maxProjects} websites</strong>.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Return to Hosting Console
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
