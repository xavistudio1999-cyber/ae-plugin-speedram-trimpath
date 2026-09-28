(function () {
  var csInterface = null;
  var keyBindings = {};
  var lastActionTime = 0;
  var debounceTime = 300; // ms
  var stateCheckInterval = null;

  // Initialize CEP interface
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
      // Update button states after action
      updateButtonStateFromAE();
    });
  }

  function activateButton(button) {
    // Remove active state from all buttons
    var allButtons = document.querySelectorAll('button[data-action]');
    for (var i = 0; i < allButtons.length; i++) {
      allButtons[i].classList.remove('active');
    }
    
    // Add active state to clicked button
    if (button) {
      button.classList.add('active');
      setTimeout(function () {
        button.classList.remove('active');
      }, 300);
    }
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
          
          if (state[action]) {
            btn.classList.add('has-key');
          } else {
            btn.classList.remove('has-key');
          }
        }
        
        setStatus('✓ Button states updated - ' + Object.keys(state).filter(function(k) { return state[k]; }).length + ' actions available');
      } catch (e) {
        console.log('State parse error:', e);
        setStatus('Ready');
      }
    });
  }

  function bindButtons() {
    var buttons = document.querySelectorAll('[data-action]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', (function(btn) {
        return function() {
          executeAction(btn);
        };
      })(buttons[i]));
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
      
      // Only trigger if not typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (keyBindings[key]) {
        e.preventDefault();
        var action = keyBindings[key];
        var button = document.querySelector('[data-action="' + action + '"]');
        
        if (button) {
          executeAction(button);
        }
      }
    });
  }

  function startStateMonitoring() {
    // Check state immediately
    updateButtonStateFromAE();
    
    // Check state every 1 second to detect layer changes
    if (stateCheckInterval) clearInterval(stateCheckInterval);
    stateCheckInterval = setInterval(function () {
      if (csInterface) {
        updateButtonStateFromAE();
      }
    }, 1000);
  }

  function init() {
    bindButtons();
    setupKeyboardShortcuts();
    startStateMonitoring();
    setStatus('MotionFlow initializing - Press S, T, F, K, or A');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on unload
  window.addEventListener('unload', function () {
    if (stateCheckInterval) clearInterval(stateCheckInterval);
  });
})();