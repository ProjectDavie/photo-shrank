module.exports = {
  ...require("./metadata.service"),
  ...require("./metadata.tags"),
  ...require("./metadata.migration"),
  ...require("./metadata.helpers")
};