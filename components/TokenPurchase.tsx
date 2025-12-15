import React, { useState } from 'react';
import { X, Coins, Check, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { addTokens } from '../services/tokenService';

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 100,
    price: 4.99,
    bonus: 0,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    tokens: 300,
    price: 12.99,
    bonus: 50,
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    tokens: 1000,
    price: 39.99,
    bonus: 200,
  },
];

interface TokenPurchaseProps {
  onClose: () => void;
}

export const TokenPurchase: React.FC<TokenPurchaseProps> = ({ onClose }) => {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { refreshTokenBalance } = useAuth();

  const handlePurchase = async (pkg: TokenPackage) => {
    setIsProcessing(true);
    try {
      // TODO: Integrate with payment system (Stripe, PayPal, etc.)
      // For now, this directly adds tokens (for testing/demo purposes)
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add tokens to user account
      const totalTokens = pkg.tokens + (pkg.bonus || 0);
      const result = await addTokens(totalTokens);
      
      if (result.success) {
        await refreshTokenBalance();
        alert(`Successfully purchased ${totalTokens} tokens!`);
        onClose();
      } else {
        alert(`Error: ${result.error || 'Failed to add tokens'}`);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(`Error processing purchase: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Coins size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Buy Tokens</h2>
              <p className="text-sm text-slate-500">Choose a package to get more tokens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Packages */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {TOKEN_PACKAGES.map((pkg) => {
              const totalTokens = pkg.tokens + (pkg.bonus || 0);
              const pricePerToken = (pkg.price / totalTokens).toFixed(3);
              
              return (
                <div
                  key={pkg.id}
                  className={`relative bg-white border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                    pkg.popular
                      ? 'border-blue-500 shadow-md'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <Coins size={32} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{pkg.name}</h3>
                    <div className="flex items-baseline justify-center space-x-2">
                      <span className="text-4xl font-bold text-slate-900">{pkg.tokens}</span>
                      {pkg.bonus && (
                        <span className="text-lg text-green-600 font-semibold">
                          +{pkg.bonus} bonus
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {totalTokens} total tokens
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-sm text-slate-600">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>{pkg.tokens} base tokens</span>
                    </div>
                    {pkg.bonus && (
                      <div className="flex items-center text-sm text-slate-600">
                        <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-green-600 font-semibold">
                          {pkg.bonus} bonus tokens
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-slate-600">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>${pricePerToken} per token</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>
                        ~{Math.floor(totalTokens / 30)} image generations
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 mb-1">
                        ${pkg.price}
                      </div>
                      <p className="text-xs text-slate-500">One-time payment</p>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    variant={pkg.popular ? 'primary' : 'outline'}
                    onClick={() => handlePurchase(pkg)}
                    disabled={isProcessing}
                    isLoading={isProcessing && selectedPackage?.id === pkg.id}
                    icon={<Sparkles size={18} />}
                  >
                    {isProcessing && selectedPackage?.id === pkg.id
                      ? 'Processing...'
                      : 'Buy Now'}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <Sparkles size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Each image generation costs 30 tokens</li>
                  <li>Tokens never expire</li>
                  <li>Purchase tokens instantly and start generating</li>
                  <li>Bonus tokens are included in your total balance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Note: This is a demo. In production, integrate with a payment provider like Stripe or PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

