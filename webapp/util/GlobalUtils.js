// Global Utilities
sap.ui.define([], function() {
	"use strict";
	return {
		compareDeviceSeq: function(a, b) {
			if (a.DeviceSeq < b.DeviceSeq)
				return -1;
			if (a.DeviceSeq > b.DeviceSeq)
				return 1;
			return 0;
		},

		checkServiceURL: function(sThis) {
			var oModel = sThis.getModel("FhemService");
			return oModel.sServiceUrl.indexOf("192.168.999.999") !== -1;
		},

		setColorPalette4RadThermo: function(sTemp) {
			// Set Color Palette
			if (sTemp >= 25) {
				return "#f20707"; //Red
			} else if (sTemp >= 20) {
				return "#f29007"; //Orange
			} else {
				return "#5cbae6"; //Blue	
			}
		}
	};

});