import React, { useState } from 'react';
import { Download, Terminal, Usb, CheckCircle2, AlertCircle, ChevronRight, MonitorPlay, Activity } from 'lucide-react';

export default function NanoPixSetupGuide() {
  const [activeStep, setActiveStep] = useState(1);
  const [osType, setOsType] = useState('win10_11');

  const steps = [
    {
      id: 1,
      title: "Download Bridge & Drivers",
      icon: <Download className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            To connect your Eighteeth Nano-Pix sensor to the web application, you need to run the Dentia Hardware Bridge on your local PC and ensure the FTDI USB drivers are installed.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Bridge Download */}
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl">
              <h4 className="font-bold text-blue-900 mb-2">1. Dentia Hardware Bridge</h4>
              <p className="text-xs text-blue-700 mb-4">
                The local service that connects your X-ray sensor to this web interface.
              </p>
              <a 
                href="/Dentia_Web_Installer.bat" 
                download
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" /> Download Bridge
              </a>
            </div>

            {/* FTDI Driver Download */}
            <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl">
              <h4 className="font-bold text-emerald-900 mb-2">2. FTDI USB Drivers</h4>
              <p className="text-xs text-emerald-700 mb-4">
                Required for Windows to recognize the Eighteeth Nano-Pix USB sensor.
              </p>
              <a 
                href="https://ftdichip.com/wp-content/uploads/2023/09/CDM-v2.12.36.4-WHQL-Certified.zip" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" /> Download D2XX Driver
              </a>
              <p className="text-[10px] text-emerald-600 mt-2 text-center">
                Official FTDI Windows D2XX Driver
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Install the Driver",
      icon: <Usb className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            If your sensor is showing as "Unknown Device" or the bridge cannot connect to USB, install the FTDI driver. 
            Instructions vary slightly based on your version of Windows.
          </p>
          
          <div className="flex items-center gap-2 mb-4 bg-slate-100 p-1.5 rounded-lg w-max">
            <button 
              onClick={() => setOsType('win10_11')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${osType === 'win10_11' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Windows 10 / 11
            </button>
            <button 
              onClick={() => setOsType('win7')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${osType === 'win7' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Windows 7
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            {osType === 'win10_11' ? (
              <ol className="list-decimal pl-4 space-y-2 text-sm text-slate-700">
                <li>Extract the downloaded <strong>FTDI Driver zip</strong> file.</li>
                <li>Plug your Nano-Pix sensor into a USB port on your PC.</li>
                <li>Right-click the <strong>Start Button</strong> (Windows icon) and select <strong>Device Manager</strong>.</li>
                <li>Find the sensor under <em>"Other devices"</em> or <em>"Universal Serial Bus controllers"</em> (often named <strong>USB Serial Converter</strong> or has a yellow warning icon).</li>
                <li>Right-click it and select <strong>Update driver</strong>.</li>
                <li>Choose <strong>Browse my computer for drivers</strong>.</li>
                <li>Click <strong>Browse</strong>, select the extracted FTDI folder, ensure "Include subfolders" is checked, and click Next to install.</li>
                <li>You should see a message: <em>"Windows has successfully updated your drivers."</em></li>
              </ol>
            ) : (
              <ol className="list-decimal pl-4 space-y-2 text-sm text-slate-700">
                <li>Extract the downloaded <strong>FTDI Driver zip</strong> file to your Desktop.</li>
                <li>Plug your Nano-Pix sensor into a USB port. Windows 7 may show a "Device driver software was not successfully installed" popup.</li>
                <li>Click the <strong>Start Menu</strong>, right-click on <strong>Computer</strong>, and select <strong>Manage</strong>.</li>
                <li>In the left pane, click on <strong>Device Manager</strong>.</li>
                <li>Look for <strong>USB Serial Converter</strong> or an <em>Unknown Device</em> with a yellow exclamation mark under "Other devices".</li>
                <li>Right-click the device and select <strong>Update Driver Software...</strong></li>
                <li>Choose <strong>Browse my computer for driver software</strong>.</li>
                <li>Click <strong>Browse</strong>, find the extracted FTDI folder on your Desktop, make sure "Include subfolders" is checked, and click Next.</li>
                <li>If a Windows Security dialog appears asking to install the device software, click <strong>Install</strong>.</li>
              </ol>
            )}

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <strong>Important Note:</strong>
                <p className="mt-1">Ensure you download the <strong>D2XX</strong> driver from Step 1, not just the standard VCP (Virtual COM Port) driver. The D2XX driver provides the direct hardware access required by the sensor bridge.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Run the Bridge",
      icon: <Terminal className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            The bridge must be running on the Doctor's PC for the web app to receive X-Rays.
          </p>
          <div className="bg-slate-900 rounded-xl p-5 text-slate-300 text-sm font-mono space-y-4">
            <div>
              <p className="text-slate-500 mb-1">// Method 1: Auto-Start (Recommended)</p>
              <p className="text-emerald-400">Double-click: <span className="text-white">INSTALL_AUTO_STARTUP_SERVICE.bat</span></p>
              <p className="text-xs mt-1">This configures the bridge to automatically run in the background every time the PC turns on.</p>
            </div>
            <div className="border-t border-slate-800 pt-3">
              <p className="text-slate-500 mb-1">// Method 2: Manual Start</p>
              <p className="text-blue-400">Double-click: <span className="text-white">START_NANOPIX_AUTO_SYNC.bat</span></p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Verify Connection",
      icon: <MonitorPlay className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Check the status of your hardware connection directly from the clinical chart.
          </p>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col items-center text-center">
              <Activity className="w-8 h-8 text-emerald-500 mb-2" />
              <h4 className="font-bold text-emerald-900 text-sm">Bridge Active</h4>
              <p className="text-xs text-emerald-700 mt-1">Web app is communicating with local port 5066.</p>
            </div>
            
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col items-center text-center">
              <Usb className="w-8 h-8 text-emerald-500 mb-2" />
              <h4 className="font-bold text-emerald-900 text-sm">USB Connected</h4>
              <p className="text-xs text-emerald-700 mt-1">Sensor is plugged in and drivers are functioning.</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
            <p className="text-sm text-slate-700">
              When inside a patient's chart, look for the hardware badge in the top corner. Clicking it will display a live diagnostics panel to confirm everything is operational.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Hardware Setup Guide</h1>
          <p className="text-slate-500 mt-2">Complete configuration guide for the Eighteeth Nano-Pix digital sensor bridge.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white border border-slate-200 rounded-2xl p-2 sticky top-8">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    activeStep === step.id 
                      ? 'bg-blue-50 text-blue-700 font-bold' 
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <div className={`${activeStep === step.id ? 'text-blue-600' : 'text-slate-400'}`}>
                    {step.icon}
                  </div>
                  <span className="flex-1 text-sm">{step.title}</span>
                  {activeStep === step.id && <ChevronRight className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 min-h-[400px] flex flex-col">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                  {steps[activeStep - 1].id}
                </div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {steps[activeStep - 1].title}
                </h2>
              </div>
              
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1">
                {steps[activeStep - 1].content}
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                disabled={activeStep === 1}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Previous
              </button>
              
              <button
                onClick={() => setActiveStep(prev => Math.min(steps.length, prev + 1))}
                disabled={activeStep === steps.length}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 border border-blue-600 text-white hover:bg-blue-700"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
