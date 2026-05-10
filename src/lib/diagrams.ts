export interface DiagramEntry {
  id: string
  title: string
  description: string
  keywords: string[]
  svgPath: string
  category: string
}

export const DIAGRAMS: DiagramEntry[] = [
  {
    id: 'raw-water-cooling',
    title: 'Raw Water Cooling System',
    description: 'Complete raw water cooling flow from sea cock through strainer, impeller pump, heat exchanger, and exhaust elbow overboard.',
    keywords: ['raw water', 'cooling', 'impeller', 'heat exchanger', 'overheating', 'sea cock', 'strainer', 'raw water cooling', 'water pump', 'cooling system', 'overheat'],
    svgPath: '/diagrams/raw-water-cooling.svg',
    category: 'Cooling',
  },
  {
    id: 'freshwater-cooling',
    title: 'Freshwater / Closed Cooling System',
    description: 'Closed cooling loop with coolant pump, engine block, thermostat, heat exchanger (dual loop), and expansion tank.',
    keywords: ['freshwater cooling', 'closed cooling', 'coolant', 'thermostat', 'expansion tank', 'antifreeze', 'heat exchanger', 'coolant pump', 'temperature', 'closed loop'],
    svgPath: '/diagrams/freshwater-cooling.svg',
    category: 'Cooling',
  },
  {
    id: 'fuel-system-diesel',
    title: 'Diesel Fuel System',
    description: 'Complete diesel fuel circuit from tank through shutoff valve, primary filter/water separator, lift pump, secondary filter, injection pump, injectors and return line.',
    keywords: ['fuel', 'diesel', 'injector', 'injection pump', 'fuel filter', 'lift pump', 'water separator', 'racor', 'fuel system', 'fuel tank', 'bleeding fuel', 'air in fuel'],
    svgPath: '/diagrams/fuel-system-diesel.svg',
    category: 'Fuel',
  },
  {
    id: 'bilge-system',
    title: 'Bilge Pump System',
    description: 'Bilge pump plumbing and electrical: sump to float switch to pump through check valve to thru-hull. Manual switch wiring from battery.',
    keywords: ['bilge', 'bilge pump', 'float switch', 'check valve', 'thru-hull', 'bilge water', 'flooding', 'pump wiring', 'bilge system'],
    svgPath: '/diagrams/bilge-system.svg',
    category: 'Plumbing',
  },
  {
    id: 'battery-charging',
    title: 'Battery Charging System',
    description: 'Marine DC charging: alternator to battery isolator feeding house bank and start battery. Shore power charger connection with proper fusing.',
    keywords: ['battery', 'charging', 'alternator', 'battery isolator', 'house bank', 'start battery', 'shore power charger', 'battery charging', 'voltage', 'dc power', 'charge', 'wiring diagram', 'charging system', 'charging circuit', 'stator', 'rectifier', 'electrical diagram', 'dc wiring', 'charging wiring'],
    svgPath: '/diagrams/battery-charging.svg',
    category: 'Electrical',
  },
  {
    id: 'shore-power',
    title: 'Shore Power AC System',
    description: 'Shore power AC distribution: shore cord to inlet, galvanic isolator, main breaker, AC panel with individual circuit breakers for outlets, water heater, battery charger.',
    keywords: ['shore power', 'ac power', 'shore cord', 'inlet', 'main breaker', 'ac panel', 'galvanic isolator', '30 amp', 'shore power wiring', 'dock power', 'electrical panel', 'ac wiring', 'shore cord wiring'],
    svgPath: '/diagrams/shore-power.svg',
    category: 'Electrical',
  },
  {
    id: 'wet-exhaust',
    title: 'Marine Wet Exhaust System',
    description: 'Water-cooled exhaust from engine through exhaust manifold, water injection elbow, mixing elbow, exhaust hose, waterlock muffler to transom exit.',
    keywords: ['exhaust', 'wet exhaust', 'water injection', 'exhaust elbow', 'waterlock', 'muffler', 'transom', 'exhaust system', 'exhaust hose', 'mixing elbow'],
    svgPath: '/diagrams/wet-exhaust.svg',
    category: 'Exhaust',
  },
  {
    id: 'oil-system',
    title: 'Engine Oil Lubrication System',
    description: 'Full-flow engine oil circuit: oil pan, pickup screen, oil pump, pressure relief valve, oil filter, main gallery to main bearings, rod bearings, cam and valve train.',
    keywords: ['oil', 'oil pressure', 'oil system', 'oil pump', 'oil filter', 'bearings', 'lubrication', 'oil pan', 'low oil pressure', 'oil change', 'valve train'],
    svgPath: '/diagrams/oil-system.svg',
    category: 'Engine',
  },
  {
    id: 'sea-cock-strainer',
    title: 'Sea Cock & Strainer Assembly',
    description: 'Thru-hull fitting, sea cock valve, basket strainer assembly with proper orientation, service access notes, and failure warnings.',
    keywords: ['sea cock', 'strainer', 'thru-hull', 'through hull', 'basket strainer', 'seacock', 'sea cock valve', 'strainer basket', 'thru hull fitting'],
    svgPath: '/diagrams/sea-cock-strainer.svg',
    category: 'Plumbing',
  },
  {
    id: 'windlass-wiring',
    title: 'Anchor Windlass Wiring',
    description: 'Windlass electrical circuit: battery, main fuse, circuit breaker, contactor/solenoid to windlass motor. Deck switch and helm switch control wiring with wire sizing.',
    keywords: ['windlass', 'anchor windlass', 'windlass wiring', 'anchor', 'windlass motor', 'deck switch', 'helm switch', 'solenoid', 'contactor', 'windlass install', 'windlass diagram', 'anchor wiring'],
    svgPath: '/diagrams/windlass-wiring.svg',
    category: 'Electrical',
  },
  {
    id: 'dc-main-distribution',
    title: 'DC Main Distribution Panel',
    description: 'Main DC electrical distribution from battery through main switch, bus bar, branch fuses to all DC loads including nav lights, VHF, bilge pump, instruments, and accessories.',
    keywords: ['dc distribution', 'main switch', 'bus bar', 'fuse block', 'dc wiring', 'electrical panel', 'wiring diagram', 'dc panel', 'main distribution', 'branch fuse', 'load center', 'circuit', 'electrical diagram', 'schematic', 'wiring schematic'],
    svgPath: '/diagrams/dc-main-distribution.svg',
    category: 'Electrical',
  },
  {
    id: 'battery-bank-wiring',
    title: 'Dual Battery Bank Wiring',
    description: 'Dual battery bank wiring: start battery and house battery connected through a 1/2/Both/Off battery switch with alternator isolator for independent charging.',
    keywords: ['battery bank', 'dual battery', 'battery switch', 'house battery', 'start battery', 'battery isolator', 'acr', '1 2 both off', 'battery wiring', 'wiring diagram', 'electrical diagram', 'schematic', 'battery circuit', 'dual bank', 'battery selector'],
    svgPath: '/diagrams/battery-bank-wiring.svg',
    category: 'Electrical',
  },
  {
    id: 'alternator-charging-circuit',
    title: 'Alternator Charging Circuit',
    description: 'Complete alternator charging circuit: alternator B+/S/F terminals, voltage regulator, battery isolator diode or ACR, charging start battery and house battery.',
    keywords: ['alternator', 'charging circuit', 'voltage regulator', 'battery isolator', 'charging', 'alternator wiring', 'wiring diagram', 'electrical diagram', 'schematic', 'charge', 'diode isolator', 'acr', 'field terminal', 'b+ terminal', 'alternator circuit'],
    svgPath: '/diagrams/alternator-charging-circuit.svg',
    category: 'Electrical',
  },
  {
    id: 'nav-lights-wiring',
    title: 'Navigation Lights Wiring',
    description: 'Navigation lights wiring per COLREGS: switch and fuse panel to masthead, port red, starboard green, stern white, and anchor light with proper wire routing.',
    keywords: ['nav lights', 'navigation lights', 'running lights', 'port light', 'starboard light', 'masthead light', 'stern light', 'anchor light', 'colregs', 'nav lights wiring', 'wiring diagram', 'electrical diagram', 'schematic', 'sailing lights', 'boat lights', 'navigation light circuit'],
    svgPath: '/diagrams/nav-lights-wiring.svg',
    category: 'Electrical',
  },
  {
    id: 'bilge-pump-circuit',
    title: 'Bilge Pump Electrical Circuit',
    description: 'Bilge pump wiring with float switch for automatic operation and manual override switch. Includes fusing, check valve, and thru-hull discharge.',
    keywords: ['bilge pump', 'float switch', 'automatic bilge', 'manual bilge switch', 'bilge wiring', 'wiring diagram', 'electrical diagram', 'schematic', 'bilge circuit', 'pump wiring', 'bilge pump circuit', 'thru-hull', 'check valve', 'water pump'],
    svgPath: '/diagrams/bilge-pump-circuit.svg',
    category: 'Electrical',
  },
  {
    id: 'vhf-radio-wiring',
    title: 'VHF Radio Wiring',
    description: 'VHF marine radio wiring: power and ground with fuse, coax antenna connection, external speaker, grounding for RF, and optional remote mic wiring.',
    keywords: ['vhf radio', 'vhf wiring', 'marine radio', 'radio wiring', 'coax antenna', 'vhf antenna', 'rf ground', 'vhf install', 'wiring diagram', 'electrical diagram', 'schematic', 'vhf circuit', 'radio antenna', 'remote mic'],
    svgPath: '/diagrams/vhf-radio-wiring.svg',
    category: 'Electrical',
  },
  {
    id: 'outboard-ignition-circuit',
    title: 'Outboard Ignition Circuit',
    description: 'Outboard engine ignition circuit: key switch positions (Off/Run/Start/Choke), CDI ignition module, starter solenoid, kill switch lanyard, and neutral safety switch.',
    keywords: ['outboard ignition', 'key switch', 'ignition circuit', 'cdi', 'starter solenoid', 'kill switch', 'neutral safety', 'outboard wiring', 'wiring diagram', 'electrical diagram', 'schematic', 'ignition wiring', 'outboard start', 'engine ignition'],
    svgPath: '/diagrams/outboard-ignition-circuit.svg',
    category: 'Electrical',
  },
  {
    id: 'outboard-trim-tilt-circuit',
    title: 'Outboard Trim / Tilt Circuit',
    description: 'Power trim and tilt wiring: battery through relays to trim motor, helm switch and engine switch in parallel for up/down control.',
    keywords: ['trim tilt', 'power trim', 'tilt motor', 'trim relay', 'outboard trim', 'trim wiring', 'tilt wiring', 'wiring diagram', 'electrical diagram', 'schematic', 'trim circuit', 'trim up down', 'trim switch', 'helm trim switch'],
    svgPath: '/diagrams/outboard-trim-tilt-circuit.svg',
    category: 'Electrical',
  },
  {
    id: 'outboard-fuel-injection-sensors',
    title: 'Outboard EFI Sensor Wiring',
    description: 'Electronic fuel injection sensor wiring: ECU connections to MAP sensor, throttle position sensor (TPS), coolant temperature sensor, crank position sensor, and injectors.',
    keywords: ['fuel injection', 'efi', 'ecu', 'map sensor', 'tps', 'throttle position', 'coolant temp sensor', 'crank position', 'injector wiring', 'outboard efi', 'wiring diagram', 'electrical diagram', 'schematic', 'sensor wiring', 'pcm', 'fuel injection circuit'],
    svgPath: '/diagrams/outboard-fuel-injection-sensors.svg',
    category: 'Electrical',
  },
  {
    id: 'outboard-stator-charging',
    title: 'Outboard Stator Charging System',
    description: 'Outboard stator charging system: stator AC coils under flywheel, rectifier/regulator conversion to DC, battery charging output with test point voltage values.',
    keywords: ['stator', 'stator charging', 'rectifier regulator', 'outboard charging', 'stator wiring', 'charging system', 'wiring diagram', 'electrical diagram', 'schematic', 'stator test', 'ac charging', 'flywheel', 'stator output', 'regulator rectifier'],
    svgPath: '/diagrams/outboard-stator-charging.svg',
    category: 'Electrical',
  },
  {
    id: 'diesel-start-circuit',
    title: 'Diesel Engine Start Circuit',
    description: 'Diesel start circuit: battery, key switch positions, glow plug preheat relay and glow plugs, starter solenoid, starter motor, and fuel stop solenoid.',
    keywords: ['diesel start', 'glow plugs', 'preheat', 'starter solenoid', 'diesel ignition', 'key switch', 'diesel wiring', 'wiring diagram', 'electrical diagram', 'schematic', 'start circuit', 'diesel circuit', 'glow plug relay', 'diesel engine wiring'],
    svgPath: '/diagrams/diesel-start-circuit.svg',
    category: 'Electrical',
  },
  {
    id: 'diesel-instrument-panel',
    title: 'Diesel Engine Instrument Panel Wiring',
    description: 'Diesel instrument panel wiring: oil pressure sender, coolant temp sender, tachometer W terminal, alternator charge light, voltmeter, and alarm buzzer connections.',
    keywords: ['diesel instruments', 'oil pressure gauge', 'temp gauge', 'tachometer', 'instrument panel', 'sender wiring', 'charge light', 'panel wiring', 'wiring diagram', 'electrical diagram', 'schematic', 'instrument wiring', 'oil sender', 'temp sender', 'gauge wiring'],
    svgPath: '/diagrams/diesel-instrument-panel.svg',
    category: 'Electrical',
  },
  {
    id: 'shore-power-grounding',
    title: 'Shore Power & Grounding System',
    description: 'Shore power AC system with galvanic isolator: shore cord inlet, galvanic isolator, main breaker, AC distribution panel with branch breakers, proper grounding and bonding.',
    keywords: ['shore power', 'shore power grounding', 'galvanic isolator', 'ac panel', 'shore inlet', 'main breaker', 'grounding', 'bonding', 'electric shock drowning', 'shore power wiring', 'wiring diagram', 'electrical diagram', 'schematic', 'ac wiring', 'shore cord', '30 amp'],
    svgPath: '/diagrams/shore-power-grounding.svg',
    category: 'Electrical',
  },
  {
    id: 'nmea2000-network',
    title: 'NMEA 2000 Network Topology',
    description: 'NMEA 2000 network layout: backbone cable, T-connectors, 120Ω terminators, power tap with fuse, and connected devices including GPS, VHF, autopilot, wind, depth, and engine gateway.',
    keywords: ['nmea 2000', 'nmea2000', 'n2k', 'can bus', 'backbone', 't-connector', 'terminator', 'gps', 'autopilot', 'network topology', 'wiring diagram', 'electrical diagram', 'schematic', 'nmea network', 'marine network', 'simrad', 'garmin', 'lowrance', 'furuno'],
    svgPath: '/diagrams/nmea2000-network.svg',
    category: 'Electrical',
  },
  {
    id: 'engine-to-helm-harness',
    title: 'Engine-to-Helm Wiring Harness',
    description: 'Color-coded 10-wire engine-to-helm harness: main power, ground, ignition key, tachometer, oil pressure, coolant temp, trim gauge, crank/start, charge light, and horn signal.',
    keywords: ['engine harness', 'helm harness', 'wiring harness', 'harness colors', 'engine to helm', 'helm wiring', 'tach wire', 'oil pressure wire', 'temp wire', 'trim wire', 'key wire', 'horn wire', 'wiring diagram', 'electrical diagram', 'schematic', 'harness wiring', 'engine wiring harness'],
    svgPath: '/diagrams/engine-to-helm-harness.svg',
    category: 'Electrical',
  },
]

export function findDiagram(query: string): DiagramEntry | null {
  const q = query.toLowerCase()
  // No gating on diagram words — match on content keywords alone

  // Find best matching diagram by keyword scoring
  let bestMatch: DiagramEntry | null = null
  let bestScore = 0

  for (const diagram of DIAGRAMS) {
    let score = 0
    for (const keyword of diagram.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        // Longer/more specific keywords score higher
        score += keyword.length
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = diagram
    }
  }

  return bestScore > 0 ? bestMatch : null
}

export function getDiagramsByCategory(): Record<string, DiagramEntry[]> {
  const byCategory: Record<string, DiagramEntry[]> = {}
  for (const diagram of DIAGRAMS) {
    if (!byCategory[diagram.category]) {
      byCategory[diagram.category] = []
    }
    byCategory[diagram.category].push(diagram)
  }
  return byCategory
}
