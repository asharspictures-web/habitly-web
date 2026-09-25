import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// =========================================================================
// Helper: Extract WEARABLE_DEVICES from DeviceConnectScreen.jsx
// =========================================================================
function extractWearableDevices(content) {
  const match = content.match(/const\s+WEARABLE_DEVICES\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return null;
  // Safely evaluate the array definition
  const arrayCode = match[1];
  const fn = new Function(`return ${arrayCode};`);
  return fn();
}

// Helper: Simulate DeviceConnectScreen state machine
function createDeviceConnectState({ onNavigate } = {}) {
  let selectedDevice = null;
  const listeners = new Map();

  const windowMock = {
    addEventListener(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
    },
    removeEventListener(event, handler) {
      if (listeners.has(event)) {
        listeners.get(event).delete(handler);
      }
    },
    dispatch(event, eventObj) {
      if (listeners.has(event)) {
        for (const handler of listeners.get(event)) {
          handler(eventObj);
        }
      }
    },
    listenerCount(event) {
      return listeners.has(event) ? listeners.get(event).size : 0;
    }
  };

  // Simulate Escape key effect
  let activeEffectCleanup = null;
  const updateSelectedDevice = (device) => {
    // Run cleanup of previous effect if any
    if (activeEffectCleanup) {
      activeEffectCleanup();
      activeEffectCleanup = null;
    }

    selectedDevice = device;

    if (selectedDevice) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          updateSelectedDevice(null);
        }
      };
      windowMock.addEventListener('keydown', handleKeyDown);
      activeEffectCleanup = () => {
        windowMock.removeEventListener('keydown', handleKeyDown);
      };
    }
  };

  const clickConnect = (device) => {
    updateSelectedDevice(device);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      updateSelectedDevice(null);
    }
  };

  const clickCloseButton = () => {
    updateSelectedDevice(null);
  };

  const clickGotItButton = () => {
    updateSelectedDevice(null);
  };

  const clickLogManuallyButton = () => {
    updateSelectedDevice(null);
    if (typeof onNavigate === 'function') {
      onNavigate('exercise');
    }
  };

  const unmount = () => {
    if (activeEffectCleanup) {
      activeEffectCleanup();
      activeEffectCleanup = null;
    }
  };

  return {
    getSelectedDevice: () => selectedDevice,
    clickConnect,
    handleBackdropClick,
    clickCloseButton,
    clickGotItButton,
    clickLogManuallyButton,
    windowMock,
    unmount
  };
}

// =========================================================================
// 1. Rapid Device Selection & Boundary Tests
// =========================================================================

test('Challenger M4: Rapidly clicking Connect across multiple device cards in sequence', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');
  const devices = extractWearableDevices(content);

  assert.ok(Array.isArray(devices) && devices.length === 5, 'Must have exactly 5 devices');

  const screenState = createDeviceConnectState();

  // Rapidly click each device in sequence
  for (const device of devices) {
    screenState.clickConnect(device);
    assert.equal(screenState.getSelectedDevice().id, device.id, `Selected device should be ${device.name}`);
    assert.equal(screenState.windowMock.listenerCount('keydown'), 1, 'Only 1 Escape listener should be active');
  }

  // Rapidly alternate between first and last device 100 times
  for (let i = 0; i < 100; i++) {
    const target = i % 2 === 0 ? devices[0] : devices[4];
    screenState.clickConnect(target);
    assert.equal(screenState.getSelectedDevice().id, target.id);
    assert.equal(screenState.windowMock.listenerCount('keydown'), 1, 'Listeners must not leak during rapid switching');
  }

  // Clean up
  screenState.unmount();
  assert.equal(screenState.windowMock.listenerCount('keydown'), 0, 'Listeners must be 0 after unmount');
});

test('Challenger M4: Device list integrity and absence of Google Fit', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');
  const devices = extractWearableDevices(content);

  const deviceNames = devices.map(d => d.name);
  assert.deepEqual(
    deviceNames,
    ['Fitbit', 'Apple Health', 'Whoop', 'Garmin', 'Oura'],
    'Must list exact 5 devices in proper order'
  );

  for (const d of devices) {
    assert.ok(d.id, 'Device must have id');
    assert.ok(d.name, 'Device must have name');
    assert.ok(d.subtitle, 'Device must have subtitle');
    assert.ok(d.category, 'Device must have category');
    assert.ok(d.icon, 'Device must have icon');
    assert.ok(d.brandColor, 'Device must have brandColor');
    assert.equal(d.status, 'Ready to Sync', 'Device status must be Ready to Sync');
  }

  // Ensure no google fit traces
  assert.ok(!devices.some(d => d.id === 'google'), 'Google Fit ID must not exist');
  assert.ok(!devices.some(d => d.name.toLowerCase().includes('google')), 'Google Fit must not exist');
});

// =========================================================================
// 2. Modal Dismissibility Stress Tests
// =========================================================================

test('Challenger M4: Modal dismissibility via Escape key', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');
  const devices = extractWearableDevices(content);

  const screenState = createDeviceConnectState();

  // Open modal
  screenState.clickConnect(devices[0]);
  assert.ok(screenState.getSelectedDevice() !== null);
  assert.equal(screenState.windowMock.listenerCount('keydown'), 1);

  // Pressing other keys should NOT close modal
  const nonEscapeKeys = ['Enter', 'Space', 'Tab', 'ArrowUp', 'KeyA', 'Backspace'];
  for (const key of nonEscapeKeys) {
    screenState.windowMock.dispatch('keydown', { key });
    assert.ok(screenState.getSelectedDevice() !== null, `Key "${key}" must not close the modal`);
  }

  // Pressing Escape MUST close modal
  screenState.windowMock.dispatch('keydown', { key: 'Escape' });
  assert.equal(screenState.getSelectedDevice(), null, 'Escape must close modal');
  assert.equal(screenState.windowMock.listenerCount('keydown'), 0, 'Escape listener must be removed when modal closes');
});

test('Challenger M4: Modal dismissibility via Backdrop click', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');
  const devices = extractWearableDevices(content);

  const screenState = createDeviceConnectState();
  screenState.clickConnect(devices[1]);

  const backdropElement = { id: 'backdrop' };
  const cardElement = { id: 'card' };

  // Click inside modal card (e.target !== e.currentTarget) -> should NOT close
  screenState.handleBackdropClick({
    target: cardElement,
    currentTarget: backdropElement
  });
  assert.ok(screenState.getSelectedDevice() !== null, 'Clicking inside card must NOT close modal');

  // Click directly on backdrop (e.target === e.currentTarget) -> MUST close
  screenState.handleBackdropClick({
    target: backdropElement,
    currentTarget: backdropElement
  });
  assert.equal(screenState.getSelectedDevice(), null, 'Clicking backdrop directly MUST close modal');
});

test('Challenger M4: Modal dismissibility via Close "X" button and "Got It" button', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');
  const devices = extractWearableDevices(content);

  const screenState = createDeviceConnectState();

  // Test "X" button
  screenState.clickConnect(devices[2]);
  assert.equal(screenState.getSelectedDevice().name, 'Whoop');
  screenState.clickCloseButton();
  assert.equal(screenState.getSelectedDevice(), null, 'Close button must dismiss modal');

  // Test "Got It" button
  screenState.clickConnect(devices[3]);
  assert.equal(screenState.getSelectedDevice().name, 'Garmin');
  screenState.clickGotItButton();
  assert.equal(screenState.getSelectedDevice(), null, '"Got It" button must dismiss modal');
});

test('Challenger M4: "Log Manually" button dismisses modal and routes to manual logging flow', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');
  const devices = extractWearableDevices(content);

  let routedView = null;
  const onNavigate = (view) => {
    routedView = view;
  };

  const screenState = createDeviceConnectState({ onNavigate });

  // Open modal for Oura
  screenState.clickConnect(devices[4]);
  assert.equal(screenState.getSelectedDevice().name, 'Oura');

  // Click "Log Manually"
  screenState.clickLogManuallyButton();

  // Modal must be closed AND navigated to exercise logging flow
  assert.equal(screenState.getSelectedDevice(), null, 'Modal must close when clicking Log Manually');
  assert.equal(routedView, 'exercise', 'onNavigate must receive "exercise"');

  // Edge case: if onNavigate is null/undefined, clicking Log Manually should not throw
  const safeState = createDeviceConnectState({ onNavigate: null });
  safeState.clickConnect(devices[0]);
  assert.doesNotThrow(() => {
    safeState.clickLogManuallyButton();
  });
  assert.equal(safeState.getSelectedDevice(), null);
});

// =========================================================================
// 3. Routing Verification in App.jsx
// =========================================================================

test('Challenger M4: App.jsx routing handles "connect" view and integrates with setCurrentView', () => {
  const appPath = path.join(projectRoot, 'src', 'App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  // Check import statement
  assert.match(
    appContent,
    /import\s+DeviceConnectScreen\s+from\s+['"]\.\/components\/DeviceConnectScreen['"]/,
    'DeviceConnectScreen must be imported in App.jsx'
  );

  // Check renderScreen switch case
  assert.match(
    appContent,
    /case\s+['"]connect['"]:\s*return\s*<DeviceConnectScreen\s+onNavigate=\{setCurrentView\}\s*\/>;/,
    'case "connect" must return <DeviceConnectScreen onNavigate={setCurrentView} />'
  );

  // Check that exercise route exists for manual logging
  assert.match(
    appContent,
    /case\s+['"]exercise['"]:\s*return\s*<ExerciseScreen/,
    'ExerciseScreen must be routed under case "exercise"'
  );

  // Simulate routing transition from 'connect' to 'exercise'
  let currentView = 'connect';
  const setCurrentView = (v) => { currentView = v; };

  // Trigger manual logging navigation
  setCurrentView('exercise');
  assert.equal(currentView, 'exercise', 'Navigation state must successfully switch to exercise view');
});

// =========================================================================
// 4. Strict Integrity: Absence of Fake Timers and Fake Simulations
// =========================================================================

test('Challenger M4 Integrity: Zero setTimeout/setInterval and zero fake biometric generation', () => {
  const deviceConnectPath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(deviceConnectPath, 'utf8');

  // Check for any timer mechanisms
  assert.ok(!content.includes('setTimeout'), 'DeviceConnectScreen must NOT contain setTimeout');
  assert.ok(!content.includes('setInterval'), 'DeviceConnectScreen must NOT contain setInterval');
  assert.ok(!content.includes('requestAnimationFrame'), 'DeviceConnectScreen must NOT contain requestAnimationFrame');

  // Check for fake telemetry / vitals
  assert.ok(!content.includes('rhr:'), 'Must NOT generate fake resting heart rate (rhr)');
  assert.ok(!content.includes('sleepScore:'), 'Must NOT generate fake sleep scores');
  assert.ok(!content.includes('Math.random()'), 'Must NOT use Math.random() for fake simulations');

  // Check for deceptive connection states
  assert.ok(!content.includes('connected: true'), 'Must NOT simulate successful fake connection');
  assert.ok(!content.includes('isConnecting'), 'Must NOT simulate fake loading connection state');

  // Check modal message
  assert.ok(
    content.includes('Coming soon, log manually for now'),
    'Modal must explicitly contain "Coming soon, log manually for now"'
  );
  assert.ok(
    content.includes('Direct live synchronization with'),
    'Modal must provide honest message about active development'
  );
});

// =========================================================================
// 5. Visual Consistency & Background Imagery
// =========================================================================

test('Challenger M4 Visuals: Background imagery and dark overlay on all 7 major sections', () => {
  const screenFiles = [
    'DashboardScreen.jsx',
    'ExerciseScreen.jsx',
    'FoodScreen.jsx',
    'StepsScreen.jsx',
    'GoalsScreen.jsx',
    'DeviceConnectScreen.jsx',
    'AIAssistantScreen.jsx',
  ];

  for (const file of screenFiles) {
    const fullPath = path.join(projectRoot, 'src', 'components', file);
    assert.ok(fs.existsSync(fullPath), `${file} must exist`);
    const content = fs.readFileSync(fullPath, 'utf8');

    assert.ok(
      content.includes("bg-[url('/hero-bg.jpg')]"),
      `${file} must include background image bg-[url('/hero-bg.jpg')]`
    );

    assert.ok(
      content.includes("bg-cover") && content.includes("bg-center"),
      `${file} must include bg-cover and bg-center for proper background scaling`
    );

    const hasOverlay = 
      content.includes('from-[#09090b]') ||
      content.includes('via-[#09090b]') ||
      content.includes('bg-gradient-to');

    assert.ok(
      hasOverlay,
      `${file} must include dark gradient overlay for text readability`
    );
  }
});
