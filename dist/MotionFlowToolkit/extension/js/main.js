(function () {
  var csInterface = null;
  var keyBindings = {};
  var lastActionTime = 0;
  var debounceTime = 300;
  var stateCheckInterval = null;

  try {
    if (window.__adobe_cep__) {
      csInterface = new CSInterface();
    }
  } catch (e) {
    console.log('CEP not available');
  }

  function setStatus(text) {
    var el = document.getElementById('status');
    if (el) el.textContent = text;
  }

  function updateButtonStateFromAE() {
    if (!csInterface) return;
    csInterface.evalScript('getSelectionState()', function (result) {
      try {
        var state = JSON.parse(result || '{}');
        var buttons = document.querySelectorAll('[data-action]');
        for (var i = 0; i < buttons.length; i++) {
          var btn = buttons[i];
          var action = btn.getAttribute('data-action');
          btn.classList.toggle('has-key', !!state[action]);
        }
      } catch (e) {
        console.log('State parse error:', e);
      }
    });
  }

  function callAE(command, actionName) {
    var now = Date.now();
    if (now - lastActionTime < debounceTime) {
      setStatus('Please wait before executing another action...');
      return;
    }
    lastActionTime = now;

    if (!csInterface) {
      setStatus('CEP interface not available');
      return;
    }

    csInterface.evalScript(command, function (result) {
      if (result && result !== 'undefined' && result !== '') {
        setStatus(result);
      } else {
        setStatus('✓ ' + (actionName || 'Action') + ' completed successfully');
      }
      updateButtonStateFromAE();
    });
  }

  function activateButton(button) {
    var allButtons = document.querySelectorAll('button[data-action]');
    for (var i = 0; i < allButtons.length; i++) {
      allButtons[i].classList.remove('active');
    }
    if (button) {
      button.classList.add('active');
      setTimeout(function () {
        button.classList.remove('active');
      }, 300);
    }
  }

  function executeAction(button) {
    var action = button.getAttribute('data-action');
    activateButton(button);
    switch (action) {
      case 'speedram':
        callAE('applySpeedRamp()', 'SpeedRam');
        break;
      case 'trimpath':
        callAE('applyTrimPath()', 'Trim Path');
        break;
      case 'smoothflow':
        callAE('smoothMotionFlow()', 'Smooth Flow');
        break;
      case 'strokefill':
        callAE('applyStrokeAndFill()', 'Stroke + Fill');
        break;
      case 'textanim':
        callAE('animateTextLayer()', 'Text Animation');
        break;
      case 'clearconsole':
        callAE('clearConsole()', 'Console');
        break;
      default:
        setStatus('Unknown action: ' + action);
    }
  }

  function bindButtons() {
    var buttons = document.querySelectorAll('[data-action]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        executeAction(this);
      });
    }
  }

  function setupKeyboardShortcuts() {
    keyBindings = {
      's': 'speedram',
      't': 'trimpath',
      'f': 'smoothflow',
      'k': 'strokefill',
      'a': 'textanim'
    };

    document.addEventListener('keydown', function (e) {
      var key = e.key.toLowerCase();
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (keyBindings[key]) {
        e.preventDefault();
        var action = keyBindings[key];
        var button = document.querySelector('[data-action="' + action + '"]');
        if (button) executeAction(button);
      }
    });
  }

  function startStateMonitoring() {
    updateButtonStateFromAE();
    if (stateCheckInterval) clearInterval(stateCheckInterval);
    stateCheckInterval = setInterval(function () {
      if (csInterface) updateButtonStateFromAE();
    }, 1000);
  }

  function init() {
    bindButtons();
    setupKeyboardShortcuts();
    startStateMonitoring();
    setStatus('MotionFlow ready - Press S, T, F, K, or A');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('unload', function () {
    if (stateCheckInterval) clearInterval(stateCheckInterval);
  });
})();
