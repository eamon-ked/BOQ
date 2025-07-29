// Master database of items with dependencies
export const masterDatabase = [
  // CCTV Items
  {
    id: 'cam-dome-2mp',
    name: 'Dome Camera 2MP',
    category: 'CCTV',
    manufacturer: 'Hikvision',
    unit: 'pcs',
    unitPrice: 150,
    description: 'Indoor/Outdoor dome camera with night vision',
    dependencies: [
      { itemId: 'rj45-connector', quantity: 1 },
      { itemId: 'camera-bracket', quantity: 1 },
      { itemId: 'power-adapter-12v', quantity: 1 }
    ]
  },
  {
    id: 'cam-bullet-4mp',
    name: 'Bullet Camera 4MP',
    category: 'CCTV',
    manufacturer: 'Dahua',
    unit: 'pcs',
    unitPrice: 200,
    description: 'Outdoor bullet camera with IR illumination',
    dependencies: [
      { itemId: 'rj45-connector', quantity: 1 },
      { itemId: 'camera-bracket', quantity: 1 },
      { itemId: 'power-adapter-12v', quantity: 1 }
    ]
  },
  {
    id: 'nvr-16ch',
    name: 'NVR 16 Channel',
    category: 'CCTV',
    manufacturer: 'Hikvision',
    unit: 'pcs',
    unitPrice: 800,
    description: '16 channel network video recorder',
    dependencies: [
      { itemId: 'hdd-2tb', quantity: 1 },
      { itemId: 'power-cord', quantity: 1 }
    ]
  },
  
  // Cabling & Network
  {
    id: 'cat6-cable',
    name: 'CAT6 Cable',
    category: 'Cabling',
    manufacturer: 'Belden',
    unit: 'meters',
    unitPrice: 2.5,
    description: 'Category 6 ethernet cable',
    dependencies: []
  },
  {
    id: 'rj45-connector',
    name: 'RJ45 Connector',
    category: 'Network',
    manufacturer: 'Panduit',
    unit: 'pcs',
    unitPrice: 1.5,
    description: 'CAT6 RJ45 connector',
    dependencies: []
  },
  {
    id: 'network-switch-24p',
    name: 'Network Switch 24 Port',
    category: 'Network',
    manufacturer: 'Cisco',
    unit: 'pcs',
    unitPrice: 300,
    description: '24 port managed switch',
    dependencies: [
      { itemId: 'power-cord', quantity: 1 }
    ]
  },
  
  // Power & Accessories
  {
    id: 'power-adapter-12v',
    name: 'Power Adapter 12V 2A',
    category: 'Power',
    manufacturer: 'Mean Well',
    unit: 'pcs',
    unitPrice: 25,
    description: '12V 2A power adapter',
    dependencies: []
  },
  {
    id: 'camera-bracket',
    name: 'Camera Mounting Bracket',
    category: 'Accessories',
    manufacturer: 'Generic',
    unit: 'pcs',
    unitPrice: 15,
    description: 'Universal camera mounting bracket',
    dependencies: []
  },
  {
    id: 'hdd-2tb',
    name: 'Hard Drive 2TB',
    category: 'Storage',
    manufacturer: 'Western Digital',
    unit: 'pcs',
    unitPrice: 120,
    description: '2TB surveillance hard drive',
    dependencies: []
  },
  {
    id: 'power-cord',
    name: 'Power Cord',
    category: 'Power',
    manufacturer: 'Generic',
    unit: 'pcs',
    unitPrice: 8,
    description: 'Standard power cord',
    dependencies: []
  },
  
  // Access Control
  {
    id: 'card-reader',
    name: 'RFID Card Reader',
    category: 'Access Control',
    manufacturer: 'HID Global',
    unit: 'pcs',
    unitPrice: 180,
    description: 'Proximity card reader',
    dependencies: [
      { itemId: 'cat6-cable', quantity: 10 },
      { itemId: 'power-adapter-12v', quantity: 1 }
    ]
  },
  {
    id: 'access-controller',
    name: 'Access Control Panel',
    category: 'Access Control',
    manufacturer: 'Honeywell',
    unit: 'pcs',
    unitPrice: 450,
    description: '4-door access control panel',
    dependencies: [
      { itemId: 'power-adapter-12v', quantity: 1 }
    ]
  },
  
  // PAVA System
  {
    id: 'speaker-ceiling',
    name: 'Ceiling Speaker 6W',
    category: 'PAVA',
    manufacturer: 'Bosch',
    unit: 'pcs',
    unitPrice: 85,
    description: 'Fire-rated ceiling speaker',
    dependencies: [
      { itemId: 'speaker-cable', quantity: 20 }
    ]
  },
  {
    id: 'pava-amplifier',
    name: 'PAVA Amplifier 240W',
    category: 'PAVA',
    manufacturer: 'Bosch',
    unit: 'pcs',
    unitPrice: 1200,
    description: 'Public address amplifier',
    dependencies: [
      { itemId: 'power-cord', quantity: 1 }
    ]
  },
  {
    id: 'speaker-cable',
    name: 'Speaker Cable 2x1.5mm',
    category: 'Cabling',
    manufacturer: 'Draka',
    unit: 'meters',
    unitPrice: 3.2,
    description: 'Fire-rated speaker cable',
    dependencies: []
  }
];

export const categories = [...new Set(masterDatabase.map(item => item.category))];