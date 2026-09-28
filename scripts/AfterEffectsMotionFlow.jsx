function selectActiveComp() {
    var item = app.project.activeItem;
    if (!item || !(item instanceof CompItem)) {
        return null;
    }
    return item;
}

function getSelectedLayers() {
    var comp = selectActiveComp();
    if (!comp) {
        return [];
    }
    return comp.selectedLayers;
}

function clearConsole() {
    $.writeln('');
    return 'Console cleared';
}

function getLayerTarget() {
    var layers = getSelectedLayers();
    if (!layers || layers.length === 0) {
        return null;
    }
    return layers[0];
}

function applySpeedRamp() {
    var layer = getLayerTarget();
    if (!layer) {
        return 'Please select a layer.';
    }

    if (!layer.property('ADBE Time Remapping')) {
        layer.timeRemapEnabled = true;
    }

    var comp = layer.containingComp;
    var start = comp.time;
    var timeRemap = layer.property('ADBE Time Remapping');

    if (timeRemap.numKeys === 0) {
        timeRemap.setValueAtTime(start - 0.2, start - 0.2);
        timeRemap.setValueAtTime(start, start);
    }

    timeRemap.setValueAtTime(start + 0.2, start + 0.2);
    timeRemap.setValueAtTime(start + 0.7, start + 0.7);
    timeRemap.setValueAtTime(start + 1.2, start + 1.2);

    return 'SpeedRamp applied to: ' + layer.name;
}

function applyTrimPath() {
    var layer = getLayerTarget();
    if (!layer) {
        return 'Please select a layer.';
    }

    var effects = layer.property('ADBE Effect Parade');
    if (!effects) {
        return 'This layer does not support effects.';
    }

    var trimProp = null;
    for (var i = 1; i <= effects.numProperties; i++) {
        if (effects.property(i).matchName === 'ADBE Trim Paths') {
            trimProp = effects.property(i);
            break;
        }
    }

    if (!trimProp) {
        trimProp = effects.addProperty('ADBE Trim Paths');
    }

    if (trimProp.property('Start')) {
        trimProp.property('Start').setValue(0);
    }

    if (trimProp.property('End')) {
        trimProp.property('End').setValue(100);
    }

    return 'Trim Path added to: ' + layer.name;
}

function smoothMotionFlow() {
    var layers = getSelectedLayers();
    if (!layers || layers.length === 0) {
        return 'Please select at least one layer.';
    }

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var props = layer.properties;
        for (var j = 1; j <= props.length; j++) {
            var prop = props[j];
            if (prop.numKeys > 1 && prop.propertyType === PropertyType.SHAPE) {
                // allow only transform-like values
            }
            if (prop.numKeys > 1 && prop.canSetTemporalEaseAtKey) {
                for (var k = 1; k <= prop.numKeys; k++) {
                    var inEase = new KeyframeEase(60, 90);
                    var outEase = new KeyframeEase(60, 90);
                    prop.setTemporalEaseAtKey(k, [inEase], [outEase]);
                }
            }
        }
    }

    return 'Smooth motion flow applied';
}

function applyStrokeAndFill() {
    var layer = getLayerTarget();
    if (!layer) {
        return 'Please select a layer.';
    }

    var effects = layer.property('ADBE Effect Parade');
    if (!effects) {
        return 'This layer does not support effects.';
    }

    var hasStroke = false;
    var hasFill = false;

    for (var i = 1; i <= effects.numProperties; i++) {
        var effect = effects.property(i);
        if (effect.matchName === 'ADBE Stroke') {
            hasStroke = true;
        }
        if (effect.matchName === 'ADBE Fill') {
            hasFill = true;
        }
    }

    if (!hasStroke) {
        effects.addProperty('ADBE Stroke');
    }

    if (!hasFill) {
        effects.addProperty('ADBE Fill');
    }

    return 'Stroke + Fill added to: ' + layer.name;
}

function animateTextLayer() {
    var layer = getLayerTarget();
    if (!layer) {
        return 'Please select a text layer.';
    }

    if (!(layer instanceof TextLayer)) {
        return 'The selected layer is not a text layer.';
    }

    var textDoc = layer.property('ADBE Text Properties').property('ADBE Text Document');
    var comp = layer.containingComp;
    var currentTime = comp.time;

    textDoc.setValueAtTime(currentTime, textDoc.value);
    textDoc.setValueAtTime(currentTime + 0.4, 'Motion Flow');
    textDoc.setValueAtTime(currentTime + 0.8, 'Trim Path');

    var position = layer.position;
    position.setValueAtTime(currentTime, [0, 0, 0]);
    position.setValueAtTime(currentTime + 0.8, [100, 0, 0]);

    return 'Text animation generated for: ' + layer.name;
}
