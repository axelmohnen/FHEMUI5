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
		}
	};

});