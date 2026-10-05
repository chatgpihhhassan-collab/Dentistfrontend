const koffi = require('koffi');
const path = require('path');

try {
  const ftdiLib = koffi.load('C:\\Windows\\System32\\ftd2xx.dll');

  // FT_CreateDeviceInfoList
  const FT_CreateDeviceInfoList = ftdiLib.func('uint32 FT_CreateDeviceInfoList(_Out_ uint32* lpdwNumDevs)');
  // FT_GetDeviceInfoDetail
  const FT_GetDeviceInfoDetail = ftdiLib.func('uint32 FT_GetDeviceInfoDetail(uint32 dwIndex, _Out_ uint32* lpdwFlags, _Out_ uint32* lpdwType, _Out_ uint32* lpdwID, _Out_ uint32* lpdwLocId, _Out_ char* pcSerialNumber, _Out_ char* pcDescription, _Out_ void** ftHandle)');

  const numDevsBuf = [0];
  const status = FT_CreateDeviceInfoList(numDevsBuf);
  const numDevs = numDevsBuf[0];

  console.log(`[FTDI D2XX DRIVER] FT_CreateDeviceInfoList Status: ${status}, Number of Connected FTDI Devices: ${numDevs}`);

  for (let i = 0; i < numDevs; i++) {
    const flags = [0];
    const type = [0];
    const id = [0];
    const locId = [0];
    const serial = Buffer.alloc(64);
    const desc = Buffer.alloc(64);
    const handle = [null];

    const detailStatus = FT_GetDeviceInfoDetail(i, flags, type, id, locId, serial, desc, handle);
    const serialStr = serial.toString('utf8').replace(/\0/g, '');
    const descStr = desc.toString('utf8').replace(/\0/g, '');
    const idHex = '0x' + (id[0] || 0).toString(16).toUpperCase();

    console.log(` -> Device #${i}: [${descStr}] | Serial: [${serialStr}] | USB ID: [${idHex}] | Flags: ${flags[0]}`);
  }
} catch (err) {
  console.error('[FTDI TEST ERROR]:', err.message);
}
