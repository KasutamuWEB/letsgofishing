import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import ResizeObserver from 'resize-observer-polyfill';

const TideVisualization = () => {
  const svgRef = useRef();
  const containerRef = useRef();
  
  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        svg.attr("width", width).attr("height", height);
        createD3Plot(svg, width, height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.unobserve(containerRef.current);
  }, []);

  function createD3Plot(svg, width, height) {
    svg.selectAll("*").remove(); // Clear previous content

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    Promise.all([
      fetch('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=20240728&end_date=20240729&station=9410170&product=water_level&datum=MLLW&time_zone=gmt&units=english&format=json')
        .then(response => response.json()),
      fetch('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=20240728&end_date=20240729&station=9410170&product=predictions&datum=MLLW&time_zone=gmt&units=english&interval=hilo&format=json')
        .then(response => response.json())
    ])
    .then(([waterLevelData, tidePredictionData]) => {
      const parsedData = waterLevelData.data.map(d => ({
        time: new Date(d.t),
        value: +d.v
      }));

      const highLowData = tidePredictionData.predictions.map(d => ({
        time: new Date(d.t),
        value: +d.v,
        type: d.type
      }));

      const highTides = highLowData.filter(d => d.type === 'H');
      const lowTides = highLowData.filter(d => d.type === 'L');

      const x = d3.scaleTime().rangeRound([0, innerWidth]);
      const y = d3.scaleLinear().rangeRound([innerHeight, 0]);
      const x_extent = d3.extent(parsedData, d => d.time);
      const y_extent = d3.extent(parsedData, d => d.value);
      const y_extent_diff = 0.10 * Math.abs(y_extent[1] - y_extent[0]);
      x.domain(x_extent);
      y.domain([y_extent[0] - y_extent_diff, y_extent[1] + y_extent_diff]);

      const line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.value));

      // Add horizontal lines
      const yAxis = d3.axisLeft(y).ticks(Math.ceil(y_extent[1]));
      g.append("g")
        .call(yAxis)
        .selectAll("g.tick")
        .append("line")
        .attr("class", "horizontal-line")
        .attr("x1", 0)
        .attr("x2", innerWidth);

      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x));

      g.append("g")
        .call(d3.axisLeft(y));

      // Add the line path with animation
      const path = g.append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);

      const totalLength = path.node().getTotalLength();

      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Add gradient
      const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "line-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", y(y_extent[1]))
        .attr("x2", 0)
        .attr("y2", y(y_extent[0]));

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "steelblue")
        .attr("stop-opacity", 1);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "steelblue")
        .attr("stop-opacity", 0);

      // Add the area with animation
      const area = g.append("path")
        .datum(parsedData)
        .attr("fill", "url(#line-gradient)")
        .attr("stroke", "none")
        .attr("d", d3.area()
          .x(d => x(d.time))
          .y0(innerHeight)
          .y1(d => y(d.value))
        );

      area
        .attr("opacity", 0)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("opacity", 1);

      // Tooltip and vertical line
      const tooltip = d3.select(".tooltip");
      const verticalLine = g.append("line")
        .attr("class", "vertical-line")
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("display", "none");

      svg.on("mousemove", function(event) {
        const [mouseX] = d3.pointer(event);
        const mouseTime = x.invert(mouseX - margin.left);
        const bisect = d3.bisector(d => d.time).left;
        const idx = bisect(parsedData, mouseTime, 1);
        const d0 = parsedData[idx - 1];
        const d1 = parsedData[idx];
        
        let d;
        if (d0 && d1) {
          d = mouseTime - d0.time > d1.time - mouseTime ? d1 : d0;
        } else {
          d = d0 || d1; // Either d0 or d1 might be undefined
        }

        if (d) {
          verticalLine
            .attr("x1", x(d.time))
            .attr("x2", x(d.time))
            .style("display", "block");

          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`)
            .style("display", "block")
            .html(`<div style="background: white; padding: 5px; border: 1px solid black;">
                    <strong>Time:</strong> ${d3.timeFormat("%Y-%m-%d %H:%M:%S")(d.time)}<br>
                    <strong>Tide:</strong> ${d.value} ft
                   </div>`);
        }
      });

      svg.on("mouseout", function() {
        verticalLine.style("display", "none");
        tooltip.style("display", "none");
      });

      // Fishing windows
      function computeFishingWindows(tides) {
        const windows = [];
        tides.forEach(tide => {
          const tideTime = tide.time;
          const startTime = new Date(tideTime - 2 * 60 * 60 * 1000); // 2 hours before
          const endTime = new Date(tideTime + 2 * 60 * 60 * 1000); // 2 hours after
          windows.push({ start: startTime, end: endTime });
        });
        return windows;
      }

      const highTideWindows = computeFishingWindows(highTides);
      const lowTideWindows = computeFishingWindows(lowTides);
      const allFishingWindows = highTideWindows.concat(lowTideWindows);
      allFishingWindows.sort((a, b) => a.start - b.start);

      g.selectAll(".fishing-window")
        .data(allFishingWindows)
        .enter()
        .append("rect")
        .attr("class", "fishing-window")
        .attr("x", d => x(d.start))
        .attr("y", 0)
        .attr("width", d => x(d.end) - x(d.start))
        .attr("height", innerHeight)
        .attr("fill", d3.rgb(229, 222, 247))
        .attr("opacity", 0.3)
        .attr("clip-path", "url(#clip)");

      // Clip path to prevent the fishing window from exceeding the y-axis
      svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("x", margin.left)
        .attr("y", margin.top);

      // Current time indicator
      const currentTime = new Date();
      g.append("line")
        .attr("class", "current-time")
        .attr("x1", x(currentTime))
        .attr("x2", x(currentTime))
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", "red")
        .attr("stroke-width", 2);
    })
    .catch(error => console.error('Error fetching data:', error));
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef}></svg>
      <div className="tooltip" style={{ display: 'none', position: 'absolute' }}></div>
    </div>
  );
};

export default TideVisualization;
