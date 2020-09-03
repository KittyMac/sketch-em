import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/

// tail -f ~/Library/Logs/com.bohemiancoding.sketch3/Plugin\ Log.log
// npm run watch

var UI = require('sketch/ui')
var Settings = require('sketch/settings')

export default function() {
	const doc = sketch.getSelectedDocument()
	const selectedLayers = doc.selectedLayers
	const selectedCount = selectedLayers.length
	
	function getRectTop(rect) {
		return {
			"x1": rect.x,
			"y1": rect.y,
			"x2": rect.x + rect.width,
			"y2": rect.y
		}
	}
	
	function getRectLeft(rect) {
		return {
			"x1": rect.x,
			"y1": rect.y,
			"x2": rect.x,
			"y2": rect.y + rect.height
		}
	}
	
	function getRectBottom(rect) {
		return {
			"x1": rect.x,
			"y1": rect.y + rect.height,
			"x2": rect.x + rect.width,
			"y2": rect.y + rect.height
		}
	}
	
	function getRectRight(rect) {
		return {
			"x1": rect.x + rect.width,
			"y1": rect.y,
			"x2": rect.x + rect.width,
			"y2": rect.y + rect.height
		}
	}
	
	function testLineToLine(line0, line1) {
		let a = line0.x1
		let b = line0.y1
		let c = line0.x2
		let d = line0.y2
		
		let p = line1.x1
		let q = line1.y1
		let r = line1.x2
		let s = line1.y2
		
		var det, gamma, lambda;
		det = (c - a) * (s - q) - (r - p) * (d - b);
		if (det === 0) {
			return false;
		} else {
			lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
			gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
			return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
		}
	}
	
	function testLineToRect(line, rect) {
		if (testLineToLine(line, getRectTop(rect))) {
			return true
		}
		if (testLineToLine(line, getRectLeft(rect))) {
			return true
		}
		if (testLineToLine(line, getRectBottom(rect))) {
			return true
		}
		if (testLineToLine(line, getRectRight(rect))) {
			return true
		}
		return false
	}
	
	function testPointInRect(x, y, rect) {
		return (x >= rect.x) && (x <= rect.x+rect.width) && (y >= rect.y) && (y <= rect.y+rect.height)
	}
	
	function testRectInRect(rect1, rect2) {
		let tl = testPointInRect(rect1.x, rect1.y, rect2)
		let tr = testPointInRect(rect1.x+rect1.width, rect1.y, rect2)
		let bl = testPointInRect(rect1.x, rect1.y+rect1.height, rect2)
		let br = testPointInRect(rect1.x+rect1.width, rect1.y+rect1.height, rect2)
		return (tl && tr && bl && br)
	}
			
	function findNextLayerInDirection(layers, source, dx, dy) {
		// We defined a line from source center to direction, then we
		// check for line to rect intersection for all rects in layer hiearchy
		// Choose the one with the shortest distance
		let cx = source.frame.x + source.frame.width * 0.5
		let cy = source.frame.y + source.frame.height * 0.5

		var line = {
			"x1": cx,
			"y1": cy,
			"x2": dx * 6000,
			"y2": dy * 6000
		}
		
		var minDistance = 9999999
		var minView = undefined
		
		var idx
		for (idx = 0; idx < layers.length; idx++) {
			var layer = layers[idx]
			
			// ignore testing against myself
			if (layer.frame != null && layer.id != source.id) {
				// ignore any rects wholly contained in me
				if (testRectInRect(layer.frame, source.frame) == false) {
					// do want rects outside of me my rect instersects with
					let intersects = testLineToRect(line, layer.frame)				
					if (intersects) {
						
						// Find distance along this axis
						let d = 9999999
						if (dx < 0) {
							d = Math.abs((source.frame.x) - (layer.frame.x + layer.frame.width))
						}
						if (dx > 0) {
							d = Math.abs((source.frame.x + source.frame.width) - (layer.frame.x))
						}
						if (dy < 0) {
							d = Math.abs((source.frame.y) - (layer.frame.y + layer.frame.height))
						}
						if (dy > 0) {
							d = Math.abs((source.frame.y + source.frame.height) - (layer.frame.y))
						}

						if (d > 0 && d < minDistance) {
							minDistance = d
							minView = layer
						}
					}
				}
			}
		}
		
		if (minView == undefined) {
			return undefined
		}
		
		return [minView, minDistance]
	}
	
	var sketchEmFontSize = Settings.documentSettingForKey(doc, 'sketchEmFontSize')
	if (sketchEmFontSize == null) {
		sketchEmFontSize = 16
	}

	if (selectedCount === 0) {
		sketch.UI.message('No layers are selected.')
	} else if (selectedCount > 1) {
		sketch.UI.message(`Select only one layer.`)
	} else {
		let layer = selectedLayers.layers[0]
		let artboard = layer.getParentArtboard()
								
		let x = layer.frame.x / sketchEmFontSize
		let y = layer.frame.y / sketchEmFontSize
		let width = layer.frame.width / sketchEmFontSize
		let height = layer.frame.height / sketchEmFontSize
		
		let topView = findNextLayerInDirection(artboard.layers, layer, 0, -1)
		let leftView = findNextLayerInDirection(artboard.layers, layer, -1, 0)
		let bottomView = findNextLayerInDirection(artboard.layers, layer, 0, 1)
		let rightView = findNextLayerInDirection(artboard.layers, layer, 1, 0)
				
		var scratch = ""
		scratch += `{\n`
		scratch += "  // Measured from child to parent\n"
		scratch += `  top: ${x.toFixed(2)}em\n`
		scratch += `  left: ${y.toFixed(2)}em\n`
		scratch += `  width: ${width.toFixed(2)}em\n`
		scratch += `  height: ${height.toFixed(2)}em\n`
		
		if (topView != undefined || leftView != undefined || bottomView != undefined || rightView != undefined) {
			scratch += `\n`
			
			if (topView != undefined) {
				scratch += `  // Measured to "${topView[0].name}"\n`
				scratch += `  margin-top: ${(topView[1] / sketchEmFontSize).toFixed(2)}em\n`
			}
			if (leftView != undefined) {
				scratch += `  // Measured to "${leftView[0].name}"\n`
				scratch += `  margin-left: ${(leftView[1] / sketchEmFontSize).toFixed(2)}em\n`
			}
			if (bottomView != undefined) {
				scratch += `  // Measured to "${bottomView[0].name}"\n`
				scratch += `  margin-bottom: ${(bottomView[1] / sketchEmFontSize).toFixed(2)}em\n`
			}
			if (rightView != undefined) {
				scratch += `  // Measured to "${rightView[0].name}"\n`
				scratch += `  margin-right: ${(rightView[1] / sketchEmFontSize).toFixed(2)}em\n`
			}
		}
		
		scratch += `}\n`
		
		UI.message("Measurements Copied")
		clipboard.set(scratch)
		
	}
}


////////////////////////////////////////////////////////////////////////////////

// Using JSTalk clipboard handling snippet from https://gist.github.com/uhunkler/5465857 by Urs Hunkler
var clipboard = {
    // store the pasetboard object
    pasteBoard: null,

    // save the pasteboard object
    init: function () {
        this.pasteBoard = NSPasteboard.generalPasteboard()
    },
    // set the clipboard to the given text
    set: function (text) {
        if (typeof text === "undefined") return null

        if (!this.pasteBoard) this.init()

        this.pasteBoard.declareTypes_owner([NSPasteboardTypeString], null)
        this.pasteBoard.setString_forType(text, NSPasteboardTypeString)

        return true
    },
    // get text from the clipbaoard
    get: function () {
        if (!this.pasteBoard) this.init()

        var text = this.pasteBoard.stringForType(NSPasteboardTypeString)

        return text.toString()
    },
}