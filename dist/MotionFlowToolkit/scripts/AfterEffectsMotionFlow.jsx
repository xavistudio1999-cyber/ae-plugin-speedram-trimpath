// MotionFlow Toolkit - Universal After Effects Script
function selectActiveComp() {
    if (app && app.project && app.project.activeItem) {
        var item = app.project.activeItem;
        if (item instanceof CompItem) return item;
    }
    return null;
}

function getSelectedLayers() {
    var comp = selectActiveComp();
    if (!comp) return [];
    return comp.selectedLayers;
}

function clearConsole() {
    $.writeln('');
    return 'Console cleared';
}

function getLayerTarget() {
    var layers = getSelectedLayers();
    if (!layers || layers.length === 0) return null;
    return layers[0];
}

function getSelectionState() {
    var result = {
        speedram: false,
        trimpath: false,
        smoothflow: false,
        strokefill: false,
        textanim: false
    };

    try {
        var comp = selectActiveComp();
        if (!comp) return JSON.stringify(result);
        var layers = getSelectedLayers();
        if (!layers || layers.length === 0) return JSON.stringify(result);
        var layer = layers[0];

        try {
            var timeRemap = layer.property('Time Remap');
            if (timeRemap && timeRemap.numKeys > 0) result.speedram = true;
        } catch (e) {}

        try {
            var effects = layer.property('ADBE Effect Parade');
            if (effects && effects.numProperties > 0) {
                for (var i = 1; i <= effects.numProperties; i++) {
                    var effect = effects.property(i);
                    if (effect && effect.matchName === 'ADBE Trim Paths') {
                        result.trimpath = true;
                        break;
                    }
                }
            }
        } catch (e) {}

        try {
            var transformProps = ['Position','Scale','Rotation','Anchor Point','Opacity'];
            for (var j = 0; j < transformProps.length; j++) {
                try {
                    var prop = layer.property(transformProps[j]);
                    if (prop && prop.numKeys > 0) {
                        result.smoothflow = true;
                        break;
                    }
                } catch (e) {}
            }
        } catch (e) {}

        try {
            if (layer instanceof TextLayer) result.textanim = true;
        } catch (e) {}

        try {
            var effectList = layer.property('ADBE Effect Parade');
            if (effectList && effectList.numProperties > 0) {
                for (var k = 1; k <= effectList.numProperties; k++) {
                    var eff = effectList.property(k);
                    if (eff && (eff.matchName === 'ADBE Fill' || eff.matchName === 'ADBE Stroke')) {
                        result.strokefill = true;
                        break;
                    }
                }
            }
        } catch (e) {}
    } catch (e) {}

    return JSON.stringify(result);
}

function applySpeedRamp() {
    var layer = getLayerTarget();
    if (!layer) return 'Error: Please select a layer';
    try {
        var comp = layer.containingComp;
        if (!comp) return 'Error: Layer must be in a composition';
        layer.timeRemapEnabled = true;
        var timeRemap = layer.property('Time Remap');
        if (!timeRemap) return 'Error: Could not access Time Remap property';
        var currentTime = comp.time;
        if (timeRemap.numKeys === 0) timeRemap.setValueAtTime(currentTime, currentTime);
        timeRemap.setValueAtTime(currentTime + 0.2, currentTime + 0.1);
        timeRemap.setValueAtTime(currentTime + 0.5, currentTime + 0.3);
        timeRemap.setValueAtTime(currentTime + 1.0, currentTime + 0.8);
        return 'SpeedRamp applied to: ' + layer.name;
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

function applyTrimPath() {
    var layer = getLayerTarget();
    if (!layer) return 'Error: Please select a layer';
    try {
        var effect = layer.Effects.addProperty('ADBE Trim Paths');
        if (effect) {
            effect.property('ADBE Trim Paths-0001').setValue(0);
            effect.property('ADBE Trim Paths-0002').setValue(100);
            effect.property('ADBE Trim Paths-0003').setValue(0);
            return 'Trim Paths added to: ' + layer.name;
        }
        return 'Error: Trim Paths effect not available';
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

function smoothMotionFlow() {
    var layers = getSelectedLayers();
    if (!layers || layers.length === 0) return 'Error: Please select at least one layer';
    try {
        var count = 0;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            var transformProps = ['Anchor Point','Position','Scale','Rotation','Opacity'];
            for (var p = 0; p < transformProps.length; p++) {
                try {
                    var prop = layer.property(transformProps[p]);
                    if (prop && prop.numKeys > 1) {
                        for (var k = 1; k <= prop.numKeys; k++) {
                            try {
                                var inEase = new KeyframeEase(50, 33.33);
                                var outEase = new KeyframeEase(50, 33.33);
                                prop.setTemporalEaseAtKey(k, [inEase], [outEase]);
                                count++;
                            } catch (e) {}
                        }
                    }
                } catch (e) {}
            }
        }
        return 'Smooth Flow applied to ' + count + ' keyframes';
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

function applyStrokeAndFill() {
    var layer = getLayerTarget();
    if (!layer) return 'Error: Please select a layer';
    try {
        var added = [];
        try {
            layer.Effects.addProperty('ADBE Fill');
            added.push('Fill');
        } catch (e) {}
        try {
            layer.Effects.addProperty('ADBE Stroke');
            added.push('Stroke');
        } catch (e) {}
        if (added.length > 0) return added.join(' + ') + ' added to: ' + layer.name;
        return 'Error: Could not add effects to this layer';
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

function animateTextLayer() {
    var layer = getLayerTarget();
    if (!layer) return 'Error: Please select a layer';
    try {
        if (!(layer instanceof TextLayer)) return 'Error: Selected layer is not a text layer';
        var comp = layer.containingComp;
        var currentTime = comp.time;
        var textProp = layer.property('Text');
        if (!textProp) textProp = layer.property('Source Text');
        if (!textProp) return 'Error: Could not access text property';
        var texts = [textProp.value, 'Motion', 'Flow', textProp.value];
        for (var t = 0; t < texts.length; t++) {
            textProp.setValueAtTime(currentTime + (t * 0.3), texts[t]);
        }
        var opacityProp = layer.property('Opacity');
        if (opacityProp) {
            opacityProp.setValueAtTime(currentTime, 0);
            opacityProp.setValueAtTime(currentTime + 0.2, 100);
            opacityProp.setValueAtTime(currentTime + 0.9, 100);
            opacityProp.setValueAtTime(currentTime + 1.2, 0);
        }
        return 'Text animation created on: ' + layer.name;
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

if (!app.project) {
    alert('MotionFlow: Please run this script inside After Effects');
}
