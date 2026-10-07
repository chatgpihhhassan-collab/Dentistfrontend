import pefile
import sys
import json

def get_exports(dll_path):
    try:
        pe = pefile.PE(dll_path)
        exports = []
        if hasattr(pe, 'DIRECTORY_ENTRY_EXPORT'):
            for exp in pe.DIRECTORY_ENTRY_EXPORT.symbols:
                if exp.name:
                    exports.append(exp.name.decode('utf-8'))
        return exports
    except Exception as e:
        return [f"Error: {e}"]

dlls = [
    r"D:\dentistfrontend\Dentistfrontend\drivers\eighteeth_engine\IOSensorAcquisition.dll",
    r"D:\dentistfrontend\Dentistfrontend\drivers\eighteeth_engine\sensor_io.dll",
    r"D:\dentistfrontend\Dentistfrontend\drivers\eighteeth_engine\ConnUSBfifo.dll"
]

results = {}
for dll in dlls:
    results[dll] = get_exports(dll)

print(json.dumps(results, indent=2))
