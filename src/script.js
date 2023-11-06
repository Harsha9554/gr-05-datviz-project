// set the dimensions and margins of the graph
var margin = { top: 20, right: 70, bottom: 30, left: 50 },
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var tooltip = d3
    .select("#myscatterplot")
    .append("div")
    .attr("id", "tooltip")
    .attr("style", "position: absolute; opacity: 0;");

var svg = d3
    .select("#myscatterplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv("../data/superstore-csv.csv", function loadCallback(error, data) {
    if (error) throw error;

    // List of groups
    var allGroup = d3
        .map(data, function (d) {
            return d.Region;
        })
        .keys();

    var year = d3
        .map(data, function (d) {
            return d.OrderDate.split("/")[2];
        })
        .keys()
        .sort();
    console.log(year);

    var cust = d3
        .map(data, function (d) {
            return d["Customer"];
        })
        .keys();

    // add the options to the button
    d3.select("#selectButton")
        .selectAll("myOptions")
        .data(year)
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        }) // text showed in the menu
        .attr("value", function (d) {
            return d;
        }); // corresponding value returned by the button

    // Add X axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 10)
        .text("Sales");

    // Y axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top - height / 2 + 20)
        .text("Profit");

    var region = d3
        .map(data, function (d) {
            return d.Region;
        })
        .keys();
    var color = d3.scaleOrdinal().domain(region).range(d3.schemeSet2);
    const getDate = (string) =>
        (([month, day, year]) => ({ day, month, year }))(string.split("/"));

    // Scale the range of the data
    x.domain([
        0,
        d3.max(data, function (d) {
            return +d.Sales;
        }),
    ]);
    y.domain(
        d3.extent(data, function (d) {
            return +d.Profit;
        })
    );

    // Add the valueline path.
    const scatter = svg
        .selectAll("circle")
        .data(
            data.filter(function (d) {
                return getDate(d.OrderDate).year == year[0];
            })
        )
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return x(+d.Sales);
        })
        .attr("cy", function (d) {
            return y(+d.Profit);
        })
        .attr("r", function (d) {
            return 5;
        })
        .attr("fill", function (d) {
            return color(d.Region);
        })
        .attr("stroke", "black")
        .on("mouseover", function (d) {
            var html =
                "<br><b>Customer Name:<b/><b>" +
                d.Customer +
                "</br>Region: <b/><b>" +
                d.Region +
                "</br>Sales: </b></b>" +
                d.Sales +
                "</b></br>Profit: <b/><b>" +
                d.Profit +
                "</b>";

            tooltip
                .html(html)
                .style("left", d3.event.pageX + 15 + "px")
                .style("top", d3.event.pageY - 28 + "px")
                .transition()
                .duration(200)
                .style("opacity", 1);
        })
        .on("mouseout", function (d) {
            d3.select("#tooltip")
                .transition()
                .duration(300)
                .style("opacity", 0);
        });

    function update(selectedGroup) {
        // Create new data with the selection
        var dataFilter = data.filter(function (d) {
            return getDate(d.OrderDate).year == selectedGroup;
        });

        // Give these new data to update line
        scatter
            .data(dataFilter)
            .transition()
            .duration(1000)
            .attr("cx", function (d) {
                return x(+d.Sales);
            })
            .attr("cy", function (d) {
                return y(+d.Profit);
            })
            .attr("fill", function (d) {
                return color(d.Region);
            });
    }

    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function (d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value");
        console.log(selectedOption);
        // run the updateChart function with this selected option
        update(selectedOption);
    });

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g").call(d3.axisLeft(y));

    var legend = svg
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(region.reverse())
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend
        .append("rect")
        .attr("x", width)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color);

    legend
        .append("text")
        .attr("x", width + 60)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function (d) {
            return d;
        });
});
