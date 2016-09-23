jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"fhemui5/test/integration/NavigationJourneyPhone",
		"fhemui5/test/integration/NotFoundJourneyPhone",
		"fhemui5/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});