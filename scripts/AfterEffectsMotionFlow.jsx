// MotionFlow Toolkit - Universal After Effects Script
// Compatible with AE CC 2014 (14.0) through latest versions

// Global utility functions
function selectActiveComp() {
    if (app && app.project && app.project.activeItem) {
        var item = app.project.activeItem;
        if (item instanceof CompItem) {
            return item;
        }
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

// Helper to safely get property
function getSafeProperty(layer, propName) {
    try {
        return layer.property(propName);
    } catch (e) {
        return null;
    }
}

// Get selection state for UI button highlighting
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
        if (!layer) return JSON.stringify(result);

        // Check if layer has Time Remapping
        try {
            var timeRemap = layer.property('Time Remap');
            if (timeRemap && timeRemap.numKeys > 0) {
                result.speedram = true;
            }
        } catch (e) {}

        // Check if layer has Trim Paths effect
        try {
            var effects = layer.property('ADBE Effect Parade');
            if (effects && effects.numProperties > 0) {
                for (var i = 1; i <= effects.numProperties; i++) {
                    var effect = effects.property(i);
                    if (effect.matchName && effect.matchName === 'ADBE Trim Paths') {
                        result.trimpath = true;
                        break;
                    }
                }
            }
        } catch (e) {}

        // Check if layer has keyframes on transform properties
        try {
            var transformProps = ['Position', 'Scale', 'Rotation', 'Anchor Point', 'Opacity'];
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

        // Check if layer is text layer
        try {
            if (layer instanceof TextLayer) {
                result.textanim = true;
            }
        } catch (e) {}

        // Check if layer has Fill or Stroke effects
        try {
            var effects = layer.property('ADBE Effect Parade');
            if (effects && effects.numProperties > 0) {
                for (var k = 1; k <= effects.numProperties; k++) {
                    var eff = effects.property(k);
                    if (eff.matchName && (eff.matchName === 'ADBE Fill' || eff.matchName === 'ADBE Stroke')) {
                        result.strokefill = true;
                        break;
                    }
                }
            }
        } catch (e) {}

    } catch (e) {}

    return JSON.stringify(result);
}

// Apply Time Remapping Speed Ramp
function applySpeedRamp() {
    var layer = getLayerTarget();
    if (!layer) return 'Error: Please select a layer';

    try {
        var comp = layer.containingComp;
        if (!comp) return 'Error: Layer must be in a composition';

        // Enable time remapping
        layer.timeRemapEnabled = true;
        
        var timeRemap = getSafeProperty(layer, 'Time Remap');
        if (!timeRemap) {
            return 'Error: Could not access Time Remap property';
        }

        var currentTime = comp.time;
        var duration = 1.0; // seconds

        // Create speed ramp keyframes
        if (timeRemap.numKeys === 0) {
            timeRemap.setValueAtTime(currentTime, currentTime);
        }
        
        timeRemap.setValueAtTime(currentTime + 0.2, currentTime + 0.1);
        timeRemap.setValueAtTime(currentTime + 0.5, currentTime + 0.3);
        timeRemap.setValueAtTime(currentTime + duration, currentTime + 0.8);

        return 'SpeedRamp applied to: ' + layer.name;
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

// Apply Trim Paths effect
function applyTrimPath() {
    var layer = getLayerTarget();
    if (!layer) return 'Error: Please select a layer';

    try {
        // Add Trim Paths effect
        var effect = layer.Effects.addProperty('ADBE Trim Paths');
        
        if (effect) {
            // Set default values
            effect.property('ADBE Trim Paths-0001').setValue(0);     // Start
            effect.property('ADBE Trim Paths-0002').setValue(100);   // End
            effect.property('ADBE Trim Paths-0003').setValue(0);     // Offset
            
            return 'Trim Paths added to: ' + layer.name;
        } else {
            return 'Error: Trim Paths effect not available';
        }
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

// Smooth motion flow with easing
function smoothMotionFlow() {
    var layers = getSelectedLayers();
    if (!layers || layers.length === 0) {
        return 'Error: Please select at least one layer';
    }

    try {
        var smoothedCount = 0;
        
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            
            // Process transform properties
            var transformProps = [
                'Anchor Point',
                'Position',
                'Scale',
                'Rotation',
                'Opacity'
            ];
            
            for (var p = 0; p < transformProps.length; p++) {
                try {
                    var prop = layer.property(transformProps[p]);
                    if (prop && prop.numKeys > 1) {
                        // Apply ease to keyframes
                        for (var k = 1; k <= prop.numKeys; k++) {
                            try {
                                var inEase = new KeyframeEase(50, 33.33);
                                var outEase = new KeyframeEase(50, 33.33);
                                prop.setTemporalEaseAtKey(k, [inEase], [outEase]);
                                smoothedCount++;
                            } catch (e) {
                                // Skip if easing not supported for this keyframe
                            }
                        }
                    }
                } catch (e) {
                    // Property not available, continue
                }
            }
        }
        
        return 'Smooth Flow applied to ' + smoothedCount + ' keyframes';
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

// Apply Stroke and Fill effects
function applyStrokeAndFill() {
    var layer = getLayerTarget();
    if (!layer) return 'Error: Please select a layer';

    try {
        var addedEffects = [];
        
        // Try to add Fill effect
        try {
            layer.Effects.addProperty('ADBE Fill');
            addedEffects.push('Fill');
        } catch (e) {
            // Fill not available
        }
        
        // Try to add Stroke effect
        try {
            layer.Effects.addProperty('ADBE Stroke');
            addedEffects.push('Stroke');
        } catch (e) {
            // Stroke not available
        }
        
        if (addedEffects.length > 0) {
            return addedEffects.join(' + ') + ' added to: ' + layer.name;
        } else {
            return 'Error: Could not add effects to this layer';
        }
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

// Animate text layer
function animateTextLayer() {
    var layer = getLayerTarget();
    if (!layer) return 'Error: Please select a layer';

    try {
        if (!(layer instanceof TextLayer)) {
            return 'Error: Selected layer is not a text layer';
        }

        var comp = layer.containingComp;
        var currentTime = comp.time;
        var stepDuration = 0.3;

        // Get text property
        var textProp = layer.property('Text');
        if (!textProp) {
            textProp = layer.property('Source Text');
        }
        
        if (!textProp) {
            return 'Error: Could not access text property';
        }

        // Create text animation keyframes
        var texts = [
            textProp.value,
            'Motion',
            'Flow',
            textProp.value
        ];

        for (var t = 0; t < texts.length; t++) {
            textProp.setValueAtTime(currentTime + (t * stepDuration), texts[t]);
        }

        // Animate opacity for entrance
        var opacityProp = layer.property('Opacity');
        if (opacityProp) {
            opacityProp.setValueAtTime(currentTime, 0);
            opacityProp.setValueAtTime(currentTime + 0.2, 100);
            opacityProp.setValueAtTime(currentTime + (texts.length * stepDuration) - 0.2, 100);
            opacityProp.setValueAtTime(currentTime + (texts.length * stepDuration), 0);
        }

        return 'Text animation created on: ' + layer.name;
    } catch (e) {
        return 'Error: ' + e.message;
    }
}

// Main script execution
if (app.project) {
    // Script can be called from panel or directly
    // Commands are called via evalScript from the panel
} else {
    alert('MotionFlow: Please run this script inside After Effects');
}