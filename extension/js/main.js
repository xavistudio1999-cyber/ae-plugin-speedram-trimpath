(function () {
  function setStatus(text) {
    var el = document.getElementById('status');
    if (el) el.textContent = text;
  }

  function callAE(command) {
    var script = 'var result = ' + command + '; result;';

    if (window.__adobe_cep__) {
      var cs = new CSInterface();
      cs.evalScript(script, function (result) {
        if (result && result !== 'undefined') {
          setStatus(result);
        } else {
          setStatus('Action complete');
        }
      });
    } else {
      setStatus('Running outside CEP. Use the JSX script in After Effects.');
    }
  }

  function bindButtons() {
    var buttons = document.querySelectorAll('[data-action]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        var action = this.getAttribute('data-action');
        switch (action) {
          case 'speedram':
            callAE('applySpeedRamp()');
            break;
          case 'trimpath':
            callAE('applyTrimPath()');
            break;
          case 'smoothflow':
            callAE('smoothMotionFlow()');
            break;
          case 'strokefill':
            callAE('applyStrokeAndFill()');
            break;
          case 'textanim':
            callAE('animateTextLayer()');
            break;
          case 'clearconsole':
            callAE('clearConsole()');
            break;
          default:
            setStatus('Unknown action');
        }
      });
    }
  }

  bindButtons();
})();
