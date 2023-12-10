const jsonFile = "../data/us-states.json";
const csvFile = "../data/superstore-subset-processed.csv";
const salesColors = d3
    .scaleQuantize()
    .range(["#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#005a32"]);
const profitColors = d3
    .scaleQuantize()
    .range([
        "#dec9e9",
        "#c19ee0",
        "#815ac0",
        "#6247aa",
        "#ff4800",
        "#ff6d00",
        "#ff9e00",
        "#ffb600",
    ]);
"#ff8500", profitColors.domain([-1, 1]);

Number.prototype.formatMoney = function (c, d, t) {
    var n = this,
        c = isNaN((c = Math.abs(c))) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt((n = Math.abs(Number(n) || 0).toFixed(c)))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return (
        s +
        (j ? i.substr(0, j) + t : "") +
        i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
        (c
            ? d +
              Math.abs(n - i)
                  .toFixed(c)
                  .slice(2)
            : "")
    );
};
function floorMoney(x) {
    if (Math.abs(x) > 1000) {
        return (x / 1000).toFixed(0) + "K";
    } else if (Math.abs(x) > 100) {
        return (x / 100).toFixed(0) + "00";
    } else {
        return x.toFixed(0);
    }
}
var tip = d3
    .tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function (state) {
        if (!!state.properties.profit) {
            var color = state.properties.profit >= 0 ? "#5fba7d" : "red";
            return (
                "<strong style='color:orange'>State:</strong> <span>" +
                state.properties.name +
                "</span>" +
                "</br><strong style='color:orange'>Sales:</strong> <span>" +
                state.properties.sales.formatMoney() +
                "$</span>" +
                "</br><strong style='color:orange'>Profit:</strong> <span style='color:" +
                color +
                "'>" +
                state.properties.profit.formatMoney() +
                "$</span>"
            );
        } else {
            return "no data";
        }
    });
var app = new Vue({
    el: "#app",
    data: {
        years: null,
        jsonData: null,
        csvData: null,
        currentState: null,
        currentType: null,
        maxProfit: null,
        minProfit: null,
        currentYear: null,
        selectedYear: null,
    },
    mounted() {
        d3.json(jsonFile).then((jsonData) => {
            this.jsonData = jsonData;
            d3.csv(csvFile).then((csvData) => {
                this.csvData = csvData;
                this.drawMap();
                this.initData();
                this.setYear(this.currentYear);
                this.drawBarChart();
            });
        });
    },
    methods: {
        buttonClass() {
            return "p-2 m-2 text-gray-800 bg-orange-500";
        },
        drawMap() {
            var width =
                (document.getElementById("maparea").offsetWidth * 3) / 4;
            var height = (width * 3) / 4;
            var map = d3.select("#map");
            var scale = (1280 * width) / 960;
            var projection = d3
                .geoAlbersUsa()
                .scale(scale)
                .translate([width / 2, height / 2]);
            var path = d3.geoPath().projection(projection);
            map.call(tip);
            d3.select("#map")
                .selectAll("path")
                .data(this.jsonData.features)
                .enter()
                .append("path")
                .attr("id", (s) => "path-" + s.properties.name)
                .attr("d", path)
                .attr("stroke", "white")
                .attr("stroke-width", "1")
                .on("mouseover", tip.show) // 绑定鼠标事件
                .on("mouseout", tip.hide)
                .on("click", (s) => this.setState(s.properties.name));
        },
        updateMap() {
            function aggMap(groups) {
                var sales = 0.0;
                var profit = 0.0;
                groups.forEach((e) => {
                    profit += +e["Profit"];
                    sales += +e["Sales"];
                });
                return {
                    profit: profit,
                    sales: sales,
                };
            }
            var currentData = d3
                .nest()
                .key((e) => e["State"])
                .rollup(aggMap)
                .entries(this.csvDataThisYear());
            this.maxProfit = d3.max(currentData, (state) => state.value.profit);
            this.minProfit = d3.min(currentData, (state) => state.value.profit);
            var maxSales = d3.max(currentData, (state) => state.value.sales);
            var minSales = d3.min(currentData, (state) => state.value.sales);
            salesColors.domain([minSales, maxSales]).nice();
            d3.select("#map")
                .selectAll("path")
                .transition()
                .duration(500)
                .ease(d3.easeLinear)
                .style("fill", (state) => {
                    var stateData = currentData.filter(
                        (e) => e.key == state.properties.name
                    );
                    if (stateData.length == 0) {
                        return "#888";
                    }
                    stateData = stateData[0].value;
                    state.properties.profit = stateData.profit;
                    state.properties.sales = stateData.sales;
                    if (this.currentType == "profit") {
                        return profitColors(
                            stateData.profit > 0
                                ? stateData.profit / this.maxProfit
                                : -stateData.profit / this.minProfit
                        );
                    } else {
                        return salesColors(stateData.sales);
                    }
                });

            this.drawLegend();
        },
        initData() {
            this.years = d3
                .map(this.csvData, (x) => x["OrderYear"])
                .keys()
                .sort();
            this.categories = d3
                .map(this.csvData, (x) => x["ProductCategory"])
                .keys()
                .sort();
            this.subcategories = d3
                .map(this.csvData, (x) => x["ProductSubCategory"])
                .keys()
                .sort();
            this.currentType = "profit";
            this.currentYear = "All";
        },
        csvDataThisYear() {
            if (this.currentYear == "All") {
                return this.csvData;
            } else {
                return d3
                    .nest()
                    .key((e) => e["OrderYear"])
                    .entries(this.csvData)
                    .filter((e) => e.key == this.currentYear)[0].values;
            }
        },
        setYear(year) {
            this.currentYear = year;
            d3.select("#years-group").selectAll(".el-button");
            d3.select("#button-" + year);
            this.updateMap();
            if (this.currentState != null) {
                this.drawBarChart();
                this.drawPieChart();
            }
            var newYear = year;
            var otherSelect = document.getElementById("selectButton");
            otherSelect.value = newYear;
            var changeEvent = new Event("change");
            otherSelect.dispatchEvent(changeEvent);
        },
        setType(t) {
            this.currentType = t;
            this.updateMap();
            if (this.currentState != null) {
                this.drawBarChart();
                this.drawPieChart();
            }
        },
        setState(s) {
            this.currentState = s;
            d3.selectAll("path")
                .attr("stroke", "white")
                .attr("stroke-width", "1");
            d3.select("#path-" + s)
                .attr("stroke", "orange")
                .attr("stroke-width", "5");
            this.drawBarChart();
            this.drawPieChart();
            this.drawLineChart();
        },
        drawLegend() {
            d3.select("#legend").text("");

            var legend = d3
                .select("#legend")
                .append("ul")
                .attr("class", "key")
                .style("width", "30px");
            if (this.currentType == "profit") {
                legend
                    .selectAll("li.key")
                    .data(profitColors.range().reverse())
                    .enter()
                    .append("li")
                    .attr("class", "key")
                    .style("border-left-color", String)
                    .text((color) => {
                        var range = profitColors.invertExtent(color);
                        var value =
                            range[0] *
                            (range[0] < 0 ? -this.minProfit : this.maxProfit);
                        return floorMoney(value);
                    });
            } else {
                legend
                    .selectAll("li.key")
                    .data(salesColors.range().reverse())
                    .enter()
                    .append("li")
                    .attr("class", "key")
                    .style("border-left-color", String)
                    .style("width", "30px")
                    .text((color) => {
                        var range = salesColors.invertExtent(color);
                        return floorMoney(range[0]);
                    });
            }
        },
        drawBarChart() {
            function aggBar(groups) {
                var sales = 0.0;
                var profit = 0.0;
                groups.forEach((e) => {
                    profit += +e["Profit"];
                    sales += +e["Sales"];
                });
                return {
                    profit: profit,
                    sales: sales,
                };
            }
            var currentData = d3
                .nest()
                .key((e) => e["State"])
                .rollup(this.aggMap)
                .entries(this.csvDataThisYear())
                .filter((e) => e.key == this.currentState);
            var row = ["x"];
            var col = ["profit"];
            if (currentData.length > 0) {
                currentData = d3
                    .nest()
                    .key((e) => e["ProductSubCategory"])
                    .rollup(aggBar)
                    .entries(currentData[0].values)
                    .sort(function (a, b) {
                        return b.value.profit - a.value.profit;
                    });

                currentData.forEach((e) => {
                    row.push(e.key);
                    col.push(e.value.profit);
                });
            }
            var barChart = bb.generate({
                title: {
                    text:
                        this.currentYear +
                        " products profit of " +
                        this.currentState,
                },
                data: {
                    columns: [row, col],
                    x: "x",
                    groups: [["profit"]],
                    color: (color, d) => {
                        c = profitColors(
                            d.value > 0
                                ? d.value / this.maxProfit
                                : -d.value / this.minProfit
                        );
                        return c;
                    },
                    //order: "desc",
                    type: "bar",
                },
                axis: {
                    x: {
                        type: "category",
                        tick: {
                            text: {
                                show: true,
                            },
                        },
                    },
                },
                legend: {
                    show: false,
                },
                bindto: "#bar-chart",
            });
        },
        drawPieChart() {
            function aggBar(groups) {
                var sales = 0.0;
                var profit = 0.0;
                groups.forEach((e) => {
                    profit += +e["Profit"];
                    sales += +e["Sales"];
                });
                return {
                    profit: profit,
                    sales: sales,
                };
            }
            var currentData = d3
                .nest()
                .key((e) => e["State"])
                .rollup(this.aggMap)
                .entries(this.csvDataThisYear())
                .filter((e) => e.key == this.currentState);
            var cols = [];
            if (currentData.length > 0) {
                currentData = d3
                    .nest()
                    .key((e) => e["ProductSubCategory"])
                    .rollup(aggBar)
                    .entries(currentData[0].values)
                    .sort(function (a, b) {
                        return b.value.profit - a.value.profit;
                    });

                currentData.forEach((e) => {
                    cols.push([e.key, e.value.sales]);
                });
            }
            var pieChart = bb.generate({
                title: {
                    text:
                        this.currentYear +
                        " product sales % of " +
                        this.currentState,
                },
                data: {
                    columns: cols,
                    //order: "desc",
                    type: "pie",
                    color: (color, d) => {
                        var v = null;
                        if (typeof d == "object") {
                            v = currentData.find((e) => e.key == d.id).value
                                .profit;
                        } else {
                            v = currentData.find((e) => e.key == d).value
                                .profit;
                        }
                        return profitColors(
                            v > 0 ? v / this.maxProfit : -v / this.minProfit
                        );
                    },
                },
                legend: {
                    show: true,
                },
                bindto: "#pie-chart",
            });
            d3.select("#pie-chart")
                .selectAll(".bb-legend-item")
                .on("click", null);
        },
    },
});
