let math = require('mathjs');

function CalculatorAddon(document) {

  var selections = document.getSelections();
  var results = selections.map(function(element, index) {

    try {
      var result = math.eval(element);
      var separator = " = ";

      if (typeof result == "function") {} else if (result.type == "ResultSet") {
        result = result.entries[result.entries.length - 1];
        separator = "\n= ";
      }

      return element + separator + String(result);

    } catch (e) {
      console.log(e);
      return element;
    }

  });

  document.replaceSelections(results);

}

export default CalculatorAddon;
