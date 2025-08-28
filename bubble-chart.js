class BubbleChart {
  constructor(container, width, height) {
    this.container = container;
    this.width = width;
    this.height = height;
  }

  setData(data) {
    // Transform the flat array into hierarchical structure
    const teamMap = new Map();
    
    // Group data by teams
    data.forEach(item => {
      const { module, application, team } = item;
      
      if (!teamMap.has(team)) {
        teamMap.set(team, {
          name: team,
          children: [],
          applications: new Map(),
          modules: []
        });
      }
      
      const teamData = teamMap.get(team);
      
      // If module has an application, group it under the application
      if (application && application.trim() !== '') {
        if (!teamData.applications.has(application)) {
          teamData.applications.set(application, {
            name: application,
            children: []
          });
        }
        
        teamData.applications.get(application).children.push({
          name: module
        });
      } else {
        // If module doesn't belong to an application, add it directly to team
        teamData.modules.push({
          name: module
        });
      }
    });
    
    // Build the final hierarchical structure
    const teams = Array.from(teamMap.values()).map(team => {
      const children = [];
      
      // Add applications with their modules
      team.applications.forEach(app => {
        children.push(app);
      });
      
      // Add standalone modules
      children.push(...team.modules);
      
      return {
        name: team.name,
        children: children
      };
    });
    
    if (teams.length > 1) {
      this.data = {
        name: 'FOLIO',
        children: teams,
      };
    } else {
      this.data = {
        name: `${teams[0].name} - ${teams[0].children[0].name}`,
        children: teams[0].children[0].children,
      };

      console.log(this.data)
    }

    return this;
  }

  reset() {
    this.data = null;
    document.getElementById(this.container).innerHTML = '';

    return this;
  }

  render() {
    const data = this.data;

    if (!data) throw Error('data is not defined');

    // Specify the chart’s dimensions.
    const width = this.width;
    const height = this.height;

    // Create the color scale.
    const color = d3.scaleLinear()
      .domain([0, 5])
      .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
      .interpolate(d3.interpolateHcl);

    // Compute the layout.
    const pack = data => d3.pack()
      .size([width, height])
      .padding(3)
      (d3.hierarchy(data)
      .sum(d => d.value || 1)
      .sort((a, b) => b.value - a.value));
    const root = pack(data);

    // Create the SVG container.
    const svg = d3.create("svg")
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 auto; background: ${color(0)}; cursor: pointer;`);

    // Append the nodes.
    const node = svg.append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
      .attr("fill", d => d.children ? color(d.depth) : "white")
      .attr("pointer-events", d => !d.children ? "none" : null)
      .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
      .on("mouseout", function() { d3.select(this).attr("stroke", null); })
      .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

    // Append the text labels.
    const label = svg.append("g")
      .style("font", "10px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .style("fill-opacity", d => d.parent === root ? 1 : 0)
      .style("display", d => d.parent === root ? "inline" : "none")
      .text(d => d.data.name);

    // Create the zoom behavior and zoom immediately in to the initial focus node.
    svg.on("click", (event) => zoom(event, root));
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
      const k = width / v[2];

      view = v;

      label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("r", d => d.r * k);
    }

    function zoom(event, d) {
      const focus0 = focus;

      focus = d;

      const transition = svg.transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", d => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return t => zoomTo(i(t));
        });

      label
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
      .transition(transition)
        .style("fill-opacity", d => d.parent === focus ? 1 : 0)
        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    document.getElementById(this.container).appendChild(svg.node());
  }
}