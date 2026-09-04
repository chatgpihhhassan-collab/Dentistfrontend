import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.group('%c[ErrorBoundary] Component Crash Caught!', 'background: #EF4444; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F8FC] flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-rose-200 shadow-xl p-8 space-y-5">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                  Runtime Exception Caught
                </span>
                <h2 className="text-lg font-black text-[#10244B] leading-tight mt-0.5">
                  An Unexpected Issue Occurred
                </h2>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-black text-rose-800 font-mono break-words">
                {this.state.error?.toString() || 'Unknown Error'}
              </p>
              {this.state.errorInfo?.componentStack && (
                <details className="text-[10px] text-slate-600 font-mono mt-2 cursor-pointer">
                  <summary className="font-bold text-rose-700 hover:underline">View Component Stack Trace</summary>
                  <pre className="mt-2 p-2 bg-white/80 rounded-xl overflow-x-auto max-h-40 text-[9.5px] border border-rose-100">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-black py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
