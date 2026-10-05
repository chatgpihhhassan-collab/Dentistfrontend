const koffi = require('koffi');

try {
  const ftdiLib = koffi.load('C:\\Windows\\System32\\ftd2xx.dll');

  const FT_Open = ftdiLib.func('uint32 FT_Open(uint32 dwDevice, _Out_ void** ftHandle)');
  const FT_GetQueueStatus = ftdiLib.func('uint32 FT_GetQueueStatus(void* ftHandle, _Out_ uint32* lpdwAmountInRxQueue)');
  const FT_GetStatus = ftdiLib.func('uint32 FT_GetStatus(void* ftHandle, _Out_ uint32* lpdwAmountInRxQueue, _Out_ uint32* lpdwAmountInTxQueue, _Out_ uint32* lpdwEventStatus)');
  const FT_Close = ftdiLib.func('uint32 FT_Close(void* ftHandle)');

  const handleBuf = [null];
  const openStatus = FT_Open(0, handleBuf);
  const handle = handleBuf[0];

  console.log(`[FTDI DIRECT OPEN] Status: ${openStatus}, Handle: ${handle ? 'VALID' : 'NULL'}`);

  if (openStatus === 0 && handle) {
    const rxBuf = [0];
    const txBuf = [0];
    const eventBuf = [0];
    const qStatus = FT_GetStatus(handle, rxBuf, txBuf, eventBuf);

    console.log(`[FTDI DIRECT STATUS] RX Queue Bytes: ${rxBuf[0]}, TX Queue Bytes: ${txBuf[0]}, Event Status: ${eventBuf[0]}`);

    FT_Close(handle);
    console.log(`[FTDI DIRECT CLOSE] Device released cleanly.`);
  }
} catch (err) {
  console.error('[FTDI TEST ERROR]:', err.message);
}
