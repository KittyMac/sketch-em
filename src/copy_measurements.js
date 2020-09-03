import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/

var UI = require('sketch/ui')
var Settings = require('sketch/settings')

export default function() {
	const doc = sketch.getSelectedDocument()
	const selectedLayers = doc.selectedLayers
	const selectedCount = selectedLayers.length
	
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
						
		let x = layer.frame.x / sketchEmFontSize
		let y = layer.frame.y / sketchEmFontSize
		let width = layer.frame.width / sketchEmFontSize
		let height = layer.frame.height / sketchEmFontSize
				
		var scratch = ""
		scratch += `{\n`
		scratch += `  top: ${x.toFixed(2)}em\n`
		scratch += `  left: ${y.toFixed(2)}em\n`
		scratch += `  width: ${width.toFixed(2)}em\n`
		scratch += `  height: ${height.toFixed(2)}em\n`
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