import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// =========================================================================
// Adversarial Reviewer 2 Test Suite: Milestone 4 (Visuals & Wearables Screen)
// =========================================================================

test('Adversarial 1: Integrity Check - No hardcoded bypasses or fake vitals', () => {
  const deviceConnectPath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(deviceConnectPath, 'utf8');

  // Verify no fake setTimeout simulation simulating a fake sync
  assert.ok(!content.includes('setTimeout'), 'Must not have fake timeouts simulating sync');
  assert.ok(!content.includes('rhr:'), 'Must not contain fake rhr vitals generator');
  assert.ok(!content.includes('sleepScore:'), 'Must not contain fake sleepScore generator');

  // Verify no dummy facade: R4 specifically requires a "coming soon, log manually for now" message
  assert.ok(
    content.includes('Coming soon, log manually for now') ||
    content.includes('coming soon, log manually for now'),
    'Must explicitly communicate Coming soon, log manually for now'
  );
});

test('Adversarial 2: Exact Wearable Device Specifications & Metadata Completeness', () => {
  const deviceConnectPath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(deviceConnectPath, 'utf8');

  // Extract WEARABLE_DEVICES definition via string analysis
  const requiredDevices = [
    { id: 'fitbit', name: 'Fitbit' },
    { id: 'apple', name: 'Apple Health' },
    { id: 'whoop', name: 'Whoop' },
    { id: 'garmin', name: 'Garmin' },
    { id: 'oura', name: 'Oura' }
  ];

  for (const { id, name } of requiredDevices) {
    assert.ok(content.includes(`id: '${id}'`), `Must contain device id '${id}'`);
    assert.ok(content.includes(`name: '${name}'`), `Must contain device name '${name}'`);
  }

  // Ensure legacy Google device is not present
  assert.ok(!content.includes("id: 'google'"), 'Legacy google device ID must not exist');
  assert.ok(!content.toLowerCase().includes('google fit'), 'Google Fit must not exist');
});

test('Adversarial 3: Component Props Defensiveness - Graceful handling of undefined callbacks', () => {
  const deviceConnectPath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(deviceConnectPath, 'utf8');

  // Check default parameter for component props
  assert.ok(
    content.includes('export default function DeviceConnectScreen({ onNavigate, onBack } = {})'),
    'DeviceConnectScreen should have a default empty object for props destructuring to prevent crash if rendered without props'
  );

  // Check defensive guard on onNavigate
  assert.ok(
    content.includes('{onNavigate && (') || content.includes('if (onNavigate)'),
    'Log Manually button or action should be safely guarded when onNavigate is not supplied'
  );

  // Check defensive guard on onBack
  assert.ok(
    content.includes('{onBack && ('),
    'Back button should be conditionally rendered only if onBack is provided'
  );
});

test('Adversarial 4: Modal Accessibility & State Flow Mechanics', () => {
  const deviceConnectPath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(deviceConnectPath, 'utf8');

  // ARIA attributes
  assert.ok(content.includes('role="dialog"'), 'Modal must have role="dialog"');
  assert.ok(content.includes('aria-modal="true"'), 'Modal must have aria-modal="true"');
  assert.ok(content.includes('aria-labelledby="device-modal-title"'), 'Modal must have aria-labelledby');
  assert.ok(content.includes('id="device-modal-title"'), 'Title must match aria-labelledby id');
  assert.ok(content.includes('aria-label="Close modal"'), 'Close button must have aria-label');

  // Event propagation prevention on dialog inner container
  assert.ok(
    content.includes('e.stopPropagation()'),
    'Clicking inside the modal content must call e.stopPropagation() to prevent accidental dismissal'
  );

  // Backdrop click check
  assert.ok(
    content.includes('e.target === e.currentTarget'),
    'Backdrop dismiss must verify e.target === e.currentTarget'
  );

  // Escape listener cleanup
  assert.ok(
    content.includes("window.removeEventListener('keydown', handleKeyDown)"),
    'Must properly clean up window keydown listener in useEffect return callback'
  );
});

test('Adversarial 5: App Routing Conformance and Navigation Pipeline', () => {
  const appPath = path.join(projectRoot, 'src', 'App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  const sidebarPath = path.join(projectRoot, 'src', 'components', 'Sidebar.jsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

  // Sidebar item check
  assert.ok(sidebarContent.includes("id: 'connect'"), 'Sidebar must have nav item with id "connect"');
  assert.ok(sidebarContent.includes("'Connect Devices'"), 'Sidebar item label must be "Connect Devices"');
  assert.ok(sidebarContent.includes("Watch"), 'Sidebar item must use Watch icon');

  // App.jsx route check
  assert.ok(
    appContent.includes("case 'connect':"),
    'App.jsx must have a case for "connect"'
  );
  assert.ok(
    appContent.includes("<DeviceConnectScreen onNavigate={setCurrentView} />"),
    'App.jsx must mount DeviceConnectScreen with onNavigate={setCurrentView}'
  );
});

test('Adversarial 6: Visuals & Contrast Hierarchy on All Major Sections', () => {
  const screens = [
    { name: 'ExerciseScreen', file: 'src/components/ExerciseScreen.jsx' },
    { name: 'StepsScreen', file: 'src/components/StepsScreen.jsx' },
    { name: 'GoalsScreen', file: 'src/components/GoalsScreen.jsx' },
    { name: 'DeviceConnectScreen', file: 'src/components/DeviceConnectScreen.jsx' },
    { name: 'DashboardScreen', file: 'src/components/DashboardScreen.jsx' },
    { name: 'FoodScreen', file: 'src/components/FoodScreen.jsx' },
    { name: 'AIAssistantScreen', file: 'src/components/AIAssistantScreen.jsx' }
  ];

  for (const { name, file } of screens) {
    const fullPath = path.join(projectRoot, file);
    assert.ok(fs.existsSync(fullPath), `${name} must exist`);
    const code = fs.readFileSync(fullPath, 'utf8');

    // Check background image path
    assert.ok(
      code.includes("bg-[url('/hero-bg.jpg')]"),
      `${name} must reference the shared fitness background asset`
    );

    // Check dark overlay gradient
    assert.ok(
      code.includes('bg-gradient-to') || code.includes('from-[#09090b]'),
      `${name} must have dark gradient overlay`
    );

    // Check text contrast (white or light zinc text on dark overlay)
    assert.ok(
      code.includes('text-white'),
      `${name} must render heading in high-contrast text-white`
    );
  }
});

test('Adversarial 7: Production Asset Integrity - hero-bg.jpg and logo.jpg', () => {
  const heroPath = path.join(projectRoot, 'public', 'hero-bg.jpg');
  assert.ok(fs.existsSync(heroPath), 'public/hero-bg.jpg must exist');
  const heroStat = fs.statSync(heroPath);
  assert.ok(heroStat.size > 10000, 'hero-bg.jpg must be non-trivial image file');

  const logoPath = path.join(projectRoot, 'public', 'logo.jpg');
  assert.ok(fs.existsSync(logoPath), 'public/logo.jpg must exist');
  const logoStat = fs.statSync(logoPath);
  assert.ok(logoStat.size > 10000, 'logo.jpg must be non-trivial image file');
});
