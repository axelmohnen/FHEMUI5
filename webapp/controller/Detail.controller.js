/*global location */
sap.ui.define([
	"fhemui5/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"fhemui5/model/formatter",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History",
	"sap/ui/core/IntervalTrigger",
	"fhemui5/localService/mockserver",
	"fhemui5/util/GlobalUtils",
	"sap/m/MessageBox",
], function(BaseController, JSONModel, formatter, MessageToast, History, IntervalTrigger, mockserver, GlobalUtils, MessageBox) {
	"use strict";
	return BaseController.extend("fhemui5.controller.Detail", {
		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
				StateTileContainerVisibility: false,
				IconTabBarVisibility: false,
				ShuttersVisibility: false,
				SwitchesVisibility: false,
				SunblindsVisibility: false,
				RadThermosVisibility: false
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			//Model for Shutter Container
			var oShuttersModel = new JSONModel();
			this.setModel(oShuttersModel, "Shutters");

			//Model for Sunblinds Container
			var oSunblindsModel = new JSONModel();
			this.setModel(oSunblindsModel, "Sunblinds");

			//Model for Switches Container
			var oSwitchesModel = new JSONModel();
			this.setModel(oSwitchesModel, "Switches");

			//Model for Radial Thermostats Container
			var oRadThermosModel = new JSONModel();
			this.setModel(oRadThermosModel, "RadThermos");

		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");
			sap.m.URLHelper.triggerEmail(null, oViewModel.getProperty("/shareSendEmailSubject"), oViewModel.getProperty(
				"/shareSendEmailMessage"));
		},
		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle, iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");
			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},
		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},
		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */
		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("GroupSet", {
					GroupID: sObjectId
				});
				this._bindView("/" + sObjectPath, sObjectId);
			}.bind(this));
		},
		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath, sObjectId) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});

			// Keep Object ID
			this.ObjectId = sObjectId;
			// Refresh Readings
			this.refresh(sObjectId);

			// Set View components visibility 	
			this.setViewComponentVisibility(sObjectPath, sObjectId, oViewModel);
		},
		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}
			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.GroupID,
				sObjectName = oObject.GroupDescription,
				oViewModel = this.getModel("detailView");
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [
				sObjectName,
				sObjectId,
				location.href
			]));
		},
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();
			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);
			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});
			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		setViewComponentVisibility: function(sObjectPath, sObjectId, oViewModel) {

			//Check Group ID
			switch (sObjectId) {
				case "state":
					oViewModel.setProperty("/StateTileContainerVisibility", true);
					oViewModel.setProperty("/IconTabBarVisibility", false);
					break;
				case "shutters":
					oViewModel.setProperty("/IconTabBarVisibility", true);
					oViewModel.setProperty("/ShuttersVisibility", true);
					oViewModel.setProperty("/SwitchesVisibility", false);
					oViewModel.setProperty("/SunblindsVisibility", false);
					oViewModel.setProperty("/RadThermosVisibility", false);
					oViewModel.setProperty("/StateTileContainerVisibility", false);
					break;
				case 'switches':
					oViewModel.setProperty("/IconTabBarVisibility", true);
					oViewModel.setProperty("/ShuttersVisibility", false);
					oViewModel.setProperty("/SwitchesVisibility", true);
					oViewModel.setProperty("/SunblindsVisibility", false);
					oViewModel.setProperty("/RadThermosVisibility", false);
					oViewModel.setProperty("/StateTileContainerVisibility", false);
					break;
				case 'sunblinds':
					oViewModel.setProperty("/IconTabBarVisibility", true);
					oViewModel.setProperty("/ShuttersVisibility", false);
					oViewModel.setProperty("/SwitchesVisibility", false);
					oViewModel.setProperty("/SunblindsVisibility", true);
					oViewModel.setProperty("/RadThermosVisibility", false);
					oViewModel.setProperty("/StateTileContainerVisibility", false);
					break;
				case 'radthermos':
					oViewModel.setProperty("/IconTabBarVisibility", true);
					oViewModel.setProperty("/ShuttersVisibility", false);
					oViewModel.setProperty("/SwitchesVisibility", false);
					oViewModel.setProperty("/SunblindsVisibility", false);
					oViewModel.setProperty("/RadThermosVisibility", true);
					oViewModel.setProperty("/StateTileContainerVisibility", false);
					break;
				default:
					oViewModel.setProperty("/StateTileContainerVisibility", false);
					oViewModel.setProperty("/IconTabBarVisibility", false);
					oViewModel.setProperty("/ShuttersVisibility", false);
					oViewModel.setProperty("/SwitchesVisibility", false);
					oViewModel.setProperty("/SunblindsVisibility", false);
			}
		},

		buildStateTileModel: function(sGroupID) {
			//Check Group ID
			if (sGroupID !== "state") {
				return;
			}
			// Retrieve Fhem data model
			var oGroupSet = this.getModel("fhem");

			// Check GroupSet
			if (!oGroupSet) {
				return;
			}

			// Retrieve TileContainer from view
			var oTileContainer = this.getView().byId("TileContainer");
			oTileContainer.removeAllContent();

			var GroupSetLen = oGroupSet.length;
			for (var i = 0; i < GroupSetLen; i++) {
				// Contine if not Group ID as been found
				if (oGroupSet[i].GroupID !== sGroupID) {
					continue;
				}

				var oDeviceSet = oGroupSet[i].DeviceSet.results;
				// Check DeviceSet
				if (!oDeviceSet) {
					continue;
				}

				//Sort DeviceSet by sequence number 
				oDeviceSet.sort(GlobalUtils.compareDeviceSeq);

				var DeviceSetLen = oDeviceSet.length;
				for (var j = 0; j < DeviceSetLen; j++) {

					var oReadingSet = oDeviceSet[j].ReadingSet.results;
					var ReadingSetLen = oReadingSet.length;

					// Create Slide Tile container 
					var oSlideTile = new sap.m.SlideTile(j);
					oSlideTile.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginTop tileLayout");

					// Add Slide Tile to Tile container
					oTileContainer.addContent(oSlideTile);

					for (var k = 0; k < ReadingSetLen; k++) {
						// Add tile content
						this.setTileContent(oSlideTile, oReadingSet[k], k);
					}
				}
			}
		},

		setTileContent: function(oSlideTile, oReadingSet, sIndex) {
			// Create Generic Tile Container
			var oTile = new sap.m.GenericTile(sIndex);
			oTile.setHeader(oReadingSet.TileHeader);
			oTile.setSubheader(oReadingSet.TileSubHeader);
			oTile.setHeaderImage(oReadingSet.TileHeaderImage);

			// Create Tile Content
			var oTileContent = new sap.m.TileContent(sIndex);
			oTileContent.setFooter(oReadingSet.TileFooter);
			oTileContent.setUnit(oReadingSet.TileUnit);
			//Check Tile Content Type
			switch (oReadingSet.TileContentType) {
				case "numeric":
					var sIndicator;
					// Add numeric content
					var oNumericContent = new sap.m.NumericContent(sIndex);
					oNumericContent.setValue(oReadingSet.ReadingValue);
					oNumericContent.setScale(oReadingSet.NumericContentScale);

					// Set Indicator if requested
					if (oReadingSet.NumericContentSetIndicator) {
						// Check actual value and old value
						if (oReadingSet.ReadingValue > oReadingSet.ReadingValueOld) {
							sIndicator = "Up";
						} else {
							sIndicator = "Down";
						}
						oNumericContent.setIndicator(sIndicator);
					}

					// Set Color
					if (!oReadingSet.NumericContentValueColor) {
						oNumericContent.setValueColor("Neutral");
					} else {
						oNumericContent.setValueColor(oReadingSet.NumericContentValueColor);
					}

					oNumericContent.setIcon(oReadingSet.NumericContentIcon);
					oNumericContent.setWidth("100%");

					// Adapt control for smaller font size
					if (oReadingSet.NumericContentSmallSize) {
						oNumericContent.addStyleClass("sapMNCValueCust");
						oNumericContent.setTruncateValueTo(5);
					}

					// Add NUmeric Tile content to Tile Content
					oTileContent.setContent(oNumericContent);
					break;

				case "RadialMicro":
					// Add Radial Micro chart
					var oRadialMicro = new sap.suite.ui.microchart.RadialMicroChart(sIndex);

					// Set Percentage
					if (!oReadingSet.ReadingValue) {
						oRadialMicro.setPercentage(0);
					} else {
						oRadialMicro.setPercentage(parseFloat(oReadingSet.ReadingValue));
					}

					// Set color
					if (!oReadingSet.RadialMicroColor) {
						oRadialMicro.setValueColor("Neutral");
					} else {
						oRadialMicro.setValueColor(oReadingSet.RadialMicroColor);
					}

					// Add RadialMicro to Tile Content
					oTileContent.setContent(oRadialMicro);
					break;

				case "HarveyBall":
					var oHarveyBall = new sap.suite.ui.microchart.HarveyBallMicroChart(sIndex);
					oHarveyBall.setTotal(parseFloat(oReadingSet.HarveyBallTotal));
					//oHarveyBall.setTotalLabel(oReadingSet.HarveyBallTotalLabel);
					oHarveyBall.setTotalScale(oReadingSet.HarveyBallTotalScale);
					oHarveyBall.setIsResponsive(true);

					//Create new item
					var oHarveyBallItem = new sap.suite.ui.microchart.HarveyBallMicroChartItem(sIndex);
					oHarveyBallItem.setFraction(parseFloat(oReadingSet.ReadingValue));
					oHarveyBallItem.setFractionScale(oReadingSet.HarveyBallFractionScale);

					// Set color
					if (!oReadingSet.HarveyBallColor) {
						oHarveyBallItem.setColor("Neutral");
					} else {
						oHarveyBallItem.setColor(oReadingSet.HarveyBallColor);
					}

					//Add item to HarveyBall
					oHarveyBall.addItem(oHarveyBallItem);

					// Add HarveyBall to Tile Content
					oTileContent.setContent(oHarveyBall);
					break;

				case "Feed":
					var oFeedContent = new sap.m.FeedContent(sIndex);
					//oFeedContent.setContentText(oReadingSet.ReadingValue);
					//oFeedContent.setSubheader(oReadingSet.ReadingValue);
					oFeedContent.setTruncateValueTo(5);
					oFeedContent.setValue(oReadingSet.ReadingValue);

					// Add Feed Tile content to Tile Content
					oTileContent.setContent(oFeedContent);

					break;

			}

			// Add Tile Content to generic Tile
			oTile.addTileContent(oTileContent);

			// Add generic Tile to SlideTile
			oSlideTile.addTile(oTile);
		},

		buildShuttersModel: function(sGroupID) {
			//Check Group ID
			if (sGroupID !== "shutters") {
				return;
			}

			var othis = this;
			// Retrieve Fhem data model
			var oGroupSet = this.getModel("fhem");
			if (!oGroupSet) {
				return;
			}

			var oDeviceSet = this.getDeviceSet(oGroupSet, sGroupID);
			if (!oDeviceSet) {
				return;
			}
			// Retrieve Shutters Model
			var oShuttersModel = this.getModel("Shutters");
			var oShuttersList = {
				results: []
			};

			if (oDeviceSet instanceof Array) {
				oDeviceSet.forEach(function(oValue, i) {
					//Retrieve Reading Values
					var sShutterLevel = parseFloat(othis.getReadingValue(oValue, "pct"));
					oShuttersList.results[i] = {
						ShutterID: oValue.DeviceID,
						ShutterDescription: oValue.DeviceDescription,
						ShutterSeq: oValue.DeviceSeq,
						ShutterLevel: sShutterLevel
					};
				});
				oShuttersModel.setData(oShuttersList);
			}
		},

		buildSunblindsModel: function(sGroupID) {
			//Check Group ID
			if (sGroupID !== "sunblinds") {
				return;
			}

			var othis = this;
			// Retrieve Fhem data model
			var oGroupSet = this.getModel("fhem");
			if (!oGroupSet) {
				return;
			}

			var oDeviceSet = this.getDeviceSet(oGroupSet, sGroupID);
			if (!oDeviceSet) {
				return;
			}
			// Retrieve Sunblinds Model
			var oSunblindsModel = this.getModel("Sunblinds");
			var oSunblindsList = {
				results: []
			};

			if (oDeviceSet instanceof Array) {
				oDeviceSet.forEach(function(oValue, i) {
					//Retrieve Reading Values
					var sSunblindsLevel = parseFloat(othis.getReadingValue(oValue, "pct"));
					oSunblindsList.results[i] = {
						SunblindID: oValue.DeviceID,
						SunblindDescription: oValue.DeviceDescription,
						SunblindSeq: oValue.DeviceSeq,
						SunblindLevel: sSunblindsLevel
					};
				});
				oSunblindsModel.setData(oSunblindsList);
			}
		},

		buildSwitchesModel: function(sGroupID) {
			//Check Group ID
			if (sGroupID !== "switches") {
				return;
			}

			var othis = this;
			// Retrieve Fhem data model
			var oGroupSet = this.getModel("fhem");
			if (!oGroupSet) {
				return;
			}

			var oDeviceSet = this.getDeviceSet(oGroupSet, sGroupID);
			if (!oDeviceSet) {
				return;
			}
			// Retrieve Switches Model
			var oSwitchesModel = this.getModel("Switches");
			var oSwitchesList = {
				results: []
			};

			if (oDeviceSet instanceof Array) {
				oDeviceSet.forEach(function(oValue, i) {
					//Retrieve Reading Values
					var sSwitchState;
					var fState = othis.getReadingValue(oValue, "state");

					//Map switch state (FHEM -> FHEMUI5)
					if (fState === "on") {
						sSwitchState = true;
					} else {
						sSwitchState = false;
					}

					oSwitchesList.results[i] = {
						SwitchID: oValue.DeviceID,
						SwitchDescription: oValue.DeviceDescription,
						SwitchSeq: oValue.DeviceSeq,
						SwitchState: sSwitchState
					};
				});
				oSwitchesModel.setData(oSwitchesList);
			}
		},

		buildRadThermosModel: function(sGroupID) {
			//Check Group ID
			if (sGroupID !== "radthermos") {
				return;
			}

			var othis = this;
			// Retrieve Fhem data model
			var oGroupSet = this.getModel("fhem");
			if (!oGroupSet) {
				return;
			}

			var oDeviceSet = this.getDeviceSet(oGroupSet, sGroupID);
			if (!oDeviceSet) {
				return;
			}
			// Retrieve Radiator Thermonstats Model
			var oRadThermosModel = this.getModel("RadThermos");
			var oRadThermosList = {
				results: []
			};

			if (oDeviceSet instanceof Array) {
				oDeviceSet.forEach(function(oValue, i) {
					//Retrieve Reading Values
					var sReqTemp = parseFloat(othis.getReadingValue(oValue, "desired-temp"));
					var sColorPalette;

					// Set Color Palette
					sColorPalette = GlobalUtils.setColorPalette4RadThermo(sReqTemp);

					// Set Model data
					oRadThermosList.results[i] = {
						RadThermoID: oValue.DeviceID,
						RadThermoDescription: oValue.DeviceDescription,
						RadThermoSeq: oValue.DeviceSeq,
						RadThermoReqTemp: sReqTemp,
						RadThermoColorPalette: sColorPalette
					};
				});
				oRadThermosModel.setData(oRadThermosList);
			}
		},

		getDeviceSet: function(oGroupSet, sGroupID) {
			if (oGroupSet) {
				var oDeviceSet;
				if (oGroupSet instanceof Array) {
					oGroupSet.forEach(function(oValue, i) {
						if (oValue.GroupID === sGroupID) {
							oDeviceSet = oValue.DeviceSet.results;
						}
					});
				}
				return oDeviceSet;
			}
		},
		getReadingValue: function(oDeviceSet, sReadingID) {
			if (!oDeviceSet) {
				return;
			}
			if (!sReadingID) {
				return;
			}

			var sReadingValue;
			if (oDeviceSet.ReadingSet.results instanceof Array) {
				oDeviceSet.ReadingSet.results.forEach(function(oValue, i) {
					if (oValue.ReadingID === sReadingID) {
						sReadingValue = oValue.ReadingValue;
					}
				});
			}
			return sReadingValue;
		},

		refresh: function(sGroupID) {
			var oThis = this;
			if (!sGroupID) {
				return;
			}
			// Retrieve Fhem data model
			var oGroupSet = this.getModel("fhem");
			if (!oGroupSet) {
				return;
			}
			var oDeviceSet = this.getDeviceSet(oGroupSet, sGroupID);

			if (!oDeviceSet) {
				return;
			}

			// TODO: Remove coding if not needed 
			// // Check Service URL
			// if (GlobalUtils.checkServiceURL(this)) {
			// 	MessageBox.error("Service URL is not valid");
			// } else {

			// Get data from Fhem via JSON List
			if (oDeviceSet instanceof Array) {
				oDeviceSet.forEach(function(oValue, i) {
					oThis.refreshReadings(sGroupID, oValue.DeviceID, oValue.ReadingSet.results);
				});
			}

			//}

			// TODO: Remove Coding
			// Build Models
			oThis.buildModels(sGroupID);

			// TODO: Remove Coding
			// Update Binding
			//oThis.updateBinding();
		},

		refreshReadings: function(sGroupID, sDeviceID, oReadingSet) {
			// Check input
			if (!sGroupID) {
				return;
			}
			// Check input
			if (!sDeviceID) {
				return;
			}
			if (!oReadingSet) {
				return;
			}

			// We accpect only one Device ID for ReadingsSet
			// Read all readings per Device in order to limit HTTP requests
			// For aync Mode
			this.readFhemData(sGroupID, sDeviceID, oReadingSet);

			// TODO: Remove Coding
			// // For sync mode 
			// var oModelFhemData = this.readFhemData(sDeviceID);

			// if (!oModelFhemData) {
			// 	return;
			// }
			// if (oReadingSet instanceof Array) {
			// 	oReadingSet.forEach(function(oValue, i) {
			// 		// Get ReadingsValue from FHEM Model
			// 		var sReadingValue = oModelFhemData.getProperty("/Results/0/Readings/" + oValue.ReadingID + "/Value");
			// 		// Keep old reading value
			// 		oValue.ReadingValueOld = oValue.ReadingValue;
			// 		// Set new reading value
			// 		oValue.ReadingValue = sReadingValue;
			// 		if (!oValue.ReadingValue) {
			// 			oValue.ReadingValue = "0";
			// 		}
			// 	});
			// }
		},

		readFhemData: function(sGroupID, sDeviceID, oReadingSet) {
			// Check input
			if (!sGroupID) {
				return;
			}
			// Check input
			if (!sDeviceID) {
				return;
			}
			var oThis = this;
			var oModel = this.getModel("FhemService");
			var sPrefix = "?cmd=jsonlist2%20[DeviceID]&XHR=1";
			var sPlaceholder = "[DeviceID]";
			var sFhemcmd = oModel.sServiceUrl + sPrefix;
			sFhemcmd = sFhemcmd.replace(sPlaceholder, sDeviceID);

			var oModelFhemData = new sap.ui.model.json.JSONModel();

			// TODO: Remove Coding
			// For synchronious mode
			// oModelFhemData.loadData(sFhemcmd, undefined, false);
			// return oModelFhemData;

			// Read FHEM data asynchronous
			oModelFhemData.loadData(sFhemcmd, undefined, true);

			// Handle Request Complete
			oModelFhemData.attachRequestCompleted(function(oData) {

				// Check if we received the data sucessfully
				if (!oModelFhemData.getProperty("/Results/")) {
					return;
				}

				// Map Fhem readings to FHEM Model
				if (oReadingSet instanceof Array) {
					oReadingSet.forEach(function(oValue, i) {
						// Get ReadingsValue from FHEM Model
						var sReadingValue = oModelFhemData.getProperty("/Results/0/Readings/" + oValue.ReadingID + "/Value");
						// Keep old reading value
						oValue.ReadingValueOld = oValue.ReadingValue;
						// Set new reading value
						oValue.ReadingValue = sReadingValue;
						if (!oValue.ReadingValue) {
							oValue.ReadingValue = "0";
						}
					});
				}
				// Build Models
				oThis.buildModels(sGroupID);

				// TODO: Remove Coding
				// Update Binding
				//oThis.updateBinding();

			});

			// Error: Service URL is not valid
			oModelFhemData.attachRequestFailed(function(oData) {
				MessageBox.error("Service URL is not valid: " + sFhemcmd);
			});
		},

		updateBinding: function() {
			// Retrieve Models
			var oShuttersModel = this.getModel("Shutters");
			var oSunblindsModel = this.getModel("Sunblinds");
			var oSwitchesModel = this.getModel("Switches");
			var oRadThermosModel = this.getModel("RadThermos");

			// Update Bindings
			oShuttersModel.updateBindings();
			oSunblindsModel.updateBindings();
			oSwitchesModel.updateBindings();
			oRadThermosModel.updateBindings();
		},

		buildModels: function(sGroupID) {
			// Build State Tile Model	
			this.buildStateTileModel(sGroupID);

			//Update Shutters Model
			this.buildShuttersModel(sGroupID);

			//Update Sunblinds Model
			this.buildSunblindsModel(sGroupID);

			//Update Switches Model
			this.buildSwitchesModel(sGroupID);

			//Update Radial Thermostats Model
			this.buildRadThermosModel(sGroupID);
		},

		fireFhemCmd: function(sDeviceID, sCmd) {
			// Check import
			if (!sDeviceID) {
				return;
			}
			if (!sCmd) {
				return;
			}

			var oModel = this.getModel("FhemService");
			var sPrefix1 = "?cmd=";
			var sPrefix2 = "set%20[DeviceID]%20[Cmd]";
			var sPrefix3 = "&XHR=1";
			var sPlaceholder1 = "[DeviceID]";
			var sPlaceholder2 = "[Cmd]";
			var oXmlHttp = new XMLHttpRequest();

			// Replace placeholder by Import parameters
			sPrefix2 = sPrefix2.replace(sPlaceholder1, sDeviceID);
			sPrefix2 = sPrefix2.replace(sPlaceholder2, sCmd);

			// Build FHEM Command
			var sFhemcmd = oModel.sServiceUrl + sPrefix1 + sPrefix2 + sPrefix3;

			// Catch HTTP responce status
			oXmlHttp.onreadystatechange = function() {
				if (oXmlHttp.readyState === 4 && oXmlHttp.status === 200) {
					var sMessage = sPrefix2.replace(/%20/g, " ");
					MessageToast.show(sMessage);
				} else {
					if (oXmlHttp.responseText) {
						MessageToast.show(oXmlHttp.responseText);
					}

				}
			};

			// Fire HTTP request
			oXmlHttp.open("GET", sFhemcmd, true);
			oXmlHttp.send(null);
		},

		onShutterSelected: function(evt) {
			// Get selected device id
			var sDeviceID = evt.getSource().data("DeviceID");
			var sKey = evt.getParameter("key");

			// Fire FHEM Command
			this.fireFhemCmd(sDeviceID, sKey);
		},

		onSunblindsSelected: function(evt) {
			// Get selected device id
			var sDeviceID = evt.getSource().data("DeviceID");
			var sKey = evt.getParameter("key");

			// Fire FHEM Command
			this.fireFhemCmd(sDeviceID, sKey);
		},

		onSwitchPressed: function(evt) {
			// Get selected device id
			var sDeviceID = evt.getSource().data("DeviceID");

			// Get switch state
			var sState = evt.getParameter("state");
			var sKey;

			//Map state (FHEMUI5 -> FHEM)
			if (sState === true) {
				sKey = "on";
			} else {
				sKey = "off";
			}

			// Fire FHEM Command
			this.fireFhemCmd(sDeviceID, sKey);
		},

		onRadThermoSelected: function(evt) {
			// Get selected device id
			var sDeviceID = evt.getSource().data("DeviceID");
			// Get Action Selected
			var sAction = evt.getSource().data("Action");

			// Retrieve Radiator Thermonstats Model
			var oRadThermosModel = this.getModel("RadThermos");
			var aRadThermos = oRadThermosModel.getProperty("/results");
			var sReqTemp;
			var sFhemCmd;

			var iRadThermosLen = aRadThermos.length;
			for (var i = 0; i < iRadThermosLen; i++) {
				// Exit if DeviceID as been found
				if (aRadThermos[i].RadThermoID === sDeviceID) {
					sReqTemp = aRadThermos[i].RadThermoReqTemp;
					break;
				}
			}

			switch (sAction) {
				case "up":
					sReqTemp += 1;
					aRadThermos[i].RadThermoReqTemp = sReqTemp;
					break;

				case "down":
					sReqTemp -= 1;
					aRadThermos[i].RadThermoReqTemp = sReqTemp;
					break;

				case "boost":
					sReqTemp = 30;
					aRadThermos[i].RadThermoReqTemp = sReqTemp;
					break;
			}

			// Set Color Palette
			aRadThermos[i].RadThermoColorPalette = GlobalUtils.setColorPalette4RadThermo(aRadThermos[i].RadThermoReqTemp);

			// Update View binding
			oRadThermosModel.updateBindings();

			// Fire FHEM Command
			sFhemCmd = "desired-temp " + aRadThermos[i].RadThermoReqTemp;
			this.fireFhemCmd(sDeviceID, sFhemCmd);
		},

		startAutoRefresh: function() {
			//Create Trigger and register handler
			if (!this.oTrigger) {
				this.oTrigger = new sap.ui.core.IntervalTrigger();
			}

			this.oTrigger.addListener(this.triggerAutoRefresh, this);
			this.oTrigger.setInterval(10000);
		},

		stopAutoRefresh: function() {
			//Stop Trigger
			this.oTrigger.removeListener(this.triggerAutoRefresh, this);
		},

		triggerAutoRefresh: function() {
			// Refresh data
			if (this.ObjectId) {
				this.refresh(this.ObjectId);
				MessageToast.show("Refresh trigger");
			}
		},

		onPressAutoRefresh: function(evt) {
			if (evt.getParameter("pressed")) {
				this.startAutoRefresh();
			} else {
				this.stopAutoRefresh();
			}
		},

		handlePullToRefresh: function() {
			// Refresh data
			if (this.ObjectId) {
				this.refresh(this.ObjectId);
				this.getView().byId("pullToRefresh").hide();
			}
		}
	});
});