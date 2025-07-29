// const serviceDefinitions = require("../schemas/service-definitions")
const serviceDefinitions = require("../schemas/service-definitions.json");

function discovery (req, res) {
    res.json({ 
        "services": serviceDefinitions
    });
}

module.exports = {
    discovery
};