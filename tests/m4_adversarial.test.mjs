import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// =========================================================================
// 1. Wearables Contract & Device Inventory Tests (Requirement R4)
// =========================================================================

test('Wearables Contract: All 5 required devices exist in DeviceConnectScreen', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  assert.ok(fs.existsSync(filePath), 'DeviceConnectScreen.jsx must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  const requiredDevices = [
    'Fitbit',
    'Apple Health',
    'Whoop',
    'Garmin',
    'Oura'
  ];

  for (const device of requiredDevices) {
    const regex = new RegExp(`name:\\s*['"\`]${device}['"\`]`, 'i');
    assert.ok(
      regex.test(content),
      `DeviceConnectScreen must contain device entry with name: '${device}'`
    );
  }
});

test('Wearables Contract: Garmin replaces Google Fit', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Must have Garmin
  assert.ok(content.includes('Garmin'), 'DeviceConnectScreen must contain Garmin');

  // Must NOT have Google Fit
  assert.ok(
    !content.toLowerCase().includes('google fit'),
    'DeviceConnectScreen must not contain Google Fit (must be replaced with Garmin)'
  );
  assert.ok(
    !content.includes("id: 'google'"),
    "DeviceConnectScreen must not contain legacy Google device ID"
  );
});

test('Wearables Contract: Each device has brand icon, subtitle, status badge, and Connect button', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify fields in data structure
  assert.ok(content.includes('subtitle:'), 'Device entries must have subtitle/feature category');
  assert.ok(content.includes('status:'), 'Device entries must have status property');
  assert.ok(content.includes('icon:'), 'Device entries must have icon property');

  // Status badges: "Ready to Sync" or "Disconnected"
  assert.ok(
    content.includes('Ready to Sync') || content.includes('Disconnected'),
    'Device cards must render status badge like "Ready to Sync" or "Disconnected"'
  );

  // Connect button interactive trigger
  assert.ok(
    content.includes('Connect') && content.includes('onClick='),
    'Device cards must have an interactive Connect button with click handler'
  );
});

// =========================================================================
// 2. Modal & Interaction Verification (Requirement R4)
// =========================================================================

test('Modal Contract: Connect button triggers "Coming soon, log manually for now" modal', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Must manage selected device or modal state
  assert.ok(
    content.includes('selectedDevice') || content.includes('activeModalDevice') || content.includes('isModalOpen'),
    'DeviceConnectScreen must maintain modal open/active state'
  );

  // Must contain the required clear notification text
  const hasComingSoonMessage = 
    content.toLowerCase().includes('coming soon, log manually for now') ||
    content.toLowerCase().includes('live sync coming soon, log manually for now');

  assert.ok(
    hasComingSoonMessage,
    'Modal must display "Coming soon, log manually for now" (or "Live sync coming soon, log manually for now through Dashboard or Quick-Log")'
  );

  // Modal must reference device name and action buttons
  assert.ok(
    content.includes('selectedDevice.name') || content.includes('{device.name}'),
    'Modal must display selected device name'
  );
  assert.ok(
    content.includes('Got It') || content.includes('Close'),
    'Modal must include a Got It or Close action button'
  );
});

test('Modal Contract: Dismissible via Escape key, backdrop click, and Close button', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Escape key handler
  assert.ok(
    content.includes('Escape') && content.includes('addEventListener'),
    'DeviceConnectScreen must register an Escape keydown event listener to close modal'
  );

  // Backdrop click dismiss
  assert.ok(
    content.includes('handleBackdropClick') || content.includes('e.target === e.currentTarget'),
    'DeviceConnectScreen must dismiss modal when clicking backdrop'
  );

  // Close button with aria-label
  assert.ok(
    content.includes('Close modal') || content.includes('setSelectedDevice(null)'),
    'DeviceConnectScreen must dismiss modal on close button click'
  );
});

test('Integrity Mandate: No fake simulated backend connections', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Ensure legacy fake simulation is completely removed
  assert.ok(
    !content.includes('setTimeout(() => {') && !content.includes('setTimeout('),
    'Must not have fake setTimeout simulation when connecting devices'
  );
  assert.ok(
    !content.includes('rhr:') && !content.includes('sleepScore:'),
    'Must not generate fake random vitals (rhr / sleepScore)'
  );
});

// =========================================================================
// 3. Routing & App Wiring Contract (Requirement R4)
// =========================================================================

test('App Routing: DeviceConnectScreen is imported and wired to case "connect"', () => {
  const filePath = path.join(projectRoot, 'src', 'App.jsx');
  assert.ok(fs.existsSync(filePath), 'App.jsx must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify import is active (not commented out)
  const importMatch = content.match(/^\s*import\s+DeviceConnectScreen\s+from\s+['"]\.\/components\/DeviceConnectScreen['"];?/m);
  assert.ok(
    importMatch,
    'App.jsx must have active uncommented import: import DeviceConnectScreen from "./components/DeviceConnectScreen";'
  );

  // Verify case 'connect' in renderScreen()
  const caseMatch = content.match(/case\s+['"]connect['"]\s*:\s*return\s*<DeviceConnectScreen/);
  assert.ok(
    caseMatch,
    'renderScreen in App.jsx must handle case "connect" and return <DeviceConnectScreen'
  );
});

test('App Routing: Sidebar includes Connect Devices navigation entry', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'Sidebar.jsx');
  assert.ok(fs.existsSync(filePath), 'Sidebar.jsx must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(
    content.includes("id: 'connect'") && content.includes("Connect Devices"),
    'Sidebar.jsx must define navigation item with id "connect" and label "Connect Devices"'
  );
});

// =========================================================================
// 4. Background Imagery & Dark Overlays Across All Major Sections (Requirement R4)
// =========================================================================

test('Visuals: Background asset public/hero-bg.jpg exists', () => {
  const bgPath = path.join(projectRoot, 'public', 'hero-bg.jpg');
  assert.ok(fs.existsSync(bgPath), 'public/hero-bg.jpg must exist');
  const stats = fs.statSync(bgPath);
  assert.ok(stats.size > 1000, 'hero-bg.jpg must be a valid image file');
});

test('Visuals: Background imagery and dark overlay classes exist across all 7 major screens', () => {
  const screens = [
    { file: 'ExerciseScreen.jsx', name: 'ExerciseScreen' },
    { file: 'StepsScreen.jsx', name: 'StepsScreen' },
    { file: 'GoalsScreen.jsx', name: 'GoalsScreen' },
    { file: 'DeviceConnectScreen.jsx', name: 'DeviceConnectScreen' },
    { file: 'DashboardScreen.jsx', name: 'DashboardScreen' },
    { file: 'FoodScreen.jsx', name: 'FoodScreen' },
    { file: 'AIAssistantScreen.jsx', name: 'AIAssistantScreen' },
  ];

  for (const screen of screens) {
    const filePath = path.join(projectRoot, 'src', 'components', screen.file);
    assert.ok(fs.existsSync(filePath), `${screen.name} must exist at ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');

    // 1. Must use hero background image
    assert.ok(
      content.includes("bg-[url('/hero-bg.jpg')]"),
      `${screen.name} must reference bg-[url('/hero-bg.jpg')]`
    );

    // 2. Must apply bg-cover and bg-center
    assert.ok(
      content.includes('bg-cover') && content.includes('bg-center'),
      `${screen.name} must include bg-cover and bg-center for background image sizing`
    );

    // 3. Must apply dark gradient/vignette overlay
    const hasDarkOverlay = 
      content.includes('from-[#09090b]') ||
      content.includes('via-[#09090b]') ||
      content.includes('bg-gradient-to');

    assert.ok(
      hasDarkOverlay,
      `${screen.name} must include dark gradient/vignette overlay for crystal clear text readability`
    );
  }
});

// =========================================================================
// 5. Aesthetic & Theme Consistency
// =========================================================================

test('Aesthetics: DeviceConnectScreen conforms to Habitly obsidian dark theme', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify dark color palette classes
  assert.ok(content.includes('bg-[#18181b]'), 'Must use zinc-900 (#18181b) cards');
  assert.ok(content.includes('border-[#27272a]'), 'Must use zinc-800 (#27272a) borders');
  assert.ok(content.includes('text-white'), 'Must use text-white headings');
  assert.ok(content.includes('text-zinc-400') || content.includes('text-zinc-500'), 'Must use zinc muted text');
  assert.ok(content.includes('bg-red-600') || content.includes('text-red-500'), 'Must use Habitly red brand accent');

  // Verify absence of outdated light mode classes
  assert.ok(!content.includes('bg-white p-4 rounded-xl'), 'Must not contain light mode white background cards');
  assert.ok(!content.includes('text-gray-800'), 'Must not contain legacy text-gray-800 classes');
  assert.ok(!content.includes('border-gray-100'), 'Must not contain legacy border-gray-100 classes');
});

// =========================================================================
// 6. Production Build Verification
// =========================================================================

test('Build Verification: Production build contains all 5 devices and "coming soon"', () => {
  const distDir = path.join(projectRoot, 'dist');
  assert.ok(fs.existsSync(distDir), 'dist directory must exist');

  const assetsDir = path.join(distDir, 'assets');
  assert.ok(fs.existsSync(assetsDir), 'dist/assets directory must exist');

  const files = fs.readdirSync(assetsDir);
  const jsBundle = files.find(f => f.endsWith('.js'));
  assert.ok(jsBundle, 'Compiled JS bundle must exist in dist/assets');

  const bundleContent = fs.readFileSync(path.join(assetsDir, jsBundle), 'utf8');

  // Verify all 5 devices are compiled into the production output
  assert.ok(bundleContent.includes('Fitbit'), 'Compiled bundle must include Fitbit');
  assert.ok(bundleContent.includes('Apple Health'), 'Compiled bundle must include Apple Health');
  assert.ok(bundleContent.includes('Whoop'), 'Compiled bundle must include Whoop');
  assert.ok(bundleContent.includes('Garmin'), 'Compiled bundle must include Garmin');
  assert.ok(bundleContent.includes('Oura'), 'Compiled bundle must include Oura');

  // Verify "coming soon" modal text is present in bundle
  assert.ok(
    bundleContent.toLowerCase().includes('coming soon, log manually for now') ||
    bundleContent.toLowerCase().includes('live sync coming soon'),
    'Compiled bundle must contain "coming soon, log manually for now"'
  );
});
