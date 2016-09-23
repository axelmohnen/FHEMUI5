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
			var oModel = sThis.getModel();
			return oModel.sServiceUrl.indexOf("192.168.999.999") !== -1;
		}
	};

});