// script.js

// Global Variables
let data;

// Initialize the dashboard after the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  loadData();
});

// Function to load CSV data
function loadData() {
  d3.csv("data/northeastern_rmp_data_updated.csv")
    .then((rawData) => {
      // Parse 'Popular Tags' from string to array
      rawData.forEach((d) => {
        d["Popular Tags"] = JSON.parse(d["Popular Tags"]);
        d["Average Rating (Out of 5)"] = +d["Average Rating (Out of 5)"];
        d["Number of Ratings"] = +d["Number of Ratings"];
        d["Would Take Again (Percent)"] = +d["Would Take Again (Percent)"];
        d["Level of Difficulty (Out of 5)"] =
          +d["Level of Difficulty (Out of 5)"];
      });

      data = rawData;
      initializeDashboard();
    })
    .catch((error) => {
      console.error("Error loading the data file:", error);
      alert(
        "Data file not found. Please ensure 'northeastern_rmp_data_updated.csv' is in the 'data' directory."
      );
    });
}

// Function to initialize the dashboard components
function initializeDashboard() {
  populateCollegeDropdown();
  renderTagChart();
  renderCommentsChart();
  renderHeatmap();
  renderHistogram();
  renderScatterPlot();
  renderWordCloud();
  embedSentimentAnalysis();
}

// Populate College Selection Dropdown
function populateCollegeDropdown() {
  const collegeSelect = document.getElementById("college-select");
  const colleges = Array.from(
    new Set(data.map((d) => d["NEU_Colleges"]))
  ).sort();
  colleges.forEach((college) => {
    const option = document.createElement("option");
    option.value = college;
    option.text = college;
    collegeSelect.appendChild(option);
  });

  // Set event listener for dropdown change
  collegeSelect.addEventListener("change", function () {
    updateVisualizations(this.value);
  });

  // Trigger initial update with the first college
  updateVisualizations(colleges[0]);
}

// Function to update all visualizations based on selected college
function updateVisualizations(selectedCollege) {
  renderTagChart(selectedCollege);
  renderCommentsChart(selectedCollege);
  renderHeatmap(selectedCollege);
  renderHistogram(selectedCollege);
  renderScatterPlot(selectedCollege);
  renderWordCloud(selectedCollege);
}

// 1. Tag Frequency Bar Chart using Vega-Lite
function renderTagChart(selectedCollege = null) {
  // Filter data based on selected college
  let filteredData = data;
  if (selectedCollege) {
    filteredData = data.filter((d) => d["NEU_Colleges"] === selectedCollege);
  }

  // Explode 'Popular Tags'
  let explodedTags = [];
  filteredData.forEach((d) => {
    d["Popular Tags"].forEach((tag) => {
      explodedTags.push({
        "Popular Tags": tag,
        Department: d["Department"],
        NEU_Colleges: d["NEU_Colleges"],
        "Average Rating": d["Average Rating (Out of 5)"],
        Reviews: d["Reviews"],
      });
    });
  });

  // Aggregate tag counts
  const tagCounts = {};
  explodedTags.forEach((d) => {
    const key = `${d["Popular Tags"]}|${d["NEU_Colleges"]}|${d["Department"]}`;
    if (tagCounts[key]) {
      tagCounts[key].count += 1;
    } else {
      tagCounts[key] = {
        "Popular Tags": d["Popular Tags"],
        Department: d["Department"],
        NEU_Colleges: d["NEU_Colleges"],
        count: 1,
      };
    }
  });

  const aggregatedData = Object.values(tagCounts);

  // Vega-Lite Specification
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: `Tag Frequency for ${selectedCollege}`,
    data: {
      values: aggregatedData,
    },
    mark: "bar",
    encoding: {
      x: {
        field: "count",
        type: "quantitative",
        title: "Tag Frequency",
      },
      y: {
        field: "Popular Tags",
        type: "nominal",
        sort: "-x",
        title: "Popular Tags",
      },
      color: {
        field: "Department",
        type: "nominal",
        legend: { title: "Department" },
      },
      tooltip: [
        { field: "Popular Tags", type: "nominal" },
        { field: "count", type: "quantitative" },
        { field: "NEU_Colleges", type: "nominal" },
        { field: "Department", type: "nominal" },
      ],
    },
    width: 800,
    height: 500,
    title: `Tag Frequency for ${selectedCollege}`,
  };

  // Embed the chart
  vegaEmbed("#tag-chart", spec, { actions: false })
    .then((result) => {
      // Optional: Additional interactivity
    })
    .catch(console.error);
}

// 2. Comments Chart using D3.js (Displaying truncated comments)
function renderCommentsChart(selectedCollege = null) {
  // Clear previous chart
  d3.select("#comments-chart").html("");

  // Filter data based on selected college
  let filteredData = data;
  if (selectedCollege) {
    filteredData = data.filter((d) => d["NEU_Colleges"] === selectedCollege);
  }

  // Truncate comments to 100 characters
  const comments = filteredData.map((d) => ({
    Comments: d["Reviews"] ? d["Reviews"].substring(0, 100) : "",
  }));

  // Create a simple list of comments
  const commentsContainer = d3
    .select("#comments-chart")
    .append("div")
    .attr("class", "comments-container");

  comments.forEach((comment) => {
    commentsContainer.append("p").text(comment["Comments"]);
  });

  // Optional: Add tooltips or modal pop-ups for full comments
}

// 3. Metrics Heatmap using Vega-Lite
function renderHeatmap(selectedCollege = null) {
  // For simplicity, we'll create a separate heatmap without filtering by college
  // Adjust the specification as needed

  // Melt the data to long format
  const metrics = [
    "Average Rating (Out of 5)",
    "Number of Ratings",
    "Would Take Again (Percent)",
    "Level of Difficulty (Out of 5)",
  ];

  let meltedData = [];
  data.forEach((d) => {
    metrics.forEach((metric) => {
      meltedData.push({
        Department: d["Department"],
        NEU_Colleges: d["NEU_Colleges"],
        Metric: metric,
        Value: +d[metric],
      });
    });
  });

  // Vega-Lite Specification for Heatmap
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Heatmap: Insights on Northeastern Ratings",
    data: {
      values: meltedData,
    },
    mark: "rect",
    encoding: {
      x: {
        field: "Department",
        type: "nominal",
        title: "Department",
        sort: "-y",
      },
      y: {
        field: "NEU_Colleges",
        type: "nominal",
        title: "College",
      },
      color: {
        field: "Value",
        type: "quantitative",
        title: "Metric Value",
        scale: {
          scheme: "plasma",
          domain: [0, 5],
        },
      },
      tooltip: [
        { field: "Department", type: "nominal" },
        { field: "NEU_Colleges", type: "nominal" },
        { field: "Metric", type: "nominal" },
        { field: "Value", type: "quantitative", format: ".2f" },
      ],
    },
    width: 900,
    height: 600,
    title: {
      text: ["Heatmap: Insights on Northeastern Ratings"],
      subtitle: ["Visualizing department-level metrics across colleges."],
      fontSize: 20,
      subtitleFontSize: 15,
      color: "darkblue",
      subtitleColor: "gray",
      anchor: "start",
    },
  };

  // Embed the heatmap
  vegaEmbed("#heatmap", spec, { actions: false })
    .then((result) => {
      // Optional: Additional interactivity
    })
    .catch(console.error);
}

// 4. Histogram Chart using Chart.js
function renderHistogram(selectedCollege = null) {
  // Remove existing canvas if any
  d3.select("#histogram-chart").html("");

  // Create a canvas element
  const canvas = d3
    .select("#histogram-chart")
    .append("canvas")
    .attr("id", "histogramCanvas")
    .attr("width", 800)
    .attr("height", 400);

  const ctx = document.getElementById("histogramCanvas").getContext("2d");

  // Filter data based on selected college
  let filteredData = data;
  if (selectedCollege) {
    filteredData = data.filter((d) => d["NEU_Colleges"] === selectedCollege);
  }

  // Extract Average Ratings
  const ratings = filteredData.map((d) => d["Average Rating (Out of 5)"]);

  // Create histogram using Chart.js
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: [...Array(11).keys()].map((i) => (i * 0.5).toFixed(1)),
      datasets: [
        {
          label: "Number of Professors",
          data: createHistogramData(ratings, 10, 0, 5),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Average Professor Rating by College",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Number of Professors: ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Average Rating",
          },
        },
        y: {
          title: {
            display: true,
            text: "Number of Professors",
          },
          beginAtZero: true,
        },
      },
    },
  });
}

// Helper function to create histogram data
function createHistogramData(data, bins, min, max) {
  const binSize = (max - min) / bins;
  const histogram = Array(bins).fill(0);
  data.forEach((d) => {
    if (d >= min && d <= max) {
      const index = Math.min(Math.floor((d - min) / binSize), bins - 1);
      histogram[index]++;
    }
  });
  return histogram;
}

// 5. Scatter Plot using Plotly.js
function renderScatterPlot(selectedCollege = null) {
  // Remove existing plot if any
  d3.select("#scatterplot").html("");

  // Filter data
  let filteredData = data.filter((d) => {
    return (
      d["Number of Ratings"] >= 5 &&
      !d["NEU_Colleges"].includes("Unknown") &&
      !d["NEU_Colleges"].includes("School of Law")
    );
  });

  // Optionally filter by selected college
  if (selectedCollege) {
    filteredData = filteredData.filter(
      (d) => d["NEU_Colleges"] === selectedCollege
    );
  }

  // Calculate correlations per college
  const colleges = Array.from(
    new Set(filteredData.map((d) => d["NEU_Colleges"]))
  );
  const correlationData = colleges.map((college) => {
    const group = filteredData.filter((d) => d["NEU_Colleges"] === college);
    const corr = calculateCorrelation(
      group.map((d) => d["Level of Difficulty (Out of 5)"]),
      group.map((d) => d["Average Rating (Out of 5)"])
    );
    return { college, corr };
  });

  // Create scatter plot with Plotly
  const trace = {
    x: filteredData.map((d) => d["Level of Difficulty (Out of 5)"]),
    y: filteredData.map((d) => d["Average Rating (Out of 5)"]),
    mode: "markers",
    type: "scatter",
    marker: { color: "coral" },
    text: filteredData.map((d) => d["NEU_Colleges"]),
    hoverinfo: "text+x+y",
  };

  const layout = {
    title: "Scatter Plot of Level of Difficulty vs Average Rating per College",
    xaxis: { title: "Level of Difficulty (Out of 5)" },
    yaxis: { title: "Average Rating (Out of 5)" },
    showlegend: false,
  };

  Plotly.newPlot("scatterplot", [trace], layout);

  // Add correlation annotations
  correlationData.forEach((d) => {
    Plotly.addAnnotations("scatterplot", [
      {
        x: 4.5,
        y: 0.5,
        xref: "x",
        yref: "y",
        text: `R = ${d.corr.toFixed(2)}`,
        showarrow: false,
        font: { size: 12, color: "black" },
        align: "left",
      },
    ]);
  });
}

// Helper function to calculate Pearson correlation
function calculateCorrelation(x, y) {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  const cov = x
    .map((xi, idx) => (xi - meanX) * (y[idx] - meanY))
    .reduce((a, b) => a + b, 0);
  const stdX = Math.sqrt(
    x.map((xi) => Math.pow(xi - meanX, 2)).reduce((a, b) => a + b, 0)
  );
  const stdY = Math.sqrt(
    y.map((yi) => Math.pow(yi - meanY, 2)).reduce((a, b) => a + b, 0)
  );
  return cov / (stdX * stdY);
}

// 6. Word Cloud using WordCloud.js
function renderWordCloud(selectedCollege = null) {
  // Get the word frequency
  let filteredData = data;
  if (selectedCollege) {
    filteredData = data.filter((d) => d["NEU_Colleges"] === selectedCollege);
  }

  let wordFreq = {};
  filteredData.forEach((d) => {
    d["Popular Tags"].forEach((tag) => {
      wordFreq[tag] = (wordFreq[tag] || 0) + 1;
    });
  });

  const wordArray = Object.keys(wordFreq).map((word) => [word, wordFreq[word]]);

  // Generate Word Cloud
  WordCloud(document.getElementById("wordcloud"), {
    list: wordArray,
    gridSize: Math.round((16 * 800) / 1024),
    weightFactor: function (size) {
      return size * 5;
    },
    fontFamily: "Times, serif",
    color: "random-dark",
    rotateRatio: 0.5,
    rotationSteps: 2,
    backgroundColor: "#f0f0f0",
  });
}

// 7. Embed Sentiment Analysis HTML
function embedSentimentAnalysis() {
  fetch("public/college_sentiment_analysis.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("sentiment-analysis").innerHTML = html;
    })
    .catch((error) => {
      console.error("Error loading sentiment analysis HTML:", error);
    });
}
