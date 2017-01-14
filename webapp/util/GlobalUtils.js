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

			compareMonth: function(sMonthA, sMonthB) {
				if (sMonthA < sMonthB)
					return -1;
				if (sMonthA > sMonthB)
					return 1;
				return 0;
			},

			compareTimestamp: function(a, b) {
				if (a.TIMESTAMP < b.TIMESTAMP)
					return -1;
				if (a.TIMESTAMP > b.TIMESTAMP)
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
			},

			convertTimestamp: function(sTimestamp) {
				//Expected Timestamp format "2016-12-28 00:00:00"

				// Check import parameter 
				if (!sTimestamp) {
					return;
				}

				// Build returning object (can be extended in case other formats are required)
				var oResult = {
					monthYear: ""
				};
				
				// Build month/year format (MM.YYYY)
				oResult.monthYear = sTimestamp.substr(5,2) + "." + sTimestamp.substr(0,4);

				return oResult;
			}

		};
	});