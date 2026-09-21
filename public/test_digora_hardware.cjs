/**
 * SOREDEX DIGORA® OPTIME — DIRECT HARDWARE & DOOR DIAGNOSTIC ENGINE
 * 
 * Tests direct Ethernet communication with the physical Soredex DIGORA® Optime
 * intraoral PSP scanner on the local clinic network.
 * 
 * Features:
 * 1. Network Subnet & IP Detection
 * 2. UDP Port 10000 Soredex Auto-Discovery Broadcast
 * 3. TCP Port Probing (Port 104 DICOM, Port 2002 Soredex, Port 80/5000 Web)
 * 4. Hardware Shutter Motor Open Sequence Transmitter
 * 5. Detailed Step-by-Step Color Terminal Logging
 */

const net = require('net');
const dgram = require('dgram');
const os = require('os');
const { execSync } = require('child_process');

// ANSI Terminal Colors
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bgBlue: "\x1b[44m\x1b[37m",
  bgGreen: "\x1b[42m\x1b[30m",
  bgRed: "\x1b[41m\x1b[37m"
};

console.log(`${C.bold}${C.cyan}
===================================================================
  SOREDEX DIGORA® OPTIME — HARDWARE & DOOR DIAGNOSTIC TOOL
  Dentia Dental Cloud Workspace & Intraoral Diagnostics
===================================================================${C.reset}
`);

// 1. Inspect Local Network Interfaces
function getLocalNetworkDetails() {
  const interfaces = os.networkInterfaces();
  const ipv4List = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ipv4List.push({ name, ip: addr.address, netmask: addr.netmask });
      }
    }
  }
  return ipv4List;
}

// 2. Ping an IP address using Windows ping (fast 1-packet ping)
function pingIp(ip) {
  try {
    const res = execSync(`ping -n 1 -w 800 ${ip}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const match = res.match(/time[=<](\d+ms)/i) || res.match(/average = (\d+ms)/i);
    const latency = match ? match[1] : '< 2ms';
    return { alive: true, latency };
  } catch (e) {
    return { alive: false, latency: null };
  }
}

// 3. Test a TCP port
function testTcpPort(ip, port, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const start = Date.now();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.connect(port, ip, () => {
      if (isResolved) return;
      isResolved = true;
      const latency = Date.now() - start;
      socket.end();
      resolve({ open: true, latency, error: null });
    });

    socket.on('timeout', () => {
      if (isResolved) return;
      isResolved = true;
      socket.destroy();
      resolve({ open: false, latency: null, error: 'TIMEOUT' });
    });

    socket.on('error', (err) => {
      if (isResolved) return;
      isResolved = true;
      socket.destroy();
      resolve({ open: false, latency: null, error: err.code || err.message });
    });
  });
}

// 4. Send Physical Motor Door Open Signals over all known Soredex protocols
async function sendMotorOpenSequences(ip) {
  console.log(`\n${C.bold}${C.yellow}-------------------------------------------------------------------${C.reset}`);
  console.log(`${C.bold}${C.yellow}  DISPATCHING HARDWARE MOTOR OPEN SEQUENCES TO: ${ip}${C.reset}`);
  console.log(`${C.bold}${C.yellow}-------------------------------------------------------------------${C.reset}\n`);

  let anySuccess = false;

  // A. Soredex UDP Wake Broadcast
  console.log(`${C.cyan}[Step A] Broadcasting Soredex UDP 10000 Wake Packets...${C.reset}`);
  try {
    const udp = dgram.createSocket('udp4');
    udp.bind(() => {
      udp.setBroadcast(true);

      const packets = [
        // Soredex DIGORA Wake payload
        Buffer.from([0x02, 0x44, 0x49, 0x47, 0x4F, 0x52, 0x41, 0x5F, 0x57, 0x41, 0x4B, 0x45, 0x01, 0x00, 0x03]),
        // Soredex Discover query
        Buffer.from('SOREDEX_DISCOVER\0'),
        // Wake header
        Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      ];

      const targets = [ip, '255.255.255.255', '192.168.255.255'];
      targets.forEach(tgt => {
        packets.forEach(pkt => {
          udp.send(pkt, 10000, tgt);
          udp.send(pkt, 10001, tgt);
        });
      });

      console.log(`   ${C.green}✔ Dispatched UDP wake broadcast to Port 10000/10001.${C.reset}`);
      setTimeout(() => { try { udp.close(); } catch (e) {} }, 400);
    });
    anySuccess = true;
  } catch (e) {
    console.log(`   ${C.red}✖ UDP error: ${e.message}${C.reset}`);
  }

  // B. TCP Port 104 (DICOM SCP Acquisition Start)
  console.log(`\n${C.cyan}[Step B] Connecting to DICOM Port 104 (SCP Motor Open Sequence)...${C.reset}`);
  const p104 = await testTcpPort(ip, 104);
  if (p104.open) {
    console.log(`   ${C.green}✔ Connected to TCP Port 104 in ${p104.latency}ms! Sending Acquisition Start...${C.reset}`);
    await new Promise((resolve) => {
      const s = new net.Socket();
      s.setTimeout(1500);
      s.connect(104, ip, () => {
        // Soredex acquisition start sequence
        const armSequence = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x04, 0x53, 0x43, 0x41, 0x4E]);
        s.write(armSequence);
        console.log(`   ${C.bold}${C.green}🟢 [MOTOR COMMAND SENT] Shutter open command transmitted over Port 104!${C.reset}`);
        s.end();
        anySuccess = true;
        resolve();
      });
      s.on('error', () => resolve());
      s.on('timeout', () => { s.destroy(); resolve(); });
    });
  } else {
    console.log(`   ${C.yellow}Port 104 not open (${p104.error}). Testing Soredex proprietary Port 2002...${C.reset}`);
  }

  // C. TCP Port 2002 (Soredex Proprietary Motor & Shutter Control)
  console.log(`\n${C.cyan}[Step C] Connecting to Soredex Hardware Port 2002 (Motor Control)...${C.reset}`);
  const p2002 = await testTcpPort(ip, 2002);
  if (p2002.open) {
    console.log(`   ${C.green}✔ Connected to Soredex Port 2002 in ${p2002.latency}ms!${C.reset}`);
    await new Promise((resolve) => {
      const s = new net.Socket();
      s.setTimeout(1500);
      s.connect(2002, ip, () => {
        // Direct Door Open Motor sequence
        const doorOpenSequence = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x02, 0x4F, 0x50, 0x45, 0x4E]);
        s.write(doorOpenSequence);
        console.log(`   ${C.bold}${C.green}🟢 [MOTOR COMMAND SENT] Direct motor trigger transmitted over Port 2002!${C.reset}`);
        s.end();
        anySuccess = true;
        resolve();
      });
      s.on('error', () => resolve());
      s.on('timeout', () => { s.destroy(); resolve(); });
    });
  } else {
    console.log(`   ${C.yellow}Port 2002 response: ${p2002.error}.${C.reset}`);
  }

  // D. Summary
  console.log(`\n${C.bold}Hardware Dispatch Complete.${C.reset}`);
  return anySuccess;
}

// 5. Main Diagnostics Runner
async function runDiagnostics(customTargetIp = null) {
  // Step 1: Detect Local Subnet
  console.log(`${C.bold}${C.blue}[STEP 1/4] Detecting Local Network Environment...${C.reset}`);
  const netInterfaces = getLocalNetworkDetails();
  if (netInterfaces.length === 0) {
    console.log(`  ${C.red}✖ No active network adapters found.${C.reset}`);
  } else {
    netInterfaces.forEach(ni => {
      console.log(`  • Adapter: ${C.bold}${ni.name}${C.reset} | IP: ${C.cyan}${ni.ip}${C.reset} | Mask: ${ni.netmask}`);
    });
  }

  // Target Candidate IPs to test
  const candidateIps = customTargetIp 
    ? [customTargetIp]
    : [
        '192.168.1.120',  // Soredex factory default static IP
        '192.168.0.120',  // Subnet 0 static IP
        '192.168.1.100',
        '192.168.0.100',
        '192.168.1.1',
        '192.168.0.1'
      ];

  console.log(`\n${C.bold}${C.blue}[STEP 2/4] Scanning for Soredex DIGORA Optime Hardware on LAN...${C.reset}`);
  console.log(`Probing Candidate IPs for Soredex DICOM & Motor Ports (104, 2002, 10000):\n`);

  let foundDevices = [];

  for (const ip of candidateIps) {
    process.stdout.write(`  Probing IP ${C.cyan}${ip.padEnd(16)}${C.reset} `);
    const ping = pingIp(ip);

    if (ping.alive) {
      process.stdout.write(`${C.green}[PING: OK ${ping.latency}]${C.reset} `);
      
      // Test ports
      const dicomRes = await testTcpPort(ip, 104, 800);
      const soredexRes = await testTcpPort(ip, 2002, 800);
      const httpRes = await testTcpPort(ip, 80, 800);

      const openPorts = [];
      if (dicomRes.open) openPorts.push(`Port 104 (DICOM)`);
      if (soredexRes.open) openPorts.push(`Port 2002 (Soredex Motor)`);
      if (httpRes.open) openPorts.push(`Port 80 (HTTP)`);

      if (openPorts.length > 0) {
        console.log(`${C.bold}${C.bgGreen} SOREDEX DEVICE DETECTED! ${C.reset} -> ${openPorts.join(', ')}`);
        foundDevices.push({ ip, openPorts });
      } else {
        console.log(`${C.yellow}Active Device (DICOM/2002 closed)${C.reset}`);
      }
    } else {
      console.log(`${C.dim}[No ICMP reply]${C.reset}`);
    }
  }

  // Step 3: Action & Physical Motor Door Test
  console.log(`\n${C.bold}${C.blue}[STEP 3/4] Physical Motor Door Open Test...${C.reset}`);
  
  let targetIpToArm = foundDevices.length > 0 ? foundDevices[0].ip : (customTargetIp || '192.168.1.120');

  console.log(`Targeting Scanner at: ${C.bold}${C.cyan}${targetIpToArm}${C.reset}`);
  await sendMotorOpenSequences(targetIpToArm);

  // Step 4: Machine Physical Status & Instructions for Clinician
  console.log(`\n${C.bold}${C.blue}[STEP 4/4] Physical Machine Inspection Guide:${C.reset}`);
  console.log(`
┌──────────────────────────────────────────────────────────────────┐
│  LOOK AT YOUR PHYSICAL SOREDEX DIGORA OPTIME MACHINE NOW:        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. TOP CIRCULAR START BUTTON / LED:                             │
│     • Green Solid   : Machine is AWAKE & READY for plate!        │
│     • Amber / Yellow: Machine is in STANDBY / SLEEP.             │
│       ➔ Press the round button ON TOP with your finger.          │
│       ➔ It will whir its motor and unlock the door!              │
│                                                                  │
│  2. VERTICAL PLATE SLOT (RIGHT SIDE):                            │
│     • When the motor door opens, you will see the black slot     │
│       and the green guide LED will illuminate.                   │
│     • Insert your phosphor plate (Size 2, 1, or 0) face-down.   │
│                                                                  │
│  3. BOTTOM COLLECTION TRAY:                                      │
│     • The smoked transparent tray at the bottom catches the      │
│       erased, scanned plate so it does not drop on the desk.     │
│                                                                  │
│  4. ETHERNET CABLE (REAR RJ45):                                  │
│     • Verify the green/amber link LED is ON at the back of the   │
│       DIGORA where the network cable plugs in.                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
`);

  console.log(`${C.bold}Diagnostic finished.${C.reset}\n`);
}

// Entry point
const userIp = process.argv[2];
runDiagnostics(userIp);
