

// Load the global superstore dataset
d3.csv("./Sample - Superstore.csv", function(dataset)  {

  // Create a map projection
  var projection = d3.geoAlbersUsa()
    .scale(1000)
    .translate([500, 300]);

  // Create a GeoPath
  var geoPath = d3.geoPath()
    .projection(projection);

  // Add a map to the DOM
  var map = d3.select("#map")
    .append("svg")
    .attr("width", 1000)
    .attr("height", 600);

  // Add a path for each US state
  map.selectAll("path")
    .data(topojson.feature(usa, usa.objects.states))
    .enter()
    .append("path")
    .attr("d", geoPath)
    .attr("fill", function(d) {
      // Calculate the customer percentage for the state
      var customerPercentage = d.properties.SALES / d.properties.POPULATION * 100;

      // Return a color based on the customer percentage
      if (customerPercentage < 1) {
        return "#ffffff";
      } else if (customerPercentage < 5) {
        return "#ffcccc";
      } else if (customerPercentage < 10) {
        return "#ff9999";
      } else if (customerPercentage < 20) {
        return "#ff6666";
      } else {
        return "#ff3333";
      }
    });

  // Add a filter to select the customer percentage for consumers, corporates, and home office categories
  var filter = d3.select("#filter");

  filter.append("select")
    .attr("id", "category-select")
    .on("change", function() {
      // Update the map based on the selected category
      var category = this.value;

      map.selectAll("path")
        .attr("fill", function(d) {
          // Calculate the customer percentage for the state and the selected category
          var customerPercentage = d.properties["SALES_" + category] / d.properties.POPULATION * 100;

          // Return a color based on the customer percentage
          if (customerPercentage < 1) {
            return "#ffffff";
          } else if (customerPercentage < 5) {
            return "#ffcccc";
          } else if (customerPercentage < 10) {
            return "#ff9999";
          } else if (customerPercentage < 20) {
            return "#ff6666";
          } else {
            return "#ff3333";
          }
        });
    });

  // Add a label for the filter
  filter.append("label")
    .text("Category:")

  // Select the consumers category by default
  d3.select("#category-select")
    .property("value", "CONSUMERS");

});

