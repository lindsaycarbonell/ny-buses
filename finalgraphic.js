      $(document).ready(function(){

      console.log('ready');

      d3.csv('assets/school_delays.csv', initMap);

      function initMap(data){


        var mymap = L.map('mapid', {
          center: [40.81432890763712,-73.9500904083252],
          zoom: 13,
          dragging: false,
          zoomControl: false,
          scrollWheelZoom: false
        });

        // mymap = L.map('mapid').setView([40.83641142008943,-73.92631530761719], 12);



        L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGluZHNheWNhcmJvbmVsbCIsImEiOiJjaXRlajNhd2cwNjBkMzJvOW04OWQ0dm5xIn0.GGAg70cv_JpPUXxFvkdY-w').addTo(mymap);

        data.forEach(function(d){

          // debugger
          // d.total_delay/5
          // d.median_delay*10
          // d.num_of_incidents*5

          if (parseInt(d.num_of_incidents) >= 10){
            var thisCircle = L.circle([parseFloat(d.Latitude), parseFloat(d.Longitude)], {
              color: '#555',
              fillColor: 'transparent',
              radius: 3,
              className: 'mapCircle ' + d.Name
            });
            thisCircle.addTo(mymap);

            if(d.Name.includes("Opportunity")){
              thisCircle.setStyle({color:'red', radius: 4, weight:5});
              thisCircle.bindTooltip(d.Name, {permanent: true, className: "schoolLabel", offset: [-8, 10] });
              thisCircle._id = "1";
            }

          }

          mymap.eachLayer(function(L){
            //debugger
            if (L._id === "1"){
              L.bringToFront();
            }
          })


        })






          //create markers
          // lats.push(d.Latitude);
          // longs.push(d.Longitude);

          // var thisMarker = L.marker([d.Latitude, d.Longitude]);
          //
          // thisMarker.addTo(mymap);


      }


      d3.csv('assets/all_10.csv', initChart);

      function initChart(data){


        data.forEach(function(d) {

          d.How_Long_Delayed = parseInt(d.How_Long_Delayed)
        })


          data = data.filter(function(d) {
          return ! isNaN(d.How_Long_Delayed)
        })

          const max_delay = d3.max(data, function(d){
          return parseInt(d.How_Long_Delayed);
        })

        const _nested = d3.nest()
          .key(function(d){
            return d.Name;
          })
          .entries(data);

        const nested = [_nested[0]]
          // .concat({ key: 'fake', values: [{ How_Long_Delayed: 60 * 40 }] })
          .concat(_nested.slice(1, 100));

        nested.sort(function(a, b){
          const a_total = d3.sum(a.values, function(d){
            return d.How_Long_Delayed;
          })
          const b_total = d3.sum(b.values, function(d){
            return d.How_Long_Delayed;
          })
          return d3.descending(a_total, b_total);
          // return d3.ascending(a_total, b_total);
        })

        const school_names = nested.map(function(d){
          return d.key;
        })

          // debugger
        const height = 400;
        // const width = 1000;
        const max_minutes = 2820;

        const yScale = d3.scaleBand()
                        .domain(school_names)
                        .range([0,height]);

        // const xScale = d3.scaleTime()
        //   .domain([ 0, max_minutes * 60 * 1000 ])

        const xScale = d3.scaleLinear()
                        .domain([0, max_minutes])
                        // .range([0, width]);

        const RECT_HEIGHT_RATIO = 0.5;

        const opacityColorScale = d3.scaleThreshold()
                          .domain([20, 40, 60])
                          .range([0.2, 0.3, 0.5, 0.7]);

        const xAxis = d3.axisBottom()
          .scale(xScale);

                          // .range([0.2, 0.5, 0.8, 1.0])
        // const standardColorScale = d3.scaleLinear()
        //                   .domain([0, max_delay])
        //                   .range(['#fff', '#551A8B'])

        const parentSel = d3.select('.bar-chart');

        const conventions = d3.conventions({
          xAxis: xAxis,
          y: yScale,
          x: xScale,
          // width: width,
          height: height,
          margin: {left: 20, top: 60, bottom: 40 },
          parentSel: parentSel
        });


        xScale.range([0, conventions.width])

        // const timeScale = d3.scaleTime()
        //   .domain([ 0, max_minutes * 60 * 1000 ])
        //   .range([ 0, conventions.width ]);

        xAxis
          .tickPadding(10)
          .tickValues([10, 20, 30, 40].map(d => d * 60))
          .tickFormat(function(d) {
            return `${Math.floor(d/60)}` + ' hours';
          })
          .tickSize(-height);

        // xAxis.tickFormat(d => {
        //   return `${d/60}`;
        // })

        // debugger

        // xAxis
        //   .scale(timeScale)
        //   .tickFormat(d3.timeFormat("%h:%M"))

        conventions.drawAxis();

        d3.select('.axis.x').translate([0, conventions.height]);

        //var width = d3.select('svg').node().offsetWidth

        const svg = conventions.svg;

        const legendWidth = 10;
        // const legendHeight = (yScale.bandwidth() * RECT_HEIGHT_RATIO) + 20;
        // const legendHeight = 26;

        const legendHeight = 100;

        const legendXScale = d3.scaleBand().domain([0,20,40,60]).range([0,legendWidth]);

        const legendYScale = d3.scaleBand().domain([0, 1, 2, 3])
          .range([0,legendHeight])
          .padding(0.5)



        const legendG = svg.append('g');

        legendG.append('text.legendTitle')
          .attr('width', legendWidth)
          .attr('height', 200)
          .attr('text-anchor', 'end')
          // .attr('text-anchor', 'middle')
          // .attr('y', -30)
          .attr('x', 10)
          .text('Minutes Delayed Per Incident');

        legendG.translate([ conventions.width - legendWidth, conventions.height - legendHeight ])



        var legendBoxes = legendG.appendMany([ 10, 30, 50, 70 ], 'g.legendBoxes')
          .translate(function(d, i) {
            return [ 0, legendYScale(i) ]
          })
        // .translate(function(d){
        //   return [legendXScale(d),0];
        // });

        legendBoxes
          .append('rect')
          // .attr('width', function(d) { return xScale(d) })
          .attr('width', legendYScale.bandwidth())
          .attr('height', legendYScale.bandwidth())
          // .style('stroke', 'black')
          // .style('stroke-opacity', 0.7)
          // .attr('width', legendXScale.bandwidth())
          // .attr('height', yScale.bandwidth() * RECT_HEIGHT_RATIO)
          .attr('fill-opacity', function(d){
            return opacityColorScale(d);
          });

        legendBoxes
          .append('text')
          .text(function(d){
            // if(d === 0){
            //   return '0';
            // } else
            if (d < 20){
              return 'Less than 20 minutes';
            } else if (d > 20 && d < 40){
              return '20 to 40';
            } else if (d > 40 && d < 60){
              return '40 to 60';
            } else {
              return 'More than 60'
            }
          })
          .attr('text-anchor', 'end')
          .attr('y', 10)
          .attr('x', -5)

        // legendG.remove()

        // debugger

        // const _60_min_callout = svg.append('g.callout_60')


        // legendBoxes
        //   .append('text')
        //   .text(function(d){
        //     // if(d === 0){
        //     //   return '0';
        //     // } else
        //     if (d === 20){
        //       return '20 minutes';
        //     } else if (d === 40){
        //       return '40';
        //     } else if (d === 60){
        //       return '60';
        //     }
        //   })
        //   .attr('text-anchor', 'middle')
        //   .attr('y', -10);

          // legendBoxes
          //   .filter(function(d,i) { return i !== 0; })
          //   .append('line')
          //   .attr('stroke', 'black')
          //   .attr('y2', -5);


        // const legendAxis = d3.axisTop()
        //   .scale(legendXScale);

        // // legendG.call(legendAxis);

        // legendG.selectAll('.tick').remove();


        // 674
        // debugger
        // legendG.translate([ conventions.width - legendWidth, conventions.height - legendHeight ])


        // const withFake = [nested[0]]
        //   .concat({
        //     key: 'fake',
        //     values: []
        //   })
        //   .concat(nested)


        // debugger

        const schools = conventions.svg
          .append('g.schools')
          .appendMany(nested, 'g.school')
          .classed('opportunity', function(d) {
            return d.key === "Opportunity Charter";
          })

        schools.translate(function(d){
          const y = yScale(d.key);
          return [0, y];

        });

        schools.append('g.label.schoolLabel')
          .append('text')
          .text(function(d) {
            return d.key
          })
          // .attr('y', 12);
          .attr('y', 45)

        const barG = schools.append('g.bar')
          .translate([ 0, 15 ]);

        barG.each(function(d){
          var total_width = 0;

          const filtered = d.values.filter(function(d){
            const parsed = parseInt(d.How_Long_Delayed);
            if (!isNaN(parsed)){
              return true;
            } else {
              return false;
            }

          })


          filtered.sort(function(a, b){
            return d3.descending(a.How_Long_Delayed, b.How_Long_Delayed);
          });

          const delayGs = d3.select(this).appendMany(filtered, 'g.delay');

          delayGs.append('line.delay')
            .attr('y2', yScale.bandwidth() * RECT_HEIGHT_RATIO)
            .style('stroke', 'white')

          let total_time = 0;

          delayGs
            .append('rect.delay')
          //draw the rects
            .attr('width', function(d){
              const width = xScale(parseInt(d.How_Long_Delayed));
              // console.log(parseInt(d.How_Long_Delayed));
              return width;
            })
            .attr('height', yScale.bandwidth() * RECT_HEIGHT_RATIO)
            // .style('fill', function(d){
            //   return delayColors(parseInt(d.How_Long_Delayed));
            // })
            .style('opacity', function(d){
              return opacityColorScale(parseInt(d.How_Long_Delayed));
            })
          //separate the rects
            .each(function(d) {
              const current_width = total_width;
              //total_width += xScale(parseInt(d.How_Long_Delayed))
              total_width += xScale(parseInt(d.How_Long_Delayed))
              total_time += d.How_Long_Delayed;

              d3.select(this).attr('data-time', total_time);

              d3.select(this.parentElement).translate([current_width, 0]);
              // console.log(current_width);
              return [current_width, 0];

            })


        });

        d3.select('.school.opportunity').append('g.pointer')


        // delayGs.append('text')
        // .text(function(d){
        //   debugger
        //   return d.num_of_incidents
        // })
        // .attr('y', 12)



        d3.select('.x.axis .domain').remove();

        d3.select('.x.axis .tick text').text(function(d) {
          return `${d/60} total hours of delay`;
        })

        d3.select('.x.axis').translate([0, conventions.height])

        d3.select('.y.axis').style('display', 'none')
        d3.selectAll('.y.axis .tick text').attr('dx', 15);

        d3.selectAll('.y.axis .tick').each(function(d) {
          const textSel = d3.select(this).select('text');
          const textNode = textSel.node();
          this.appendChild(textNode.cloneNode(true));

          textSel.attr('fill', null)
            .attr('stroke', 'white')
            .attr('stroke-width', '2px')
        })


        function drawAnnotes(sectionWidth, offset){

          d3.select('g.schools').translate([0, -14]);

          const annoteLeft = svg.append('g.annote-left')

            annoteLeft.translate([xScale(offset), 0]);

            annoteLeft.append('line')
              .attr('x2', xScale(sectionWidth))
              .attr('y1', -5)
              .attr('y2', -5)
              .attr('stroke', 'black');

            annoteLeft.append('line')
              .attr('x1', xScale(sectionWidth)/2)
              .attr('x2', xScale(sectionWidth)/2)
              .attr('y1', -5)
              .attr('y2', -10)
              .attr('stroke', 'black');
        }

        drawAnnotes(120, 0);

        drawAnnotes(1630, 824);

        const annoteText = svg.append('g.annote-text');

        annoteText
          .append('text')
          .attr('class', 'annote-left-text')
          .text('lasted 120 minutes.')
          .translate([0, -18]);

        annoteText
          .append('text')
          .attr('class', 'annote-left-text')
          .text('This single delay')
          .translate([0, -30]);

        annoteText
          .append('text')
          .attr('class', 'annote-left-text')
          .text('to more than 27 hours.')
          .translate([300, -18]);

        annoteText
          .append('text')
          .attr('class', 'annote-left-text')
          .text('These 68 delays added up')
          .translate([300, -30]);






      }; //init


      }); //doc ready
