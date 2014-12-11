$(document).ready(function() {

    // Initialize the GUI
    FrbKort.getConfig();

});

FrbKort = {

    /**
     * The map object
     */
    map: null,

    /**
     * The config file content
     */
    config: null,

    layerDialog: null,

    vectorLayer: null,

    /**
     * The geojson data
     */
    vector: {},

    currentVector: null,

    currentDate: null,

    visibleData: [],

    selectedFeature: null,

    sliderPlayDelay: 1000,

    /**
     * Method for getting the configuration
     */
    getConfig: function () {
        if (this.config === null) {
            var configName = this.getURLParameter ('c');
            $.ajax({
                url: 'config/'+configName+'.json',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                success: this.bind(function (data) {
                    this.config = data;
                    this.setGui();
                },this)
            });
        }
    },

    /**
     * Method for initializing the GUI on start
     */
    setGui: function () {

        if (document.body.clientWidth <= 767) {
            $('#sidebar').toggle();
            $('a.toggle i').toggleClass('glyphicon-chevron-left glyphicon-chevron-right');
        }

        $(window).resize(function() {
            $('.tt-dropdown-menu').css('max-height', $('#container').height()-$('.navbar').height()-20);
        });

        $('a.toggle').click(this.bind(function() {
            $('a.toggle i').toggleClass('glyphicon-chevron-left glyphicon-chevron-right');
            $('#map').toggleClass('col-sm-9 col-lg-9 col-sm-12 col-lg-12');
            $('#sidebar').toggle();
            this.map.invalidateSize();
            return false;
        }, this));

        $('button#addData').click(this.bind(function () {
            this.setLayerDialog();
        }, this));

        //Search control
        $('input.form-control').val('');
        $('input.form-control').keyup(this.bind(function () {
            var e = $('div.modal-body .list-group a');
            var s = $('input.form-control').val();
            if (s == '') {
                this.clearSearch();
            } else {
                $('div.modal-body span.input-group-addon').html ('<span class="close">&times;</span>');
                this.search(s);
            }
        },this));
        $('.input-group span').click(this.bind(this.clearSearch, this));

        //Setup the map
        this.setMap();

        this.setTitle();

    },

    setTitle: function () {
        if (this.config && this.config.text) {
            if (this.config.text.title) {
                $('.panel-group#textcontainer > h4').html(this.config.text.title);
            }
            if (this.config.text.description) {
                $('.panel-group#textcontainer > p').html(this.config.text.description);
            }
        }
    },

    /**
     * Do the search
     */
    search: function (s) {
        var p = new RegExp(s,'gi');
        for (var i=0;i<this.config.data.length;i++) {
            var d = this.config.data[i];
            var t = [];
            t.push(d.title);
            t.push(d.description);
            t.push(d.keywords);
            if (t.join().match(p) != null) {
                $('#layer_'+this.config.data[i].id).removeClass('list-iten-hidden');
            } else {
                $('#layer_'+this.config.data[i].id).addClass('list-iten-hidden');
            }

            if (typeof this.config.data[i].data != 'string') {
                var c = 0;
                for (var j=0;j<this.config.data[i].data.length;j++) {
                    var ds = this.config.data[i].data[j];
                    //Search in both the parent object and this one to show all sub elements if there is a match on the parent
                    var ts = [].concat(t);
                    ts.push(ds.title);
                    ts.push(ds.description);
                    ts.push(ds.keywords);
                    if (ts.join().match(p) != null) {
                        c++;
                        $('#layer_'+this.config.data[i].data[j].id).removeClass('list-iten-hidden');
                    } else {
                        $('#layer_'+this.config.data[i].data[j].id).addClass('list-iten-hidden');
                    }
                }
                //Show the parent if there is children
                if (c>0) {
                    $('#layer_'+this.config.data[i].id).removeClass('list-iten-hidden');
                } else {
                    $('#layer_'+this.config.data[i].id).addClass('list-iten-hidden');
                }
            }
        }
    },

    /**
     * Called to clear the search string
     */
    clearSearch: function () {
        $('input.form-control').val('');
        $('div.modal-body .list-group a').removeClass('list-iten-hidden');
        $('div.modal-body span.input-group-addon').html ('<i class="glyphicon glyphicon-search"></i>');
    },

    /**
     * Get the configuration. The URL parameter "c" defines the name of the .json file
     */
    setLayerDialog: function () {
        if (this.layerDialog === null) {

            this.layerDialog = $('#layersModal');

            //Populate dialog
            var div = $('<div class="list-group"></div>');
            for (var i=0;i<this.config.data.length;i++) {
                if (!this.config.data[i].id) {
                    this.config.data[i].id = i;
                }

                if (typeof this.config.data[i].data == 'string') {
                    //Data that can be added to the map
                    var l = $('<a id="layer_'+this.config.data[i].id+'" href="#" class="list-group-item list-heading">'+
                    '    <h4 class="list-group-item-heading">'+this.config.data[i].title+'<span class="glyphicon glyphicon-share-alt pull-right"></span></h4>'+
                    '    '+(this.config.data[i].description ? '<p class="list-group-item-text">'+this.config.data[i].description+'</p>' : '')+
                    '</a>');
                    l.click(this.bind(this.addData, this, this.config.data[i]));
                    div.append(l);
                } else {
                    //A group
                    var l = $('<a id="layer_'+this.config.data[i].id+'" href="#" class="list-group-item list-heading">'+
                    '    <h4 class="list-group-item-heading">'+this.config.data[i].title+'<span class="caret pull-right"></span></h4>'+
                    '    '+(this.config.data[i].description ? '<p class="list-group-item-text">'+this.config.data[i].description+'</p>' : '')+
                    '</a>');
                    l.click(this.bind(function (config) {
                        if ($('.list-group-content.list-group-'+config.id+':visible').length == 0) {
                            $('.list-group-content:visible').slideToggle();
                            $('.list-heading .caret').removeClass('caret-up');
                        }
                        $('.list-group-content.list-group-'+config.id).slideToggle();
                        $('#layer_'+config.id+' .caret').toggleClass('caret-up');
                    }, this, this.config.data[i]));
                    div.append(l);

                    for (var j=0;j<this.config.data[i].data.length;j++) {
                        if (!this.config.data[i].data[j].id) {
                            this.config.data[i].data[j].id = i+'_'+j;
                        }
                        // Data, der kan vises i kortet
                        var l = $('<a id="layer_'+this.config.data[i].data[j].id+'" href="#" class="list-group-item list-group-content list-group-'+this.config.data[i].id+'">'+
                        '    <h4 class="list-group-item-heading">'+this.config.data[i].data[j].title+'<span class="glyphicon glyphicon-share-alt pull-right"></span></h4>'+
                        '    '+(this.config.data[i].data[j].description ? '<p class="list-group-item-text">'+this.config.data[i].data[j].description+'</p>' : '')+
                        '</a>');
                        l.hide();
                        l.click(this.bind(this.addData, this, this.config.data[i].data[j]));
                        div.append(l);
                    }
                }

            }
            $('#layersModal .modal-body').append(div);

        }
    },

    /**
     * Add a data layer
     */
    addData: function (config) {
        this.layerDialog.modal('hide');
        $('.panel-group#textcontainer').hide();

        var addNew = true;
        for (var i=0;i<this.visibleData.length;i++) {
            if (this.visibleData[i].id == config.id) {
                addNew = false;
            } else {
                $('#panel_'+this.visibleData[i].id+' .panel-collapse').collapse('hide');
            }
        }

        if (addNew) {
            $('#layercontainer').append('<div id="panel_'+config.id+'" class="panel panel-default">'+
            '<div class="panel-heading">'+
            '  <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'+
            '  <strong class="panel-title">'+
            '    <a class="accordion-toggle" data-toggle="collapse" data-parent="#" href="#collapse_'+config.id+'">'+config.title+'</a>'+
            '  </strong>'+
            '</div>'+
            '<div id="collapse_'+config.id+'" class="panel-collapse collapse in">'+
            '  <div class="panel-body"><span>'+(config.description ? config.description : '')+'</span><div class="labels"><div class="label-selected">Valgte område</div><div class="label-avg">Hele kommunen</div></div><div class="vectorswitch"><div class="btn-group"></div></div></div>'+
            '</div>'+
            '</div>');
            $('#panel_'+config.id+' .close').click(this.bind(function (config) {
                $('#panel_'+config.id).remove();
                for (var i=0;i<this.visibleData.length;i++) {
                    if (this.visibleData[i].id == config.id) {
                        this.visibleData.splice(i,1);
                        break;
                    }
                }
                for (var i=0;i<this.visibleData.length;i++) {
                    if (this.visibleData[i].id == config.id) {
                        this.visibleData.splice(i,1);
                        break;
                    }
                }
                if (this.visibleData.length === 0) {
                    $('.panel-group#textcontainer').show();
                }
                this.hideData(config);
            },this,config));

            $('#collapse_'+config.id).on('show.bs.collapse', this.bind(function (config) {
                $('.panel-collapse').collapse('hide');
            },this,config));
            $('#collapse_'+config.id).on('shown.bs.collapse', this.bind(function (config) {
                this.showData(config);
            },this,config));
            $('#collapse_'+config.id).on('hide.bs.collapse', this.bind(function (config) {
                this.hideData(config);
            },this,config));

            for (var i = 0;i<config.vector.length;i++) {
                var b = $('<a class="btn btn-default'+(i===0?' active':'')+' vector_'+config.vector[i]+'" href="#">'+this.config.vector[config.vector[i]].title+'</a>');
                b.click(this.bind(function (vector,config) {
                    this.showVector(vector);
                    this.showHistory(this.current);
                    $('#panel_'+config.id+' .vectorswitch .btn-group a').removeClass('active');
                    $('#panel_'+config.id+' .vectorswitch .btn-group a.vector_'+vector).addClass('active');
                }, this, config.vector[i],config));
                $('#panel_'+config.id+' .vectorswitch .btn-group').append(b);
            }

            this.visibleData.push(config);
            this.showData(config);
        } else {
            if (config.visible === false) {
                $('#collapse_'+config.id).collapse('show');
            }
        }
    },

    /**
     * Show the data and set it as active
     */
    showData: function (config) {
        config.visble = true;
        this.current = config;
        if (typeof config.data == 'string') {
            $.ajax({
                url: config.data,
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                success: this.bind(function (config,data) {
                    config.data = data;
                    this.current.date = config.startDate || '2012-10-02';
                    this.setColor(config);
                    this.showVector(config.vector[0]);
                    this.showHistory(config);
                },this,config),
                error: this.bind(function (response, exception) {

                },this)
            })
        } else {
            var vector = ($.inArray(this.currentVector, this.current.vector) > -1 ? this.currentVector : this.current.vector[0]);

            $('#panel_'+config.id+' .vectorswitch .btn-group a').removeClass('active');
            $('#panel_'+config.id+' .vectorswitch .btn-group a.vector_'+vector).addClass('active');

            this.showVector(vector);
            this.showHistory(config);
        }
    },

    /**
     * Hide the data
     */
    hideData: function (config) {
        config.visble = false;
        if (this.visibleData.length > 0) {
            for (var i=0;i<this.visibleData.length;i++) {
                if (this.visibleData[i].visble === true) {
                    return;
                }
            }
        }
        this.current = null;
        this.vectorLayer.clearLayers();
    },

    /**
     * Handle the color scheme of the active data
     */
    setColor: function (config) {
        config.dates = {};
        for (var i=0;i<config.data.length;i++) {
            if (!config.dates[config.data[i].udtraek_dato]) {
                config.dates[config.data[i].udtraek_dato] = [];
            }
            var obj = {
                type_id: config.data[i].type_id,
                distrikt_id: config.data[i].distrikt_id,
                val: config.data[i][config.col]
            }
            config.dates[config.data[i].udtraek_dato].push(obj)
        }
        for (var name in config.dates) {
            config.dates[name].sort(function(a, b) { return a.val - b.val });

            if (config.colors) {
                for (var i=0;i<config.dates[name].length;i++) {
                    var val = config.dates[name][i].val;
                    var color = '#fff';
                    for (var j=0;j<config.colors.length;j++) {
                        if (config.colors[j].min <= val && val <= config.colors[j].max) {
                            color = config.colors[j].color;
                        }
                    }
                    config.dates[name][i].color = color;
                }
            } else {
                var intervals = config.intervals || 5;
                var a = config.dates[name][config.dates[name].length-1].val - config.dates[name][0].val;
                var size = a/intervals;

                config.colors = [];
                for (var j=0;j<FrbKort.COLORS.length;j++) {
                    config.colors.push({min:j*size,max:j*size+size,color:FrbKort.COLORS[j]});
                }

                for (var i=0;i<config.dates[name].length;i++) {
                    var g = (config.dates[name][i].val - config.dates[name][0].val)/size;
                    g = parseInt(g);
                    if (g == intervals) {
                        g = g-1;
                    }
                    config.dates[name][i].color = FrbKort.COLORS[g];
                }
            }
        }
    },

    /**
     * Get a specific row from the active data
     */
    getRowFromData: function (type_id, distrikt_id) {
        var cd = this.current.dates[this.current.date];
        if (typeof cd !== 'undefined') {
            for (var i=0;i<this.current.dates[this.current.date].length;i++) {
                if (this.current.dates[this.current.date][i].type_id == type_id && this.current.dates[this.current.date][i].distrikt_id == distrikt_id) {
                    return this.current.dates[this.current.date][i];
                }
            }
        }
        return null;
    },

    /**
     * Show the legend of the active data
     */
    showLegend: function (config) {
        if ($('#legend_'+config.id).length == 0) {
            jQuery('<div id="legend_'+config.id+'" class="legend-content row"></div>').insertBefore('#collapse_'+config.id+' .vectorswitch');
        }

        var container = $('#legend_'+config.id);
        container.empty();

        var t = $('<table class="table"></table>');
        var tr = $('<tr></tr>');

        for (var i=0;i<config.colors.length;i++) {
            tr.append('<td class="" style="width:'+(100/config.colors.length)+'%"><div style="background-color:'+config.colors[i].color+'"></div>'+config.colors[i].min+'-'+config.colors[i].max+(config.unit || '')+'</td>');
        }
        t.append(tr);
        container.append(t);
    },

    /**
     * Show the history of the active data
     */
    showHistory: function (config) {
        var hist = this.getHistory();
        var data = [];
        var showSelected = false;
        for (var name in hist) {
            if (hist[name].sel) {
                showSelected = true;
            }
            data.push({name:name,avg:hist[name].avg.toFixed(config.decimals || 0),max: hist[name].max,min: hist[name].min,val:(hist[name].sel || hist[name].sel===0 ? hist[name].sel.toFixed(config.decimals || 0) : 0)});
        }
        if ($('#graph_'+config.id).length == 0) {
            jQuery('<div id="graph_'+config.id+'" class="graph-content"></div>').insertBefore('#collapse_'+config.id+' .vectorswitch');
        }

        this.showGraph ('graph_'+config.id,data,config,showSelected);

        this.showSlider(config);
        this.showLegend(config);
    },

    showSlider: function (config) {

        if ($('#slider_'+config.id).length == 0) {
            jQuery('<div id="slider_'+config.id+'" class="timeslider"><i class="glyphicon glyphicon-play pull-left"></i><div class="slider-container"><input type="text"/></div></div>').insertBefore('#collapse_'+config.id+' .vectorswitch');
            $('#slider_'+config.id+' i').click(this.bind(function (id) {
                var start = $('#slider_'+id+' i').hasClass('glyphicon-play');
                if (start) {
                    this.startTimer();
                } else {
                    this.stopTimer();
                }
            },this,config.id));
        }

        var dates = [];
        for (var name in config.dates) {
            dates.push(name);
        }

        var input = $('#panel_'+config.id+' .timeslider input').width($('#slider_'+config.id+' .slider-container').width()-10);
        input.slider({
            handle: 'round',
            min: 0,
            max: dates.length-1,
            value: jQuery.inArray(config.startDate,dates),
            formater: this.bind(function(dates,value) {
                return dates[value];
            },this,dates)
        }).on('slideStop', this.bind(function (config,dates,event) {
            this.showVector(null,dates[event.value]);
        },this,config,dates));


        if (this.timer) {
            this.stopTimer(this.timer);
            this.timer = null;
        }

        this.timer = {
            id: config.id,
            dates: dates,
            current: dates.length-1
        };

    },

    startTimer: function () {

        $('#slider_'+this.timer.id+' i').removeClass('glyphicon-play').addClass('glyphicon-pause');

        this.timer.current++;
        if (this.timer.current >= this.timer.dates.length) {
            this.timer.current = 0;
        }
        $('#panel_'+this.timer.id+' .timeslider input').slider('setValue',this.timer.current);
        this.showVector(null,this.timer.dates[this.timer.current]);

        this.timer.interval = setInterval(this.bind(function () {
            this.timer.current++;
            if (this.timer.current >= this.timer.dates.length) {
                this.timer.current = 0;
            }
            $('#panel_'+this.timer.id+' .timeslider input').slider('setValue',this.timer.current);
            this.showVector(null,this.timer.dates[this.timer.current]);
        },this),this.sliderPlayDelay);
    },

    stopTimer: function () {
        $('#slider_'+this.timer.id+' i').removeClass('glyphicon-pause').addClass('glyphicon-play');
        window.clearInterval(this.timer.interval);
    },

    /**
     * Calculate average, min and max of the data
     */
    getHistory: function () {
        var dates = {};
        for (var name in this.current.dates) {
            dates[name] = {};
            var val = 0;
            var count = 0;
            var max = -999999999999;
            var min = 999999999999;
            for (var i=0;i<this.current.dates[name].length; i++) {
                if (this.current.dates[name][i].type_id == this.currentVector) {
                    if (this.selectedFeature && this.current.dates[name][i].distrikt_id == this.selectedFeature.target.feature.properties.distrikt_id) {
                        dates[name].sel = this.current.dates[name][i].val;
                    }
                    val += this.current.dates[name][i].val;
                    max = Math.max(max,this.current.dates[name][i].val);
                    min = Math.min(min,this.current.dates[name][i].val);
                    count++;
                }
            }
            dates[name].avg = val/count;
            dates[name].max = max;
            dates[name].min = min;
        }
        return dates;
    },

    /**
     * Show a named set of features in the map
     */
    showVector: function (name,date) {

        // Test if the configuration 
        if (this.config === null) {
            // No configuration available
            alert('The configuration is missing!')
            return;
        }

        if (name) {
            this.currentVector = name;
        }
        if (date) {
            this.current.date = date;
        }

        // Remove the current feaures from the map
        this.vectorLayer.clearLayers();

        this.selectedFeature = null;

        // The features are stored in this.vector. If the features aren't loaded, then load it
        if (!this.vector[this.currentVector]) {
            this.vector[this.currentVector] = {};
            $.ajax({
                url: this.config.vector[this.currentVector].url,
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                success: this.bind(function (vector,data) {
                    vector.data = data;
                    this.vectorLayer.addData(data);
                },this,this.vector[name]),
                error: this.bind(function (response, exception) {

                },this)
            })

        } else {
            if (this.vector[this.currentVector].data) {
                this.vectorLayer.addData(this.vector[this.currentVector].data);
                if (this.selectedDistrict) {

                }
            }
        }
    },

    /**
     * Method called when a feature is selected in the map
     */
    featureSelected: function (e) {
        this.featureUnSelected();

        this.selectedFeature = e;
        this.selectedDistrict = e.target.feature.properties.distrikt_id;

        e.target.setStyle({ weight: 7});

        if (!L.Browser.ie && !L.Browser.opera) {
            e.target.bringToFront();
        }

        //Show info for e.target.feature.properties.distrikt_id
        this.showHistory (this.current);

    },

    /**
     * Method called when a feature is unselected in the map
     */
    featureUnSelected: function () {
        if (this.selectedFeature != null) {
            this.selectedFeature.target.setStyle({
                weight: 2
            });
            this.selectedFeature = null;
        }
    },

    /**
     * Method for initializing the map on start
     */
    setMap: function () {
        var mapOptions = {
            minZoom: 13,
            maxZoom: 20,
            zoom: 15,
            center: [55.678265,12.531274]
        };
        if (typeof this.config.map !== 'undefined') {
            for (var name in this.config.map) {
                mapOptions[name] = this.config.map[name];
            }
        }

        this.map = L.map('map',mapOptions).on('click',this.bind(function () {
            this.featureUnSelected();
            this.showHistory (this.current);
        },this));

        var baselayer = null;
        if (typeof this.config.baseLayer !== 'undefined') {
            baselayer = L.tileLayer(this.config.baseLayer.URLtemplate, this.config.baseLayer.options);
        } else {
            baselayer = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
                maxZoom: 19,
                subdomains: ["otile1", "otile2", "otile3", "otile4"],
                attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
            });
        }

        baselayer.addTo(this.map);

        this.vectorLayer = L.geoJson(null, {
            onEachFeature: this.bind(function (feature, layer) {
                layer.on({
                    click: this.bind(this.featureSelected, this)
                });
            },this),
            style: this.bind(function(feature) {
                var d = this.getRowFromData(this.currentVector, feature.properties.distrikt_id);
                return {
                    "clickable": d!==null,
                    "color": (d!==null ? d.color : '#f00'),
                    "fillColor": (d!==null ? d.color : '#f00'),
                    "weight": 2.0,
                    "opacity": (d===null ? 0 : 0.9),
                    "fillOpacity": (d===null ? 0 : 0.5)
                }
            },this)
        }).addTo(this.map);

        var scaleControl = L.control.scale({
            position: 'bottomright',
            imperial: false
        });
        // Larger screens get scale control and expanded layer control
        if (document.body.clientWidth <= 767) {
            var isCollapsed = true;
        } else {
            var isCollapsed = false;
            this.map.addControl(scaleControl);
        };
    },

    /**
     * Create and show the graph
     */
    showGraph: function (elementID, data, config, showSelected) {

        $('#'+elementID).empty();

        var margin = {top: 25, right: 10, bottom: 60, left: 25},
            width = $('#'+elementID).width() - margin.left - margin.right,
            height = $('#'+elementID).height() - margin.top - margin.bottom;

        var formatPercent = d3.format(",g");

        var x = d3.scale.ordinal()
            .rangeRoundBands([10, width], .1);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .tickSize(0)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .tickSize(2)
            .ticks(2)
            .orient("left")
            .tickFormat(formatPercent);

        var svg = d3.select("#"+elementID).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(data.map(function(d) { return d.name; }));
        y.domain([0, d3.max(data, function(d) { return d.max; })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height) + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(0)")
            .attr("y", 0)
            .attr("dy", -6)
            .style("text-anchor", "end")
            .text(config.unit);

        if (showSelected) {

            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.name); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d.val); })
                .attr("height", function(d) { return height - y(d.val); })
                .on('mouseover', this.bind(function (data,pos) {
                    this.showTip(data.val,$($('.bar')[pos]));
                },this))
                .on('mouseout', this.bind(function () {
                    this.hideTip();
                },this))
        }

        var line = d3.svg.line()
            .x(function(d) { return x(d.name)+x.rangeBand()/2; })
            .y(function(d) { return y(d.avg); });

        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

        var point = svg.append("g")
            .attr("class", "point");

        point.selectAll('circle')
            .data(data)
            .enter().append('circle')
            .on('mouseover', this.bind(function (data,pos) {
                this.showTip(data.avg,$($('.point circle')[pos]));
            },this))
            .on('mouseout', this.bind(function () {
                this.hideTip();
            },this))
            .attr("cx", function(d) { return x(d.name)+x.rangeBand()/2; })
            .attr("cy", function(d) { return y(d.avg) })
            .attr("r", 5);

    },

    /**
     * Add a tool tip element to the DOM with a value at a specific position
     */
    showTip: function (value,element) {
        var tt = $('<div id="tooltip" class="tooltip fade top in" style="position:absolute;"><div class="tooltip-arrow"></div><div class="tooltip-inner">'+value+'</div></div>');
        $('body').append(tt);
        var offset = element.offset();
        tt.offset({top: offset.top-35,left: offset.left-$('.tooltip').width()/2+6});
    },

    /**
     * Remove the tool tip element from the DOM
     */
    hideTip: function () {
        $('#tooltip').remove();
    },

    /**
     * Helper method that returns the value of a named URL parameter.
     *
     * Parameters:
     * name - {String} The name of the parameter.
     *
     * Returns:
     * {String} The value. Null if no value
     */
    getURLParameter: function (name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
    },

    /**
     * Helper method that binds a function to an object. Method to easily create closures with 'this' altered.
     *
     * Parameters:
     * func - {Function} Input function.
     * object - {Object} The object to bind to the input function (as this).
     *
     * Returns:
     * {Function} A closure with 'this' set to the passed in object.
     */
    bind: function(func, object) {
        var args = Array.prototype.slice.apply(arguments, [2]);
        return function() {
            var newArgs = args.concat(
                Array.prototype.slice.apply(arguments, [0])
            );
            return func.apply(object, newArgs);
        };
    }
};

/**
 * Default colors
 */
FrbKort.COLORS = [
    '#FFFFCC','#C2E6993','#78C679','#31A354','#006837'
]

/**
 * Test colors - NOT IN USE
 */
FrbKort.COLORS1 = [
    "ff9900", "b36b00", "ffe6bf", "ffcc80", "00b366", "007d48", "bfffe4", "80ffc9", "400099", "2d006b", "dabfff", "b580ff"
]
FrbKort.COLORS2 = [
    "#ff9900", "#b36b00", "#ffe6bf", "#ffcc80", "#00b366", "#007d48", "#bfffe4", "#80ffc9", "#400099", "#2d006b", "#dabfff", "#b580ff"
]
FrbKort.COLORS3 = [
    '#EDF8FB', '#B2E2E2', '#66C2A4', '#2CA25F', '#006D2C'
]
FrbKort.COLORS4 = [
    '#D7191C','#FDAE61','#FFFFBF','#A6D96A','#1A9641'
]
