jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 GroupSet in the list
// * All 3 GroupSet have at least one DeviceSet

sap.ui.require([
	"sap/ui/test/Opa5",
	"fhemui5/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"fhemui5/test/integration/pages/App",
	"fhemui5/test/integration/pages/Browser",
	"fhemui5/test/integration/pages/Master",
	"fhemui5/test/integration/pages/Detail",
	"fhemui5/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "fhemui5.view."
	});

	sap.ui.require([
		"fhemui5/test/integration/MasterJourney",
		"fhemui5/test/integration/NavigationJourney",
		"fhemui5/test/integration/NotFoundJourney",
		"fhemui5/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});