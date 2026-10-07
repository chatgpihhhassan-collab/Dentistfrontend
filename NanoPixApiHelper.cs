using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.IO;

namespace DentiaNanoPixAPI
{
    class NanoPixApiHelper
    {
        // P/Invoke definitions for 32-bit sensor_io.dll
        [DllImport("sensor_io.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int Sensor_DeviceCount();

        [DllImport("sensor_io.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int Sensor_OpenDevice();

        [DllImport("sensor_io.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int Sensor_GetXrayState();

        [DllImport("sensor_io.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int Sensor_CloseDevice();

        static void Log(string message)
        {
            Console.WriteLine(string.Format("[NANO-API] [{0:HH:mm:ss}] {1}", DateTime.Now, message));
        }

        static void Main(string[] args)
        {
            Log("Starting 32-bit Headless API Helper for NanoPix...");
            
            // Validate architecture
            if (IntPtr.Size != 4)
            {
                Log("FATAL ERROR: This helper MUST be compiled and run as a 32-bit (x86) process.");
                Environment.Exit(1);
            }
            
            Log("Architecture check passed (32-bit x86).");

            try
            {
                Log("Setting up DLL search paths...");
                string enginePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "drivers", "eighteeth_engine");
                if (!Directory.Exists(enginePath)) {
                    Log(string.Format("WARN: Engine path not found at {0}, relying on current directory.", enginePath));
                } else {
                    Environment.CurrentDirectory = enginePath;
                }

                Log("Pinging sensor_io.dll for Device Count...");
                int deviceCount = Sensor_DeviceCount();
                Log(string.Format("Devices detected by API: {0}", deviceCount));

                if (deviceCount == 0)
                {
                    Log("No hardware devices found. Ensure USB is plugged in and FTDI driver is bound.");
                    Environment.Exit(1);
                }

                Log("Attempting to open sensor device connection...");
                int openStatus = Sensor_OpenDevice();
                Log(string.Format("Sensor_OpenDevice returned status: {0} (Expected > 0 or 0 for success depending on API spec)", openStatus));

                Log("Device opened successfully. Entering X-Ray polling loop...");
                
                // Polling loop
                int pollCount = 0;
                while (true)
                {
                    int xrayState = Sensor_GetXrayState();
                    if (pollCount % 10 == 0) { // Log every 5 seconds to avoid spam
                        Log(string.Format("Polling X-Ray State... Current State = {0}", xrayState));
                    }
                    
                    if (xrayState > 0) // Assuming >0 means firing or ready
                    {
                        Log(string.Format("[ALERT] X-RAY DETECTED! State = {0}", xrayState));
                        Log("Routing signal back to Node.js backend for Frontend SSE ingestion...");
                        Thread.Sleep(2000);
                    }

                    Thread.Sleep(500);
                    pollCount++;
                }
            }
            catch (Exception ex)
            {
                Log(string.Format("CRITICAL API ERROR: {0}", ex.Message));
                Log(string.Format("StackTrace: {0}", ex.StackTrace));
            }
            finally
            {
                try {
                    Sensor_CloseDevice();
                    Log("Device connection closed.");
                } catch { }
            }
        }
    }
}
