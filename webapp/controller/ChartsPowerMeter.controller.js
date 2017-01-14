sap.ui.define([
	"fhemui5/controller/BaseController",
	"sap/ui/core/routing/History",
	"fhemui5/util/GlobalUtils"
], function(BaseController, History, GlobalUtils) {
	"use strict";

	return BaseController.extend("fhemui5.controller.ChartsPowerMeter", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf fhemui5.view.ChartsPowerMeter
		 */

		onInit: function() {

			// Retrieve navigation context
			this.getRouter().getRoute("chartsPowerMeter").attachPatternMatched(this._onObjectMatched, this);

			this.buildChart();
		},

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			// Retrieve key from navigation context 
			this.sDeviceID = oEvent.getParameter("arguments").DeviceID;
			this.sReadingID = oEvent.getParameter("arguments").ReadingID;
		},

		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("object", {
					objectId: "state"
				}, true);
			}
		},

		buildChart: function() {

			// Get Chart data
			var oChartdata = this.getChartData();

			// Check mandatory data 
			if (!oChartdata) {
				return;
			}

			//  Get VizFrame by ID		
			var oVizFrame = this.getView().byId("idcolumn");

			//  Create a JSON Model and set the data
			var oChartDataModel = new sap.ui.model.json.JSONModel();
			oChartDataModel.setData(oChartdata);
			oVizFrame.setModel(oChartDataModel);

			// Build Chart DataSet
			var oChartDataSet = this.buildChartDataSet();
			// Set dataset
			oVizFrame.setDataset(oChartDataSet);

			// Set Viz properties
			oVizFrame.setVizProperties({
				plotArea: {
					colorPalette: d3.scale.category20().range()
				},
				dataLabel: {
					visible: true
				},
				valueAxis: {
					title: {
						visible: true,
						text: "Verbrauch in kWh"
					}
				},
				categoryAxis: {
					title: {
						visible: true,
						text: "Monat"
					}
				},
				title: {
					visible: true,
					text: "Stromzähler - Haushalt"
				}
			});

			// Set Y Axis property
			var feedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
				"uid": "valueAxis",
				"type": "Measure",

				"values": "Verbrauch in kWh"
			});

			// Set X Axis property
			var feedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
				"uid": "categoryAxis",
				"type": "Dimension",
				"values": ["Month"]
			});

			// Set Feed data
			oVizFrame.addFeed(feedValueAxis);
			oVizFrame.addFeed(feedCategoryAxis);

		},

		buildChartDataSet: function() {
			// A Dataset defines how the model data is mapped to the chart
			var oDataSet = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: "Month",
					value: "{Month}"
				}],
				measures: [{
					name: "Verbrauch in kWh",
					value: "{Value}"
				}],
				data: {
					path: "/PowerMeter"
				}
			});

			// Leave if we couldn't instanciate the dataset
			if (!oDataSet) {
				return;
			}

			return oDataSet;
		},

		getChartData: function() {

			var oFhemDblog = {
				"data": [{
					"TIMESTAMP": "2015-01-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "317.98",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-03-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "305",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-02-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "278",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-04-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "288",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-05-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "326",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-06-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "324.59",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-07-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "287.41",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-08-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "323.30",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-09-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "318.76",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-10-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "353.01",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-11-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "367.49",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2015-12-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "369.01",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-01-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "317.98",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-03-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "305",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-02-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "278",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-04-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "288",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-05-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "326",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-06-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "324.59",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-07-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "287.41",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-08-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "323.30",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-09-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "318.76",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-10-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "353.01",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-11-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "367.49",
					"UNIT": ""
				}, {
					"TIMESTAMP": "2016-12-28 00:00:00",
					"DEVICE": "eg.hw.sz.haushalt.dum1",
					"TYPE": "SMLUSB",
					"EVENT": "Monatsverbrauch",
					"READING": "Monatsverbrauch",
					"VALUE": "369.01",
					"UNIT": ""
				}],
				"totalCount": 12
			};

			//Sort Data by Timestamp 
			oFhemDblog.data.sort(GlobalUtils.compareTimestamp);

			var oChartData = {
				"PowerMeter": []
			};

			var iDataLen = oFhemDblog.data.length;
			for (var i = 0; i < iDataLen; i++) {
				// Convert Timestamp into month/year (MM.YYYY)
				var oTimestampFormated = GlobalUtils.convertTimestamp(oFhemDblog.data[i].TIMESTAMP);

				// Build new data record 
				oChartData.PowerMeter[i] = {
					"Month": oTimestampFormated.monthYear,
					"Value": oFhemDblog.data[i].VALUE
				};
			}
			return oChartData;

		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf fhemui5.view.ChartsPowerMeter
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf fhemui5.view.ChartsPowerMeter
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf fhemui5.view.ChartsPowerMeter
		 */
		//	onExit: function() {
		//
		//	}

	});
});