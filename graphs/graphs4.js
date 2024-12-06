const width = 800;
const height = 600;
const margin = { top: 50, right: 150, bottom: 50, left: 70 };

function drawInteractiveScatterPlot(data) {
  const svg = d3
    .select("#scatterplot-individual")
    .append("svg")
    .attr("width", width + margin.right)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d["Sentiment Score"]))
    .nice()
    .range([0, width - margin.left - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d["Average Rating (Out of 5)"]))
    .nice()
    .range([height - margin.top - margin.bottom, 0]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // add x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("x", (width - margin.left - margin.right) / 2)
    .attr("y", 40)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Sentiment Score");

  // add y-axis
  svg
    .append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height - margin.top - margin.bottom) / 2)
    .attr("y", -50)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Average Rating (Out of 5)");

  // add circles
  const circles = svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d["Sentiment Score"]))
    .attr("cy", (d) => yScale(d["Average Rating (Out of 5)"]))
    .attr("r", 6)
    .attr("fill", (d) => colorScale(d["NEU_Colleges"]))
    .attr("opacity", 0.9);

  // tooltip for hover information
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("display", "none");

  circles
    .on("mouseover", function (event, d) {
      d3.select(this).attr("r", 10);
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px")
        .style("display", "inline-block")
        .html(
          `Professor: ${d["First Name"]} ${d["Last Name"]}<br>College: ${
            d["NEU_Colleges"]
          }<br>Sentiment: ${d["Sentiment Score"].toFixed(2)}<br>Rating: ${d[
            "Average Rating (Out of 5)"
          ].toFixed(2)}`
        );
    })
    .on("mouseout", function () {
      d3.select(this).attr("r", 6);
      tooltip.style("display", "none");
    });

  // add Legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - margin.left - 150},${margin.top})`);

  const colleges = Array.from(new Set(data.map((d) => d["NEU_Colleges"])));

  legend
    .selectAll("rect")
    .data(colleges)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 25)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", (d) => colorScale(d))
    .on("click", function (event, selectedCollege) {
      const isActive = d3.select(this).classed("active");
      legend.selectAll("rect").classed("active", false);
      d3.select(this).classed("active", !isActive);

      if (!isActive) {
        circles
          .attr("fill", (d) =>
            d["NEU_Colleges"] === selectedCollege
              ? colorScale(d["NEU_Colleges"])
              : "lightgrey"
          )
          .attr("opacity", (d) =>
            d["NEU_Colleges"] === selectedCollege ? 0.9 : 0.2
          );
      } else {
        circles
          .attr("fill", (d) => colorScale(d["NEU_Colleges"]))
          .attr("opacity", 0.9);
      }
    });

  legend
    .selectAll("text")
    .data(colleges)
    .enter()
    .append("text")
    .attr("x", 30)
    .attr("y", (d, i) => i * 25 + 15)
    .text((d) => d)
    .attr("font-size", "12px")
    .attr("alignment-baseline", "middle");
}

// load and display interactive scatter plot
d3.json(
  "https://raw.githubusercontent.com/patela22/d3json/main/scatter_data.json"
).then(function (data) {
  drawInteractiveScatterPlot(data);
});
