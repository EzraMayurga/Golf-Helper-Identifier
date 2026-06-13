import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Check, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const isPremium = user?.subscriptionStatus === 'premium';

  const price = billingCycle === 'monthly' ? 19 : 190;

  const handleSubscribe = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    setSuccess(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><CreditCard className="text-gold" /> Subscription</h1>
        <p className="text-muted-foreground text-sm">Manage your plan</p>
      </div>

      {isPremium ? (
        <div className="golf-card-glow text-center py-8">
          <Star size={40} className="text-gold mx-auto mb-3" />
          <h2 className="font-display text-2xl font-bold mb-1">Premium Active</h2>
          <p className="text-muted-foreground text-sm">You have full access to all features</p>
          <div className="mt-4 golf-badge-gold">Premium Member</div>
        </div>
      ) : success ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="golf-card-glow text-center py-8">
          <Check size={48} className="text-green-400 mx-auto mb-3" />
          <h2 className="font-display text-2xl font-bold mb-1">Payment Successful!</h2>
          <p className="text-muted-foreground">Welcome to Premium. Enjoy full AI analysis features.</p>
        </motion.div>
      ) : (
        <>
          {/* Toggle */}
          <div className="flex justify-center gap-2">
            {(['monthly', 'yearly'] as const).map(cycle => (
              <button key={cycle} onClick={() => setBillingCycle(cycle)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${billingCycle === cycle ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {cycle === 'monthly' ? 'Monthly' : 'Yearly (Save 17%)'}
              </button>
            ))}
          </div>

          <div className="golf-card-glow text-center py-8">
            <h2 className="font-display text-2xl font-bold mb-1">Premium Plan</h2>
            <p className="font-display text-5xl font-bold text-gold">${price}<span className="text-base text-muted-foreground font-body">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span></p>
            <ul className="mt-6 space-y-2 max-w-xs mx-auto text-left">
              {['Unlimited video uploads', 'Full AI swing analysis', 'Injury risk detection', 'Coach feedback access', 'Premium tutorials', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm"><Check size={14} className="text-gold flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <button onClick={handleSubscribe} disabled={processing} className="golf-btn-primary mt-8 w-full max-w-xs disabled:opacity-50">
              {processing ? 'Processing Payment...' : `Subscribe for $${price}/${billingCycle === 'monthly' ? 'mo' : 'yr'}`}
            </button>
          </div>

          {/* Simulated payment form */}
          <div className="golf-card">
            <h3 className="font-display text-lg font-semibold mb-4">Payment Details (Demo)</h3>
            <div className="space-y-3">
              <div>
                <label className="golf-label block mb-1">Card Number</label>
                <input className="golf-input w-full" placeholder="4242 4242 4242 4242" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="golf-label block mb-1">Expiry</label>
                  <input className="golf-input w-full" placeholder="12/28" />
                </div>
                <div>
                  <label className="golf-label block mb-1">CVC</label>
                  <input className="golf-input w-full" placeholder="123" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SubscriptionPage;
