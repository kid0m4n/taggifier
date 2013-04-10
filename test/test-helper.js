var mocha = require("mocha")
  , chai = require("chai")
  , Taggifier = require("../index")

require("mocha-as-promised")(mocha)
chai.should()
chai.use(require("chai-as-promised"))

module.exports = {
  Taggifier: Taggifier
}