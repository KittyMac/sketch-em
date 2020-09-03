import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/

var UI = require('sketch/ui')
var Settings = require('sketch/settings')

export default function() {
	const doc = sketch.getSelectedDocument()
	
	var sketchEmFontSize = Settings.documentSettingForKey(doc, 'sketchEmFontSize')
	if (sketchEmFontSize == null) {
		sketchEmFontSize = 16
	}
		
	UI.getInputFromUser(
		"Base Font Size:",
		{
			initialValue: sketchEmFontSize,
		},
		(err, value) => {
			if (err) {
				return
			}
			sketchEmFontSize = value
			
			Settings.setDocumentSettingForKey(doc, 'sketchEmFontSize', sketchEmFontSize)
		}
	)
}