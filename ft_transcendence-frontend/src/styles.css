@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }
  
  body {
    @apply font-sans bg-slate-900 text-slate-100 min-h-screen;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 100%);
    background-attachment: fixed;
    line-height: 1.6;
  }
}

@layer components {
  
  .btn {
    @apply bg-slate-800 border border-slate-600 text-slate-100 font-medium py-2 px-4 sm:py-3 sm:px-6 
           rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 
           focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50
           shadow-md hover:shadow-lg text-sm sm:text-base;
  }
  
  .btn-secondary {
    @apply bg-transparent border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-slate-100;
  }
  
  .btn-danger {
    @apply bg-rose-600 border-rose-600 text-white hover:bg-rose-700 hover:border-rose-700;
  }
  
  .btn-success {
    @apply bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700;
  }
  
  .card {
    @apply bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 
           shadow-lg hover:shadow-xl hover:border-slate-600 
           transition-all duration-200 hover:-translate-y-1;
    backdrop-filter: blur(16px);
  }
  
  .stat-card {
    @apply bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 text-center 
           shadow-md hover:shadow-lg hover:border-slate-600
           transition-all duration-200 hover:-translate-y-1;
    backdrop-filter: blur(16px);
  }
  
  .glass-effect {
    @apply bg-slate-800/95 backdrop-blur-md;
  }
  
  .nav-link {
    @apply text-slate-300 font-medium px-2 py-1 sm:px-4 sm:py-2 rounded-xl
           transition-all duration-200 hover:bg-slate-700 hover:text-slate-100 text-sm sm:text-base;
  }
  
  .nav-link.active {
    @apply bg-violet-600 text-white;
  }
  
  .profile-tab {
    @apply px-4 py-2 bg-slate-800 text-slate-300 font-medium border border-slate-700 rounded-xl
           hover:bg-slate-700 hover:text-slate-100 transition-all duration-200 cursor-pointer;
  }
  
  .profile-tab.active {
    @apply bg-violet-600 text-white border-violet-600;
  }
  
  .tab-panel {
    @apply hidden;
  }
  
  .tab-panel.active {
    @apply block animate-fade-in;
  }
  
  .input {
    @apply px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl 
           text-slate-100 placeholder-slate-500
           focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 
           hover:border-slate-600 transition-all duration-200;
  }
  
  .input:disabled {
    @apply opacity-50 cursor-not-allowed;
  }
  
  select.input,
  select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    cursor: pointer;
    padding-right: 2.5rem;
  }
  
  select.input {
    background-color: #0f172a;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23cbd5e1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1.25em 1.25em;
  }
  
  textarea.input {
    @apply min-h-[100px] resize-y;
  }
  
  .data-table {
    @apply w-full text-slate-100;
  }
  
  .data-table th {
    @apply py-3 px-4 text-left font-semibold border-b border-slate-700 bg-slate-800 text-slate-300;
  }
  
  .data-table td {
    @apply py-3 px-4 border-b border-slate-700;
  }
  
  .data-table tr:hover {
    @apply bg-slate-800;
  }
  
  .podium-card {
    @apply p-4 sm:p-6 rounded-xl text-center transform hover:scale-105 transition-all duration-300;
  }
  
  .error-message {
    @apply bg-rose-900 bg-opacity-50 border-l-4 border-rose-500 text-rose-200 
           rounded-r-xl p-4 mb-4;
  }
  
  .loading-spinner {
    @apply w-10 h-10 border-4 border-slate-600 border-l-violet-500 rounded-full animate-spin;
  }
}

@layer utilities {
  .text-shadow {
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .text-shadow-lg {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
}

@keyframes rainbow-gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.rainbow-text {
  background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #0abde3, #00d2d3, 
              #5f27cd, #ff9ff3, #54a0ff, #2ed573, #ffa502, #ff3742);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbow-gradient 3s ease-in-out infinite;
}

.rainbow-text:hover {
  animation-duration: 1s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  @apply bg-slate-800 rounded-lg;
}

::-webkit-scrollbar-thumb {
  @apply bg-slate-600 rounded-lg;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-500;
}

::selection {
  @apply bg-violet-500 bg-opacity-30 text-slate-100;
}

*:focus {
  outline: none;
}

@media (max-width: 768px) {
  .btn {
    @apply py-2 px-4 text-sm;
  }
  
  .card {
    @apply p-4;
  }
  
  .input {
    @apply py-2 px-3 text-sm;
  }
}

#dashboard-panel .stat-card {
  animation: dashFadeUp 0.5s ease-out both;
}

#dashboard-panel .stat-card:nth-child(1) { animation-delay: 0s; }
#dashboard-panel .stat-card:nth-child(2) { animation-delay: 0.05s; }
#dashboard-panel .stat-card:nth-child(3) { animation-delay: 0.1s; }
#dashboard-panel .stat-card:nth-child(4) { animation-delay: 0.15s; }

@keyframes dashFadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

#dash-results-timeline .group > div:first-child {
  animation: dashPop 0.3s ease-out both;
}

#dash-results-timeline .group:nth-child(1) > div:first-child  { animation-delay: 0s; }
#dash-results-timeline .group:nth-child(2) > div:first-child  { animation-delay: 0.03s; }
#dash-results-timeline .group:nth-child(3) > div:first-child  { animation-delay: 0.06s; }
#dash-results-timeline .group:nth-child(4) > div:first-child  { animation-delay: 0.09s; }
#dash-results-timeline .group:nth-child(5) > div:first-child  { animation-delay: 0.12s; }
#dash-results-timeline .group:nth-child(6) > div:first-child  { animation-delay: 0.15s; }
#dash-results-timeline .group:nth-child(7) > div:first-child  { animation-delay: 0.18s; }
#dash-results-timeline .group:nth-child(8) > div:first-child  { animation-delay: 0.21s; }
#dash-results-timeline .group:nth-child(9) > div:first-child  { animation-delay: 0.24s; }
#dash-results-timeline .group:nth-child(10) > div:first-child { animation-delay: 0.27s; }

@keyframes dashPop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
