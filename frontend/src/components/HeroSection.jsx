import { ArrowRightIcon } from '@heroicons/react/24/solid';

const HeroSection = () => (
  <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-100 rounded-3xl shadow-lg p-8 mb-8 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in">
    {/* Left: Headline and Actions */}
    <div className="flex-1 z-10">
      <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 text-neutral-900">
        Manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-500">Savings</span> & <span className="text-green-600">Finances</span> <br className="hidden md:block" /> more efficiently
      </h1>
      <p className="text-lg text-neutral-600 mb-6 max-w-xl">
        We are here to help you with the best financial solution & manage your expenses with bonuses.
      </p>
      <div className="flex flex-wrap gap-4">
        <button className="btn btn-primary flex items-center gap-2 text-lg px-6 py-3 shadow-md">
          Get Started <ArrowRightIcon className="w-5 h-5" />
        </button>
        <button className="btn btn-secondary flex items-center gap-2 text-lg px-6 py-3">
          Download App <span className="ml-1">⬇️</span>
        </button>
      </div>
    </div>
    {/* Right: Illustration (placeholder) */}
    <div className="flex-1 flex items-center justify-center z-10">
      <div className="w-72 h-72 md:w-96 md:h-96 bg-gradient-to-tr from-primary-100 via-primary-200 to-primary-50 rounded-full flex items-center justify-center shadow-xl relative">
        {/* Replace below with your own SVG/illustration if desired */}
        <div className="w-56 h-56 bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center">
          <span className="text-5xl">💳</span>
          <span className="text-lg font-semibold text-primary-700 mt-4">Fintech UI</span>
          <span className="text-xs text-neutral-400 mt-1">Modern & Responsive</span>
        </div>
      </div>
    </div>
    {/* Decorative gradient blur */}
    <div className="absolute -top-10 -right-10 w-72 h-72 bg-primary-200 rounded-full blur-3xl opacity-30 z-0" />
  </section>
);

export default HeroSection; 