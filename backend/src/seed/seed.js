/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Series = require('../models/Series');
const ProductModel = require('../models/ProductModel');
const ProductionLine = require('../models/ProductionLine');
const Operation = require('../models/Operation');
const Parameter = require('../models/Parameter');
const InspectionTemplate = require('../models/InspectionTemplate');
const InspectionEntry = require('../models/InspectionEntry');
const NonConformity = require('../models/NonConformity');
const { Counter, nextSequence } = require('../models/Counter');

const DESTROY_ONLY = process.argv.includes('--destroy');

async function destroyAll() {
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Series.deleteMany({}),
    ProductModel.deleteMany({}),
    ProductionLine.deleteMany({}),
    Operation.deleteMany({}),
    Parameter.deleteMany({}),
    InspectionTemplate.deleteMany({}),
    InspectionEntry.deleteMany({}),
    NonConformity.deleteMany({}),
    Counter.deleteMany({}),
  ]);
  console.log('All collections cleared.');
}

async function run() {
  await connectDB();

  if (DESTROY_ONLY) {
    await destroyAll();
    process.exit(0);
  }

  await destroyAll();

  // ---------- Users ----------
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@qualityos.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  const admin = await User.create({
    name: 'Admin User', email: adminEmail, password: adminPassword, role: 'Admin',
  });
  const ravi = await User.create({
    name: 'Ravi Venkatesh', email: 'ravi.venkatesh@qualityos.local', password: 'Supervisor@123', role: 'Supervisor',
  });
  const qm = await User.create({
    name: 'Lakshmi Narayan', email: 'lakshmi.narayan@qualityos.local', password: 'Quality@123', role: 'QualityManager',
  });
  const priya = await User.create({
    name: 'Priya S.', email: 'priya.s@qualityos.local', password: 'Auditor@123', role: 'Auditor',
  });
  const arjun = await User.create({
    name: 'Arjun K.', email: 'arjun.k@qualityos.local', password: 'Auditor@123', role: 'Auditor',
  });
  const karthik = await User.create({
    name: 'Karthik R.', email: 'karthik.r@qualityos.local', password: 'Auditor@123', role: 'Auditor',
  });
  await User.create({
    name: 'Viewer Account', email: 'viewer@qualityos.local', password: 'Viewer@123', role: 'Viewer',
  });
  console.log('Users seeded.');

  // ---------- Customers ----------
  const mahindra = await Customer.create({
    name: 'Mahindra & Mahindra', code: 'MAHM', contactPerson: 'Suresh Kumar',
    email: 'suresh.kumar@mahindra.com', phone: '+91 98765 43210', address: 'Kandivali, Mumbai, MH',
  });
  const tata = await Customer.create({
    name: 'Tata Motors', code: 'TATA', contactPerson: 'Anjali Deshmukh',
    email: 'anjali.deshmukh@tatamotors.com', phone: '+91 98123 45678', address: 'Pimpri, Pune, MH',
  });
  const maruti = await Customer.create({
    name: 'Maruti Suzuki', code: 'MRTI', contactPerson: 'Vikram Chauhan',
    email: 'vikram.chauhan@maruti.com', phone: '+91 99887 66554', address: 'Gurugram, HR',
  });
  const tvsCustomer = await Customer.create({
    name: 'TVS', code: 'TVS', contactPerson: 'Ramesh Nair',
    email: 'ramesh.nair@tvs.com', phone: '+91 98765 43211', address: 'Hosur, TN',
  });
  console.log('Customers seeded.');

  // ---------- Series ----------
  const seriesU = await Series.create({ name: 'U-Series', code: 'U-SERIES', customer: mahindra._id, description: 'Utility vehicle chassis series' });

  // ---------- Product Models ----------
  const u244 = await ProductModel.create({ name: 'U244', code: 'U244', customer: mahindra._id, series: seriesU._id, description: 'Compact utility chassis' });
  const u245 = await ProductModel.create({ name: 'U245', code: 'U245', customer: mahindra._id, series: seriesU._id, description: 'Standard utility chassis' });
  const u246 = await ProductModel.create({ name: 'U246', code: 'U246', customer: mahindra._id, series: seriesU._id, description: 'Extended utility chassis' });
  const tvsTankSeries = await Series.create({ name: 'Tank Series', code: 'TANK-SERIES', customer: tvsCustomer._id, description: 'Tank series for TVS U244 models' });
  const u244Hlx = await ProductModel.create({ name: 'U244 (HLX)', code: 'U244-HLX', customer: tvsCustomer._id, series: tvsTankSeries._id, description: 'TVS U244 HLX tank model' });
  console.log('Series & Models seeded.');

  // ---------- Production Lines ----------
  const fml1 = await ProductionLine.create({ name: 'FML-1', code: 'FML-1', description: 'Outer Spot Welding line', defaultModel: u244._id, location: 'Shop Floor A' });
  const fml2 = await ProductionLine.create({ name: 'FML-2', code: 'FML-2', description: 'Seam Welding line', defaultModel: u245._id, location: 'Shop Floor A' });
  const fml3 = await ProductionLine.create({ name: 'FML-3', code: 'FML-3', description: 'Rolling line', defaultModel: u246._id, location: 'Shop Floor B' });
  const tvsLine = await ProductionLine.create({ name: 'TVS Tank Line', code: 'TVS-1', description: 'TVS U244 tank production line', defaultModel: u244Hlx._id, location: 'Shop Floor C', active: true });
  await ProductionLine.create({ name: 'FML-4', code: 'FML-4', description: 'Final assembly line', defaultModel: u244._id, location: 'Shop Floor B', active: true });
  console.log('Production lines seeded.');

  // ---------- Operations ----------
  const operationDefs = [
    { opNumber: 20, name: 'OP 20 - OUTER L & R SPOT WELDING', processName: 'Spot Weld', description: 'Outer left and right tank spot welding' },
    { opNumber: 30, name: 'OP 30 - SEAM WELDING OF FUEL TANK LH & RH', processName: 'Seam Weld', description: 'Seam welding of left and right fuel tank shells' },
    { opNumber: 40, name: 'OP 40 - ROLLING', processName: 'Rolling', description: 'Rolling operation for tank body forming' },
    { opNumber: 50, name: 'OP 50 - LINISHING', processName: 'Linishing', description: 'Surface linishing for weld and edges' },
    { opNumber: 60, name: 'OP 60 - BUFFING', processName: 'Buffing', description: 'Polish buffing of tank surface' },
    { opNumber: 70, name: 'OP 70 - INLET HOLE PIERCING / FLARING / NECK FORMING', processName: 'Piercing', description: 'Inlet hole piercing and neck forming' },
    { opNumber: 80, name: 'OP 80 - PROJECTION WELDING OF NUT FILLER CAP', processName: 'Projection Weld', description: 'Projection welding of nut filler cap' },
    { opNumber: 90, name: 'OP 90 - TACK WELDING OF NUT FILLER CAP', processName: 'Tack Weld', description: 'Tack welding for nut filler cap' },
    { opNumber: 100, name: 'OP 100 - DEBURRING', processName: 'Deburring', description: 'Deburring of tank edges and holes' },
    { opNumber: 110, name: 'OP 110 - INLET PRESSING', processName: 'Pressing', description: 'Inlet pressing operation' },
    { opNumber: 120, name: 'OP 120 - INLET SOLDERING', processName: 'Soldering', description: 'Soldering of inlet components' },
    { opNumber: 130, name: 'OP 130 - MANUAL RETAPPING', processName: 'Retapping', description: 'Manual retapping of threaded holes' },
    { opNumber: 140, name: 'OP 140 - TIG WELDING', processName: 'TIG Weld', description: 'TIG welding of tank assemblies' },
    { opNumber: 150, name: 'OP 150 - LEAK TESTING OF INNER SUB ASSEMBLY', processName: 'Leak Test', description: 'Leak testing of inner subassembly' },
    { opNumber: 160, name: 'OP 160 - SPOT WELDING FUEL MTG GAUGE + INNER TANK', processName: 'Spot Weld', description: 'Spot welding gauge mount and inner tank' },
    { opNumber: 170, name: 'OP 170 - SPOT WELDING C BRACKET + FUEL COCK', processName: 'Spot Weld', description: 'Spot welding C bracket and fuel cock' },
    { opNumber: 180, name: 'OP 180 - INNER & OUTER SPOT WELDING', processName: 'Spot Weld', description: 'Inner and outer spot welding' },
    { opNumber: 1901, name: 'OP 190A - SEAM WELDING OUTER & INNER', processName: 'Seam Weld', description: 'A-side seam welding of outer and inner panels' },
    { opNumber: 1902, name: 'OP 190B - SEAM WELDING OUTER & INNER', processName: 'Seam Weld', description: 'B-side seam welding of outer and inner panels' },
    { opNumber: 200, name: 'OP 200 - DEBURRING', processName: 'Deburring', description: 'Secondary deburring' },
    { opNumber: 210, name: 'OP 210 - PERIPHERAL ROLLING', processName: 'Rolling', description: 'Peripheral rolling of tank edge' },
    { opNumber: 220, name: 'OP 220 - REAR END CURLING & PIERCING', processName: 'Curling', description: 'Rear end curling and piercing' },
    { opNumber: 230, name: 'OP 230 - MANUAL BUFFING & NODE INSPECTION', processName: 'Buffing', description: 'Manual buffing and node inspection' },
    { opNumber: 240, name: 'OP 240 - VISUAL INSPECTION', processName: 'Visual', description: 'Final visual inspection' },
    { opNumber: 250, name: 'OP 250 - LEAK TESTING 1', processName: 'Leak Test', description: 'Primary leak testing' },
    { opNumber: 260, name: 'OP 260 - RT OF LEAK TANKS', processName: 'RT Leak', description: 'Room temperature leak test for filled tanks' },
    { opNumber: 270, name: 'OP 270 - LEAK TESTING 2', processName: 'Leak Test', description: 'Secondary leak testing' },
    { opNumber: 280, name: 'OP 280 - WATER CLEANING', processName: 'Cleaning', description: 'Water cleaning of finished tanks' },
    { opNumber: 290, name: 'OP 290 - TOTAL ACCEPTANCE GAUGE INSPECTION', processName: 'Gauge', description: 'Final acceptance gauge inspection' },
  ];

  const operations = await Operation.insertMany(operationDefs);
  const opMap = operations.reduce((acc, op) => { acc[op.opNumber] = op; return acc; }, {});
  console.log('Operations seeded.');

  // ---------- Parameters for TVS U244 (HLX) ----------
  const paramDefs = [
    // OP 20
    { operation: opMap[20]._id, model: u244Hlx._id, siNo: 1, name: 'Squeeze Time', specification: '0.8 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[20]._id, model: u244Hlx._id, siNo: 2, name: 'Weld Time', specification: '0.7 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[20]._id, model: u244Hlx._id, siNo: 3, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[20]._id, model: u244Hlx._id, siNo: 4, name: 'Welding Current', specification: '17 ±1 KA', unit: 'KA', method: 'Amp Meter', type: 'Process' },
    { operation: opMap[20]._id, model: u244Hlx._id, siNo: 5, name: 'Off Time', specification: '0.3 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[20]._id, model: u244Hlx._id, siNo: 6, name: 'Air Pressure', specification: '5.0 ±0.2 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[20]._id, model: u244Hlx._id, siNo: 7, name: 'Electrode Changing', specification: 'Every 1500 welds', unit: '', method: 'Visual/Log', type: 'Process' },
    { operation: opMap[20]._id, model: u244Hlx._id, siNo: 8, name: 'Number of Spots', specification: 'As per drawing', unit: '', method: 'Count / Visual', type: 'Product' },
    { operation: opMap[20]._id, model: u244Hlx._id, siNo: 9, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 30
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 1, name: 'Upper & Lower Wheel Dressing Frequency', specification: 'Every 8 hrs', unit: '', method: 'Maintenance Log', type: 'Process' },
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 2, name: 'Upper Wheel Changing Frequency', specification: 'Every 24 hrs', unit: '', method: 'Maintenance Log', type: 'Process' },
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 3, name: 'Lower Wheel Changing Frequency', specification: 'Every 24 hrs', unit: '', method: 'Maintenance Log', type: 'Process' },
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 4, name: 'Squeeze Time', specification: '0.8 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 5, name: 'Weld Current', specification: '17 ±1 KA', unit: 'KA', method: 'Amp Meter', type: 'Process' },
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 6, name: 'Weld Time', specification: '0.7 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 7, name: 'Off Time', specification: '0.3 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 8, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 9, name: 'Weld Pressure', specification: '250 ±10 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[30]._id, model: u244Hlx._id, siNo: 10, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 40
    { operation: opMap[40]._id, model: u244Hlx._id, siNo: 1, name: 'Roller Gap', specification: '1.5 ±0.2 mm', unit: 'mm', method: 'Gauge', type: 'Process' },
    { operation: opMap[40]._id, model: u244Hlx._id, siNo: 2, name: 'High Pressure', specification: '250 ±10 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[40]._id, model: u244Hlx._id, siNo: 3, name: 'Low Pressure', specification: '120 ±5 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[40]._id, model: u244Hlx._id, siNo: 4, name: 'High Pressure Pass', specification: '3 passes', unit: '', method: 'Count', type: 'Process' },
    { operation: opMap[40]._id, model: u244Hlx._id, siNo: 5, name: 'Low Pressure Pass', specification: '2 passes', unit: '', method: 'Count', type: 'Process' },
    { operation: opMap[40]._id, model: u244Hlx._id, siNo: 6, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 50
    { operation: opMap[50]._id, model: u244Hlx._id, siNo: 1, name: 'Belt Grade', specification: 'Grade A36', unit: '', method: 'Visual', type: 'Process' },
    { operation: opMap[50]._id, model: u244Hlx._id, siNo: 2, name: 'Linishing Belt Replacement', specification: 'Every 20 hrs', unit: '', method: 'Maintenance Log', type: 'Process' },
    { operation: opMap[50]._id, model: u244Hlx._id, siNo: 3, name: 'Linishing Width', specification: '300 ±5 mm', unit: 'mm', method: 'Tape Measure', type: 'Process' },
    { operation: opMap[50]._id, model: u244Hlx._id, siNo: 4, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 60
    { operation: opMap[60]._id, model: u244Hlx._id, siNo: 1, name: 'Wheel Grade', specification: 'Grade W60', unit: '', method: 'Visual', type: 'Process' },
    { operation: opMap[60]._id, model: u244Hlx._id, siNo: 2, name: 'Buffing Wheel Replacement', specification: 'Every 24 hrs', unit: '', method: 'Maintenance Log', type: 'Process' },
    { operation: opMap[60]._id, model: u244Hlx._id, siNo: 3, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 70
    { operation: opMap[70]._id, model: u244Hlx._id, siNo: 1, name: 'Main Ram Pressure', specification: '180 ±10 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[70]._id, model: u244Hlx._id, siNo: 2, name: 'Inlet Hole Diameter', specification: '24.5 ±0.2 mm', unit: 'mm', method: 'Caliper', type: 'Product' },
    { operation: opMap[70]._id, model: u244Hlx._id, siNo: 3, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 80
    { operation: opMap[80]._id, model: u244Hlx._id, siNo: 1, name: 'Squeeze Time', specification: '0.8 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[80]._id, model: u244Hlx._id, siNo: 2, name: 'Weld Time', specification: '0.7 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[80]._id, model: u244Hlx._id, siNo: 3, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[80]._id, model: u244Hlx._id, siNo: 4, name: 'Welding Current', specification: '17 ±1 KA', unit: 'KA', method: 'Amp Meter', type: 'Process' },
    { operation: opMap[80]._id, model: u244Hlx._id, siNo: 5, name: 'Off Time', specification: '0.3 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[80]._id, model: u244Hlx._id, siNo: 6, name: 'Pressure', specification: '240 ±10 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[80]._id, model: u244Hlx._id, siNo: 7, name: 'Pin Changing Frequency', specification: 'Every 12 hrs', unit: '', method: 'Maintenance Log', type: 'Process' },
    { operation: opMap[80]._id, model: u244Hlx._id, siNo: 8, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 90
    { operation: opMap[90]._id, model: u244Hlx._id, siNo: 1, name: 'Voltage', specification: '3.2 ±0.2 V', unit: 'V', method: 'Voltmeter', type: 'Process' },
    { operation: opMap[90]._id, model: u244Hlx._id, siNo: 2, name: 'Current', specification: '60 ±5 A', unit: 'A', method: 'Ammeter', type: 'Process' },
    { operation: opMap[90]._id, model: u244Hlx._id, siNo: 3, name: 'Gas Flow', specification: '8 ±1 l/min', unit: 'l/min', method: 'Flow Meter', type: 'Process' },
    { operation: opMap[90]._id, model: u244Hlx._id, siNo: 4, name: 'Wire Diameter', specification: '0.9 ±0.05 mm', unit: 'mm', method: 'Micrometer', type: 'Process' },
    { operation: opMap[90]._id, model: u244Hlx._id, siNo: 5, name: 'Wire Feed', specification: '2.1 ±0.1 m/min', unit: 'm/min', method: 'Speed Sensor', type: 'Process' },
    { operation: opMap[90]._id, model: u244Hlx._id, siNo: 6, name: 'Number of Tack Welds', specification: '2 ±0', unit: '', method: 'Count', type: 'Process' },
    { operation: opMap[90]._id, model: u244Hlx._id, siNo: 7, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 100
    { operation: opMap[100]._id, model: u244Hlx._id, siNo: 1, name: 'Edge Deburr Depth', specification: '< 0.2 mm', unit: 'mm', method: 'Feeler Gauge', type: 'Product' },
    { operation: opMap[100]._id, model: u244Hlx._id, siNo: 2, name: 'Surface Deburr Quality', specification: 'No burrs', unit: '', method: 'Visual', type: 'Product' },
    // OP 110
    { operation: opMap[110]._id, model: u244Hlx._id, siNo: 1, name: 'Press Force', specification: '2.2 ±0.1 kN', unit: 'kN', method: 'Load Cell', type: 'Process' },
    { operation: opMap[110]._id, model: u244Hlx._id, siNo: 2, name: 'Stroke Depth', specification: '40 ±2 mm', unit: 'mm', method: 'Depth Gauge', type: 'Process' },
    { operation: opMap[110]._id, model: u244Hlx._id, siNo: 3, name: 'Form Height', specification: '18 ±1 mm', unit: 'mm', method: 'Caliper', type: 'Product' },
    // OP 120
    { operation: opMap[120]._id, model: u244Hlx._id, siNo: 1, name: 'Solder Temperature', specification: '250 ±5 °C', unit: '°C', method: 'Thermocouple', type: 'Process' },
    { operation: opMap[120]._id, model: u244Hlx._id, siNo: 2, name: 'Flux Application', specification: 'Uniform coverage', unit: '', method: 'Visual', type: 'Process' },
    { operation: opMap[120]._id, model: u244Hlx._id, siNo: 3, name: 'Solder Joint Integrity', specification: 'No cracks', unit: '', method: 'Visual', type: 'Product' },
    { operation: opMap[120]._id, model: u244Hlx._id, siNo: 4, name: 'Weld Time', specification: '3.5 ±0.2 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[120]._id, model: u244Hlx._id, siNo: 5, name: 'Cooling Time', specification: '15 ±2 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[120]._id, model: u244Hlx._id, siNo: 6, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 130
    { operation: opMap[130]._id, model: u244Hlx._id, siNo: 1, name: 'Tap Torque', specification: '8 ±0.5 Nm', unit: 'Nm', method: 'Torque Wrench', type: 'Process' },
    { operation: opMap[130]._id, model: u244Hlx._id, siNo: 2, name: 'Thread Depth', specification: '18 ±0.5 mm', unit: 'mm', method: 'Depth Gauge', type: 'Product' },
    { operation: opMap[130]._id, model: u244Hlx._id, siNo: 3, name: 'Tap Finish', specification: 'Clean threads', unit: '', method: 'Visual', type: 'Product' },
    { operation: opMap[130]._id, model: u244Hlx._id, siNo: 4, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 140
    { operation: opMap[140]._id, model: u244Hlx._id, siNo: 1, name: 'TIG Current', specification: '120 ±5 A', unit: 'A', method: 'Ammeter', type: 'Process' },
    { operation: opMap[140]._id, model: u244Hlx._id, siNo: 2, name: 'TIG Voltage', specification: '15 ±1 V', unit: 'V', method: 'Voltmeter', type: 'Process' },
    { operation: opMap[140]._id, model: u244Hlx._id, siNo: 3, name: 'Gas Flow', specification: '10 ±1 l/min', unit: 'l/min', method: 'Flow Meter', type: 'Process' },
    { operation: opMap[140]._id, model: u244Hlx._id, siNo: 4, name: 'Weld Tolerance', specification: 'No cracks / porosity', unit: '', method: 'Visual', type: 'Product' },
    // OP 150
    { operation: opMap[150]._id, model: u244Hlx._id, siNo: 1, name: 'Test Pressure', specification: '0.4 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[150]._id, model: u244Hlx._id, siNo: 2, name: 'Leak Rate', specification: '< 0.1 ml/min', unit: 'ml/min', method: 'Leak Tester', type: 'Product' },
    { operation: opMap[150]._id, model: u244Hlx._id, siNo: 3, name: 'Seal Integrity', specification: 'No bubbles / seepage', unit: '', method: 'Visual / Leak Test', type: 'Product' },
    // OP 160
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 1, name: 'Squeeze Time', specification: '0.8 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 2, name: 'Weld Time', specification: '0.7 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 3, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 4, name: 'Welding Current', specification: '17 ±1 KA', unit: 'KA', method: 'Amp Meter', type: 'Process' },
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 5, name: 'Off Time', specification: '0.3 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 6, name: 'Air Pressure', specification: '5.0 ±0.2 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 7, name: 'Electrode Changing', specification: 'Every 1500 welds', unit: '', method: 'Visual/Log', type: 'Process' },
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 8, name: 'Number of Spots', specification: 'As per drawing', unit: '', method: 'Count / Visual', type: 'Product' },
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 9, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    { operation: opMap[160]._id, model: u244Hlx._id, siNo: 10, name: 'Pressure', specification: '240 ±10 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    // OP 170
    { operation: opMap[170]._id, model: u244Hlx._id, siNo: 1, name: 'Squeeze Time', specification: '0.8 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[170]._id, model: u244Hlx._id, siNo: 2, name: 'Weld Time', specification: '0.7 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[170]._id, model: u244Hlx._id, siNo: 3, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[170]._id, model: u244Hlx._id, siNo: 4, name: 'Welding Current', specification: '17 ±1 KA', unit: 'KA', method: 'Amp Meter', type: 'Process' },
    { operation: opMap[170]._id, model: u244Hlx._id, siNo: 5, name: 'Off Time', specification: '0.3 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[170]._id, model: u244Hlx._id, siNo: 6, name: 'Pressure', specification: '240 ±10 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[170]._id, model: u244Hlx._id, siNo: 7, name: 'Pin Changing Frequency', specification: 'Every 12 hrs', unit: '', method: 'Maintenance Log', type: 'Process' },
    { operation: opMap[170]._id, model: u244Hlx._id, siNo: 8, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    { operation: opMap[170]._id, model: u244Hlx._id, siNo: 9, name: 'Number of Spots', specification: 'As per drawing', unit: '', method: 'Count / Visual', type: 'Product' },
    // OP 180
    { operation: opMap[180]._id, model: u244Hlx._id, siNo: 1, name: 'Squeeze Time', specification: '0.8 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[180]._id, model: u244Hlx._id, siNo: 2, name: 'Weld Time', specification: '0.7 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[180]._id, model: u244Hlx._id, siNo: 3, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[180]._id, model: u244Hlx._id, siNo: 4, name: 'Welding Current', specification: '17 ±1 KA', unit: 'KA', method: 'Amp Meter', type: 'Process' },
    { operation: opMap[180]._id, model: u244Hlx._id, siNo: 5, name: 'Off Time', specification: '0.3 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[180]._id, model: u244Hlx._id, siNo: 6, name: 'Air Pressure', specification: '5.0 ±0.2 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[180]._id, model: u244Hlx._id, siNo: 7, name: 'Electrode Changing', specification: 'Every 1500 welds', unit: '', method: 'Visual/Log', type: 'Process' },
    { operation: opMap[180]._id, model: u244Hlx._id, siNo: 8, name: 'Number of Spots', specification: 'As per drawing', unit: '', method: 'Count / Visual', type: 'Product' },
    { operation: opMap[180]._id, model: u244Hlx._id, siNo: 9, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 190A
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 1, name: 'Squeeze Time', specification: '0.8 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 2, name: 'Weld Time', specification: '0.7 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 3, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 4, name: 'Welding Current', specification: '17 ±1 KA', unit: 'KA', method: 'Amp Meter', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 5, name: 'Off Time', specification: '0.3 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 6, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 7, name: 'Weld Pressure', specification: '250 ±10 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 8, name: 'Number of Tack Welds', specification: '2 ±0', unit: '', method: 'Count', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 9, name: 'Weld Speed', specification: '0.6 ±0.05 m/min', unit: 'm/min', method: 'Speed Sensor', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 10, name: 'Wire Diameter', specification: '0.9 ±0.05 mm', unit: 'mm', method: 'Micrometer', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 11, name: 'Wire Feed', specification: '2.1 ±0.1 m/min', unit: 'm/min', method: 'Speed Sensor', type: 'Process' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 12, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    { operation: opMap[1901]._id, model: u244Hlx._id, siNo: 13, name: 'Weld Current', specification: '17 ±1 KA', unit: 'KA', method: 'Amp Meter', type: 'Process' },
    // OP 190B
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 1, name: 'Squeeze Time', specification: '0.8 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 2, name: 'Weld Time', specification: '0.7 ±0.1 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 3, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 4, name: 'Welding Current', specification: '17 ±1 KA', unit: 'KA', method: 'Amp Meter', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 5, name: 'Off Time', specification: '0.3 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 6, name: 'Hold Time', specification: '0.35 ±0.05 s', unit: 's', method: 'Timer', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 7, name: 'Weld Pressure', specification: '250 ±10 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 8, name: 'Weld Speed', specification: '0.6 ±0.05 m/min', unit: 'm/min', method: 'Speed Sensor', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 9, name: 'Wire Diameter', specification: '0.9 ±0.05 mm', unit: 'mm', method: 'Micrometer', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 10, name: 'Wire Feed', specification: '2.1 ±0.1 m/min', unit: 'm/min', method: 'Speed Sensor', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 11, name: 'Lower Wheel Changing Frequency', specification: 'Every 24 hrs', unit: '', method: 'Maintenance Log', type: 'Process' },
    { operation: opMap[1902]._id, model: u244Hlx._id, siNo: 12, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 200
    { operation: opMap[200]._id, model: u244Hlx._id, siNo: 1, name: 'Edge Deburr Depth', specification: '< 0.2 mm', unit: 'mm', method: 'Feeler Gauge', type: 'Product' },
    { operation: opMap[200]._id, model: u244Hlx._id, siNo: 2, name: 'Surface Deburr Quality', specification: 'No burrs', unit: '', method: 'Visual', type: 'Product' },
    // OP 210
    { operation: opMap[210]._id, model: u244Hlx._id, siNo: 1, name: 'Bending Pressure', specification: '180 ±5 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[210]._id, model: u244Hlx._id, siNo: 2, name: 'Roll Accuracy', specification: '±0.3 mm', unit: 'mm', method: 'Caliper', type: 'Product' },
    // OP 220
    { operation: opMap[220]._id, model: u244Hlx._id, siNo: 1, name: 'Curl Radius', specification: '12 ±1 mm', unit: 'mm', method: 'Radius Gauge', type: 'Product' },
    { operation: opMap[220]._id, model: u244Hlx._id, siNo: 2, name: 'Pierce Position', specification: 'As per drawing', unit: '', method: 'Visual', type: 'Product' },
    { operation: opMap[220]._id, model: u244Hlx._id, siNo: 3, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 230
    { operation: opMap[230]._id, model: u244Hlx._id, siNo: 1, name: 'Buffing Quality', specification: 'No scratches', unit: '', method: 'Visual', type: 'Product' },
    { operation: opMap[230]._id, model: u244Hlx._id, siNo: 2, name: 'Node Inspection', specification: 'All nodes intact', unit: '', method: 'Visual', type: 'Product' },
    // OP 240
    { operation: opMap[240]._id, model: u244Hlx._id, siNo: 1, name: 'Visual Inspection', specification: 'No visible defect', unit: '', method: 'Visual', type: 'Product' },
    // OP 250
    { operation: opMap[250]._id, model: u244Hlx._id, siNo: 1, name: 'Pressure Hold', specification: '0.4 bar for 5 min', unit: 'bar/min', method: 'Leak Tester', type: 'Process' },
    { operation: opMap[250]._id, model: u244Hlx._id, siNo: 2, name: 'Leak Rate', specification: '< 0.1 ml/min', unit: 'ml/min', method: 'Leak Tester', type: 'Product' },
    { operation: opMap[250]._id, model: u244Hlx._id, siNo: 3, name: 'Gauge Reading', specification: 'Within tolerance', unit: '', method: 'Gauge', type: 'Product' },
    { operation: opMap[250]._id, model: u244Hlx._id, siNo: 4, name: 'Valve Integrity', specification: 'No leak', unit: '', method: 'Visual / Pressure', type: 'Product' },
    { operation: opMap[250]._id, model: u244Hlx._id, siNo: 5, name: 'Seal Condition', specification: 'No damage', unit: '', method: 'Visual', type: 'Product' },
    { operation: opMap[250]._id, model: u244Hlx._id, siNo: 6, name: 'Test Cycle', specification: 'Pass / Fail', unit: '', method: 'Test Rig', type: 'Process' },
    { operation: opMap[250]._id, model: u244Hlx._id, siNo: 7, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 260
    { operation: opMap[260]._id, model: u244Hlx._id, siNo: 1, name: 'RT Pressure', specification: '0.5 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[260]._id, model: u244Hlx._id, siNo: 2, name: 'Leak Duration', specification: '5 min', unit: 'min', method: 'Timer', type: 'Process' },
    { operation: opMap[260]._id, model: u244Hlx._id, siNo: 3, name: 'Leak Result', specification: 'Pass / Fail', unit: '', method: 'Leak Tester', type: 'Product' },
    // OP 270
    { operation: opMap[270]._id, model: u244Hlx._id, siNo: 1, name: 'Pressure Hold', specification: '0.4 bar', unit: 'bar', method: 'Pressure Gauge', type: 'Process' },
    { operation: opMap[270]._id, model: u244Hlx._id, siNo: 2, name: 'Leak Rate', specification: '< 0.1 ml/min', unit: 'ml/min', method: 'Leak Tester', type: 'Product' },
    { operation: opMap[270]._id, model: u244Hlx._id, siNo: 3, name: 'Gauge Reading', specification: 'Within tolerance', unit: '', method: 'Gauge', type: 'Product' },
    { operation: opMap[270]._id, model: u244Hlx._id, siNo: 4, name: 'Valve Check', specification: 'No leak', unit: '', method: 'Visual / Pressure', type: 'Process' },
    { operation: opMap[270]._id, model: u244Hlx._id, siNo: 5, name: 'Seal Condition', specification: 'No damage', unit: '', method: 'Visual', type: 'Product' },
    { operation: opMap[270]._id, model: u244Hlx._id, siNo: 6, name: 'Test Cycle', specification: 'Pass / Fail', unit: '', method: 'Test Rig', type: 'Process' },
    { operation: opMap[270]._id, model: u244Hlx._id, siNo: 7, name: 'Refer Defects Master Copy', specification: 'Refer Defects Master Copy', unit: '', method: 'Refer Defects Master Copy', type: 'Product' },
    // OP 280
    { operation: opMap[280]._id, model: u244Hlx._id, siNo: 1, name: 'Water Cleaning', specification: 'Clean / Dry', unit: '', method: 'Visual', type: 'Product' },
    // OP 290
    { operation: opMap[290]._id, model: u244Hlx._id, siNo: 1, name: 'Gauge Calibration', specification: 'Within tolerance', unit: '', method: 'Gauge', type: 'Product' },
    { operation: opMap[290]._id, model: u244Hlx._id, siNo: 2, name: 'Acceptance Check', specification: 'Pass / Fail', unit: '', method: 'Visual / Gauge', type: 'Product' },
  ];

  const parameters = await Parameter.insertMany(paramDefs);
  console.log('Parameters seeded.');

  const paramMap = {};
  parameters.forEach((p) => { paramMap[`${p.operation}-${p.siNo}`] = p; });

  const template = await InspectionTemplate.create({
    name: 'TVS U244 (HLX) Tank Inspection Template',
    customer: tvsCustomer._id,
    productionLine: tvsLine._id,
    model: u244Hlx._id,
    qualityThreshold: 85,
    operations: operationDefs.map((op, index) => ({
      operation: opMap[op.opNumber]._id,
      sequence: index + 1,
      parameters: paramDefs
        .filter((p) => String(p.operation) === String(opMap[op.opNumber]._id))
        .map((p) => ({ parameter: paramMap[`${p.operation}-${p.siNo}`]._id, siNo: p.siNo })),
    })),
  });
  console.log('Inspection template seeded.');

  // ---------- Sample in-progress Inspection Entry (mirrors the reference sheet) ----------
  const buildRow = (opDoc, param, shiftValues) => ({
    operation: opDoc._id,
    opNumber: opDoc.opNumber,
    processName: opDoc.processName,
    operationName: opDoc.name,
    parameter: param._id,
    parameterName: param.name,
    siNo: param.siNo,
    specification: param.specification,
    unit: param.unit,
    method: param.method,
    shiftResults: [
      { shiftCode: 'F', value: shiftValues[0] || null, actualValue: '' },
      { shiftCode: 'JD', value: shiftValues[1] || null, actualValue: '' },
      { shiftCode: 'M', value: shiftValues[2] || null, actualValue: '' },
    ],
    remarks: shiftValues[3] || '',
  });

  const results = [
    buildRow(opMap[20], paramMap[`${opMap[20]._id}-1`], ['OK', 'NOK', null]),
    buildRow(opMap[20], paramMap[`${opMap[20]._id}-4`], ['OK', 'OK', null]),
    buildRow(opMap[30], paramMap[`${opMap[30]._id}-5`], ['OK', 'OK', null]),
    buildRow(opMap[30], paramMap[`${opMap[30]._id}-9`], ['OK', 'NOK', null, 'Weld pressure below tolerance on JD shift']),
    buildRow(opMap[40], paramMap[`${opMap[40]._id}-2`], ['OK', 'OK', null]),
    buildRow(opMap[40], paramMap[`${opMap[40]._id}-6`], ['OK', 'OK', null]),
  ];
  results[3].shiftResults[1].actualValue = '238 bar';

  const { id: reportId } = await nextSequence('IPIR');
  const entry = new InspectionEntry({
    reportId,
    template: template._id,
    customer: tvsCustomer._id,
    productionLine: tvsLine._id,
    model: u244Hlx._id,
    date: new Date(),
    shift: 'JD',
    Auditor: priya._id,
    supervisor: ravi._id,
    status: 'InProgress',
    results,
    createdBy: admin._id,
  });
  entry.recalculateSummary();
  await entry.save();
  console.log(`Sample inspection entry seeded: ${entry.reportId}`);

  // ---------- Linked Non-Conformity (mirrors NC-2025-089 in reference) ----------
  const seamPressureRow = entry.results.find(
    (r) => String(r.operation) === String(opMap[30]._id) && r.siNo === 9
  );
  const { id: ncId } = await nextSequence('NC');
  const nc = await NonConformity.create({
    ncId,
    inspectionEntry: entry._id,
    resultRowId: seamPressureRow._id,
    productionLine: tvsLine._id,
    model: u244Hlx._id,
    operation: opMap[30]._id,
    parameter: seamPressureRow.parameter,
    specification: seamPressureRow.specification,
    actualValue: '238 bar',
    shift: 'JD',
    severity: 'High',
    status: 'UnderCA',
    detectedBy: priya._id,
    detectedByName: 'Priya S.',
    detectedAt: new Date(),
    description: 'Weld pressure fell below tolerance during JD shift. Actual pressure was 238 bar versus expected 250 ±10 bar on the seam welding operation.',
    rootCause: { category: 'Machine', description: 'Pressure regulator drift on welding station WM-03.' },
    correctiveAction: { description: 'Inspect and recalibrate WM-03 pressure regulator; verify hose integrity.', owner: 'Maintenance Team', status: 'In progress' },
    impact: { affectedParts: 18, batch: '#2406B', disposition: 'Rework', machineHalted: true, customerNotified: false },
    timeline: [
      { stage: 'NC Raised', status: 'done', by: 'Priya S.', at: new Date(Date.now() - 1000 * 60 * 90) },
      { stage: 'Root Cause Analysis', status: 'done', by: 'Ravi Venkatesh', at: new Date(Date.now() - 1000 * 60 * 60) },
      { stage: 'CA Implementation', status: 'active', by: 'Maintenance Team' },
      { stage: 'Quality Manager Review', status: 'pending' },
      { stage: 'NC Closed', status: 'pending' },
    ],
    comments: [
      { userName: 'Priya S.', text: 'Observed pressure drop on seam welding operation; logged for maintenance follow-up.', at: new Date(Date.now() - 1000 * 60 * 85) },
      { userName: 'Ravi Venkatesh', text: 'Confirmed with maintenance - WM-03 pressure regulator requires calibration.', at: new Date(Date.now() - 1000 * 60 * 55) },
    ],
    attachments: [
      { filename: 'WM03_pressure_log.pdf', url: '#', uploadedBy: 'Ravi Venkatesh' },
      { filename: 'defect_photo_001.jpg', url: '#', uploadedBy: 'Priya S.' },
    ],
  });
  seamPressureRow.nonConformity = nc._id;
  await entry.save();
  console.log(`Sample non-conformity seeded: ${nc.ncId}`);

  console.log('\n--- Seed complete ---');
  console.log(`Admin login:      ${adminEmail} / ${adminPassword}`);
  console.log(`Supervisor login: ravi.venkatesh@qualityos.local / Supervisor@123`);
  console.log(`Quality Manager:  lakshmi.narayan@qualityos.local / Quality@123`);
  console.log(`Auditor login:  priya.s@qualityos.local / Auditor@123`);
  console.log('---------------------\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
