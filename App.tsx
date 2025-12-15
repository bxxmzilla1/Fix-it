import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, ArrowRight, RotateCcw, AlertTriangle, Hammer, Download, X, Sparkles, LogIn, LogOut, User, Coins, ShoppingCart, Settings, Shield } from 'lucide-react';
import { AppStep, ImageFile } from './types';
import { generateFix } from './services/geminiService';
import { Button } from './components/Button';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { TokenPurchase } from './components/TokenPurchase';
import { AdminPage } from './components/AdminPage';
import { Toast, ToastType } from './components/Toast';
import { TOKEN_COST_PER_GENERATION } from './services/tokenService';
import { isAdmin } from './services/adminService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const { user, loading: authLoading, signOut, tokenBalance, refreshTokenBalance } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  // Check admin status when user changes
  React.useEffect(() => {
    if (user) {
      isAdmin().then((adminStatus) => {
        console.log('Admin status for', user.email, ':', adminStatus);
        setUserIsAdmin(adminStatus);
      }).catch((error) => {
        console.error('Error checking admin status:', error);
        setUserIsAdmin(false);
      });
    } else {
      setUserIsAdmin(false);
    }
  }, [user]);

  // Close settings dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettings && !(event.target as Element).closest('.settings-container')) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettings]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // split base64 prefix: "data:image/jpeg;base64,"
      const [prefix, data] = result.split(',');
      const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
      
      setOriginalImage({
        data,
        mimeType,
        preview: result
      });
      setError(null);
      setStep(AppStep.DESCRIBE);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt.trim()) return;

    // Check if user has enough tokens
    if (tokenBalance < TOKEN_COST_PER_GENERATION) {
      setError(`Insufficient tokens! You need ${TOKEN_COST_PER_GENERATION} tokens to generate an image, but you only have ${tokenBalance} tokens.`);
      return;
    }

    setIsLoading(true);
    setStep(AppStep.PROCESSING);
    setError(null);

    try {
      const result = await generateFix(originalImage, prompt);
      setResultImage(result.image);
      // Update token balance after successful generation
      await refreshTokenBalance();
      setStep(AppStep.RESULT);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to generate image. Please try again.";
      setError(errorMessage);
      setStep(AppStep.DESCRIBE);
      // Refresh token balance in case of error (to sync state)
      await refreshTokenBalance();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(AppStep.UPLOAD);
    setOriginalImage(null);
    setResultImage(null);
    setPrompt('');
    setError(null);
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'fixit-result.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    handleReset();
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Sparkles size={20} />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">FixIt AI</span>
            </div>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-3">Welcome to FixIt AI</h1>
              <p className="text-slate-500">Sign in to start visualizing construction repairs and room cleanups.</p>
            </div>
            <AuthForm />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 relative">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between relative">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">FixIt AI</span>
          </div>
          <div className="flex items-center space-x-3 settings-container">
            {/* Token Balance */}
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
              <Coins size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">{tokenBalance}</span>
              <span className="text-xs text-blue-500 hidden sm:inline">tokens</span>
            </div>
            {/* Buy Tokens Button */}
            <Button
              variant="secondary"
              onClick={() => setShowTokenPurchase(true)}
              icon={<ShoppingCart size={16} />}
              className="hidden sm:flex"
            >
              Buy Tokens
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowTokenPurchase(true)}
              icon={<ShoppingCart size={16} />}
              className="sm:hidden"
            >
              Buy
            </Button>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <User size={16} />
              <span className="hidden sm:inline">{user.email}</span>
            </div>
            {/* Settings Button */}
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              icon={<Settings size={16} />}
              className="hidden sm:flex"
            >
              Settings
            </Button>
            {/* Admin Button (only for admins) */}
            {userIsAdmin && (
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSettings(false);
                  setShowAdminPage(true);
                }}
                icon={<Shield size={16} />}
                className="hidden sm:flex"
              >
                Admin
              </Button>
            )}
          </div>
          
          {/* Settings Dropdown */}
          {showSettings && (
            <div className="absolute top-full right-4 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 p-2 min-w-[200px] z-50">
              {userIsAdmin && (
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowAdminPage(true);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 flex items-center space-x-2 text-slate-700"
                >
                  <Shield size={16} />
                  <span>Admin Panel</span>
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 flex items-center space-x-2 text-red-600"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 w-full max-w-4xl mx-auto">
        
        {/* Error Notification */}
        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 animate-pulse">
            <AlertTriangle className="mr-3 flex-shrink-0" size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-full">
              <X size={16} />
            </button>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === AppStep.UPLOAD && (
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-3">What needs fixing?</h1>
              <p className="text-slate-500">Take a photo of a construction issue or a messy room to visualize the result.</p>
            </div>

            <div className="space-y-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                className="hidden" 
              />
              
              {/* Camera Button (Mobile Optimized) */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl p-8 flex flex-col items-center transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-1"
              >
                <div className="bg-white/20 p-4 rounded-full mb-4">
                  <Camera size={48} />
                </div>
                <span className="text-xl font-semibold">Take a Photo</span>
                <span className="text-blue-200 text-sm mt-1">or select from library</span>
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Basic File Input Trigger as secondary option */}
               <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white border-2 border-dashed border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors"
               >
                 <Upload size={32} className="mb-2 opacity-50" />
                 <span className="font-medium">Upload Image File</span>
               </div>
            </div>
          </div>
        )}

        {/* STEP 2: DESCRIBE */}
        {step === AppStep.DESCRIBE && originalImage && (
          <div className="w-full max-w-2xl animate-fade-in">
             <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                  {/* Image Preview */}
                  <div className="space-y-4">
                     <h2 className="font-semibold text-slate-800 flex items-center">
                        <Camera size={18} className="mr-2 text-blue-500"/> 
                        Selected Image
                     </h2>
                     <div className="aspect-square w-full relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img 
                          src={originalImage.preview} 
                          alt="Issue" 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                     </div>
                     <button 
                       onClick={handleReset} 
                       className="text-sm text-slate-500 hover:text-red-500 flex items-center justify-center w-full py-2"
                     >
                       <RotateCcw size={14} className="mr-1.5" /> Retake Photo
                     </button>
                  </div>

                  {/* Input Form */}
                  <div className="flex flex-col h-full">
                    <h2 className="font-semibold text-slate-800 mb-4 flex items-center">
                      <Sparkles size={18} className="mr-2 text-blue-500"/>
                      Describe the Goal
                    </h2>
                    
                    <div className="flex-grow">
                      <label htmlFor="prompt" className="block text-sm font-medium text-slate-500 mb-2">
                        What should be done?
                      </label>
                      <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Repair the cracked drywall... OR Clean up this room, organize the tools, and sweep the floor."
                        className="w-full h-40 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all text-slate-800"
                        autoFocus
                      />
                      <p className="text-xs text-slate-400 mt-2 text-right">
                        Be specific for best results.
                      </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                      {/* Token Cost Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-slate-600">
                          <Coins size={14} />
                          <span>Cost: <span className="font-semibold">{TOKEN_COST_PER_GENERATION} tokens</span></span>
                        </div>
                        <div className={`font-semibold ${tokenBalance >= TOKEN_COST_PER_GENERATION ? 'text-green-600' : 'text-red-600'}`}>
                          Balance: {tokenBalance}
                        </div>
                      </div>
                      {tokenBalance < TOKEN_COST_PER_GENERATION && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          <AlertTriangle size={14} className="inline mr-2" />
                          Insufficient tokens. You need {TOKEN_COST_PER_GENERATION} tokens to generate an image.
                        </div>
                      )}
                      <Button 
                        onClick={handleGenerate} 
                        disabled={!prompt.trim() || tokenBalance < TOKEN_COST_PER_GENERATION} 
                        fullWidth
                        icon={<ArrowRight size={20} />}
                      >
                        Generate Preview
                      </Button>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* STEP 3: PROCESSING */}
        {step === AppStep.PROCESSING && (
          <div className="text-center animate-pulse">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto text-slate-300" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Enhancing Space...</h2>
            <p className="text-slate-500 max-w-sm mx-auto">
              Our AI is applying your changes while maintaining the structural integrity of the scene.
            </p>
          </div>
        )}

        {/* STEP 4: RESULT */}
        {step === AppStep.RESULT && originalImage && resultImage && (
          <div className="w-full max-w-4xl animate-fade-in">
             <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                   <h2 className="text-2xl font-bold text-slate-800">Result</h2>
                   <p className="text-slate-500 text-sm mt-1">Drag the slider to compare your fix.</p>
                </div>
                <div className="flex space-x-2">
                   <Button variant="secondary" onClick={handleDownload} icon={<Download size={16} />}>
                    Download
                  </Button>
                  <Button variant="outline" onClick={handleReset} icon={<RotateCcw size={16} />}>
                    Start Over
                  </Button>
                </div>
             </div>
             <BeforeAfterSlider beforeImage={originalImage.preview} afterImage={resultImage} />
             <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl">
                <p className="text-sm font-medium text-slate-800">Your Request:</p>
                <p className="text-slate-600 text-sm italic">"{prompt}"</p>
             </div>
          </div>
        )}
      </main>
      
      {/* Auth Form Modal */}
      {showAuthForm && <AuthForm onClose={() => setShowAuthForm(false)} />}
      
      {/* Token Purchase Modal */}
      {showTokenPurchase && (
        <TokenPurchase 
          onClose={() => setShowTokenPurchase(false)}
          onShowToast={showToast}
        />
      )}

      {/* Admin Page */}
      {showAdminPage && (
        <AdminPage onClose={() => setShowAdminPage(false)} />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={1000}
        />
      )}
    </div>
  );
};

export default App;
