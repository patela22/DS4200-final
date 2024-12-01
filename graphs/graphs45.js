const width = 800;
const height = 600;
const margin = { top: 50, right: 150, bottom: 50, left: 70 };

// draw scatter plot
function drawScatterPlot(data, targetDiv, xLabel, yLabel, showProfessorName) {
  const svg = d3
    .select(targetDiv)
    .append("svg")
    .attr("width", width + margin.right)
    .attr("height", height);

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d["Sentiment Score"]))
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d["Average Rating (Out of 5)"]))
    .range([height - margin.bottom, margin.top]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // get unique colleges for the legend
  const colleges = [...new Set(data.map((d) => d["NEU_Colleges"]))];

  // add x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(10))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text(xLabel);

  // add y-axis
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(10))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text(yLabel);

  // add circles
  svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d["Sentiment Score"]))
    .attr("cy", (d) => yScale(d["Average Rating (Out of 5)"]))
    .attr("r", 6)
    .attr("fill", (d) => colorScale(d["NEU_Colleges"]))
    .attr("opacity", 0.7)
    .on("mouseover", function (event, d) {
      let tooltipContent = `${d["NEU_Colleges"]}<br>Sentiment: ${d[
        "Sentiment Score"
      ].toFixed(2)}<br>Rating: ${d["Average Rating (Out of 5)"].toFixed(2)}`;
      if (showProfessorName) {
        tooltipContent =
          `Professor: ${d["First Name"]} ${d["Last Name"]}<br>` +
          tooltipContent;
      }
      d3.select(".tooltip")
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px")
        .style("display", "inline-block")
        .html(tooltipContent);
    })
    .on("mouseout", function () {
      d3.select(".tooltip").style("display", "none");
    });

  // add Legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - 135},${margin.top})`);

  legend
    .selectAll("rect")
    .data(colleges)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 25)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", (d) => colorScale(d));

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

// load and display individual scatter plot (with professor names)
d3.json(
  "https://raw.githubusercontent.com/patela22/d3json/main/scatter_data.json"
)
  .then(function (data) {
    drawScatterPlot(
      data,
      "#scatterplot-individual",
      "Sentiment Score",
      "Rating",
      true
    );
  })
  .catch((error) => console.error("Error loading average data: ", error));

// load and display average scatter plot (without professor names)
d3.json(
  "https://raw.githubusercontent.com/patela22/d3json/main/average_data.json"
)
  .then(function (data) {
    drawScatterPlot(
      data,
      "#scatterplot-averages",
      "Average Sentiment Score",
      "Average Rating",
      false
    );
  })
  .catch((error) => console.error("Error loading average data: ", error));

// tooltip for hover information
d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("display", "none");
