
//EditOverlaysDialog 904
//http://192.168.2.35:8081/viewer/avnav_navi.php?request=api&type=chart&overlayConfig=int%40osm-online.xml.cfg&command=getConfig&expandCharts=true&mergeDefault=true

console.log("layline plugin loaded");

sailsteerImageCanvasSource={};


//       		window.localStorage.setItem('kds',mycanvasFunction)
let widgetParameters = 
{
formatterParameters: false,
};

var TWD_Abweichung = [0,0]
var old_time=performance.now()
var ln0_1=Math.log(0.1)


var widget={

            name:"LaylineWidget",

            // Editable Parameters
            Displaysize: 100,
            Laylinerefresh: 5,
            Laylinelength: 100,
            TWD_filtFreq: 0.2,
            Laylineoverlap: false,
            LaylineBoat: true,
            LaylineWP: true,
            TWDFilt_Indicator:false,


            initFunction:function(a,b)
            {
            },


            /**
            * optional render some graphics to a canvas object
            * you should style the canvas dimensions in the plugin.css
            * be sure to potentially resize and empty the canvas before drawing
            * @param canvas
            * @param props - the properties you have provided here + the properties you
            *                defined with the storeKeys
            */




            renderCanvas:function(canvas,props){
				let Parameter={};
            	var ctx=canvas.getContext('2d');
            	// Set scale factor for all values
            	var crect=canvas.getBoundingClientRect();
            	var w=crect.width;
            	var h=crect.height;
            	canvas.width=w;
            	canvas.height=h;
            	ctx.save();
            	var width = 200;			// Control width
            	var height = 200;			// Control height
            	var f1=w/width;
            	var f2=h/height;
            	var f=Math.min(f1,f2);
            	ctx.scale(f,f);
            	ctx.translate(width/2*f1/f,height/2*f2/f); //move the drawing to the middle

            	self=this
            	/*
            	fetch(AVNAV_BASE_URL+"/api/parameter")
            	.then(function(resp){return resp.json()})
            	.then(function(data){
            		Parameter=data;
            	})
            	.catch((error) => {
            		avnav.api.showToast("SegelDisplay ERROR: "+error)
            	});
            	*/
            	Parameter.Laylinelength=props.Laylinelength*1825;//sm in m
            	Parameter.Displaysize=props.Displaysize
            	Parameter.LaylineWP=props.LaylineWP
            	Parameter.LaylineBoat=props.LaylineBoat
            	a=1825*props.Laylinelength;
            	props.Laylinelength=a;

            	// store Parameter for canvasoverlay in internal store
            	avnav.api.storeData('plugin.Parameter',Parameter);         		

            	ctx.save();

            	maprotationdeg = props.ActualMapRotation	//this.mapholder.olmap.getView().getRotation()/Math.PI*180
            	boatrotationdeg = props.course;

            	calc_LaylineAreas(this, props)
            	DrawOuterRing(ctx, Parameter.Displaysize, maprotationdeg+boatrotationdeg);
            	DrawKompassring(ctx, Parameter.Displaysize, maprotationdeg);

            	// wenn TWD+360 > LL-angle+360 -> grün sonst -> rot
            	color=((props.LLBB-props.TWD)+540)%360-180 > 0 ? "rgb(0,255,0)":"red";
            	DrawLaylineArea(ctx, Parameter.Displaysize, maprotationdeg+props.LLBB, TWD_Abweichung, ((props.LLBB-props.TWD)+540)%360-180 < 0 ? "rgb(0,255,0)":"red")
            	DrawLaylineArea(ctx, Parameter.Displaysize, maprotationdeg+props.LLSB, TWD_Abweichung, ((props.LLSB-props.TWD)+540)%360-180 < 0 ? "rgb(0,255,0)":"red")
            	DrawWindpfeilIcon(ctx, Parameter.Displaysize, maprotationdeg+props.AWD, "rgb(0,255,0)", 'A')
            	DrawWindpfeilIcon(ctx, Parameter.Displaysize, maprotationdeg+props.TWD , "blue", 'T')

            	if(typeof(Parameter.TWDFilt_Indicator) != 'undefined' && Parameter.TWDFilt_Indicator=='True')	 
            		DrawWindpfeilIcon(ctx, Parameter.Displaysize, + maprotationdeg+props.TSS, "yellow", '~');
            	ctx.save();
            	

            	if(typeof(props.boatposition) != 'undefined')		
            	{
            		let intersections = calc_intersections(self, props, props.Laylinelength*1825)
            		// store calculated intersections for canvasoverlay in internal store
            		avnav.api.storeData('plugin.intersections',intersections);         		
            	} 
            	ctx.restore();
	           	if(typeof(sailsteerImageCanvasSource) != 'undefined')
            		sailsteerImageCanvasSource.refresh();
    			return;
            },
            /**
            * the access to the internal store
            * this should be an object where the keys are the names you would like to
            * see as properties when your render functions are called
            * whenever one of the values in the store is changing, your render functions will be called
            */
            storeKeys:{
            	course: 'nav.gps.course',
            	AWA:'nav.gps.AWA',
            	AWD:'nav.gps.AWD',
            	TWA:'nav.gps.TWA',
            	TWD:'nav.gps.TWD',
            	TSS:'nav.gps.TSS',
            	LLSB:'nav.gps.LLSB',
            	LLBB:'nav.gps.LLBB',
            	valid:'nav.gps.valid',
            	boatposition: 'nav.gps.position',
            	WPposition:'nav.wp.position',
            	MapRotation:'nav.display.mapDirection',
            	ActualMapRotation:'nav.display.actualmapRotation',
            	courseup:'nav.map.courseUp',
            	//config: 'plugin.config',
            	//intersections:'plugin.intersections'
            },
            caption: "Laylines",
            unit: "",
};
var widgetParameter = {
                       Displaysize: {type: 'NUMBER', default: 100},
                       Laylinerefresh: {type: 'NUMBER', default: 5},
                       Laylinelength: {type: 'NUMBER', default: 100},
                       TWD_filtFreq: {type: 'NUMBER', default: 0.2},
                       Laylineoverlap: {type: 'BOOLEAN', default: false},
                       LaylineBoat: {type: 'BOOLEAN', default: true},
                       LaylineWP: {type: 'BOOLEAN', default: true},
                       TWDFilt_Indicator: {type: 'BOOLEAN', default: false},
};

avnav.api.registerWidget(widget, widgetParameter);


function drawpointcross(cc,coordinates, color){
	cc.beginPath();
	cc.moveTo(coordinates[0]-100,coordinates[1]);
	cc.lineTo(coordinates[0]+100,coordinates[1]);

	cc.moveTo(coordinates[0],coordinates[1]-100);
	cc.lineTo(coordinates[0],coordinates[1]+100);

	cc.stroke();	
	cc.lineWidth = 5;//0.02*Math.min(x,y)
	cc.fillStyle = color;
	cc.strokeStyle = color;
	cc.stroke();

}

let calc_intersections = function(self, props, Laylinelength) {
	try{
		//self.dist_SB = self.dist_BB = Parameter.Laylinelength
		b_pos = new LatLon(props.boatposition.lat, props.boatposition.lon);
		if (props.WPposition) {
			WP_pos = new LatLon(props.WPposition.lat, props.WPposition.lon);

			// Intersections berechnen
			var is_SB = LatLon.intersection(b_pos, props.LLSB, WP_pos, props.LLBB + 180);
			var is_BB = LatLon.intersection(b_pos, props.LLBB, WP_pos, props.LLSB + 180);
			calc_endpoint = function(intersection, pos) {
				let is_xx;
				let dist_xx = pos.rhumbDistanceTo(intersection);	// in km
				if (dist_xx>20000)	// Schnittpunkt liegt auf der gegenüberliegenden Erdseite!
						return null;
				if(dist_xx > Laylinelength/1000) // wenn abstand gösser gewünschte LL-Länge, neuen endpunkt der LL berechnen
				is_xx = pos.rhumbDestinationPoint(pos.rhumbBearingTo(intersection), Laylinelength/1000)
												else if(dist_xx< Laylinelength/1000 && props.Laylineoverlap=="True")// wenn abstand kleiner gewünschte LL-Länge und Verlängerung über schnittpunkt gewollt, neuen endpunkt der LL berechnen
				is_xx = pos.rhumbDestinationPoint(pos.rhumbBearingTo(intersection), Laylinelength/1000)
												else
													is_xx= intersection;
				return(is_xx)
			};

			is_BB_boat=is_BB_WP = is_SB_boat=is_SB_WP =null;
			if(is_BB)
			{
				is_BB_boat=calc_endpoint(is_BB, b_pos);
				is_BB_WP = calc_endpoint(is_BB, WP_pos);
			}

			if(is_SB)
			{
				is_SB_boat=calc_endpoint(is_SB, b_pos);
				is_SB_WP = calc_endpoint(is_SB, WP_pos);
			}

			if(is_SB_boat && is_SB_WP && is_BB_boat && is_BB_WP){	
				// es gibt schnittpunkte
				return({ 
					Boat: { SB: { P1: b_pos, P2: is_SB_boat, color: 'rgb(0,255,0)' }, 
						BB: { P1: b_pos, P2: is_BB_boat, color: 'red' } }, 
						WP:   { SB: { P1: WP_pos, P2: is_SB_WP, color: 'red' }, 
							BB: { P1: WP_pos, P2: is_BB_WP, color: 'rgb(0,255,0)' } } 
				})
			}
			else
				// keine schnittpunkte
			return(null);
		}
	}
	catch (e) {
		console.log(e); // Fehler-Objekt an die Error-Funktion geben
	}

}

let calc_LaylineAreas = function(self, props) {
	// Berechnungen für die Laylineareas
	// Die Breite der Areas (Winkelbereiche) wird über die Refreshzeit abgebaut
	let reduktionszeit;
	if(typeof(props.Laylinerefresh) != 'undefined')
		reduktionszeit = props.Laylinerefresh * 60;
	else
		reduktionszeit = 360;
	let difftime = (performance.now() - old_time) / 1000; // sec
	old_time = performance.now();

	let k = ln0_1 / reduktionszeit;

	for (var i = 0; i < 2; i++)
		TWD_Abweichung[i] *= Math.exp(k * difftime);
	let winkelabweichung = (props.TWD - props.TSS) % 360;
	winkelabweichung = winkelabweichung < -180 ? winkelabweichung % 180 + 180 : winkelabweichung
	winkelabweichung = winkelabweichung > 180 ? winkelabweichung % 180 - 180 : winkelabweichung
	TWD_Abweichung[0] = winkelabweichung < TWD_Abweichung[0] ? winkelabweichung : TWD_Abweichung[0];
	TWD_Abweichung[1] = winkelabweichung > TWD_Abweichung[1] ? winkelabweichung : TWD_Abweichung[1];
	//console.log("TWD_PT1: " + self.gps.TSS.toFixed(2) + " TWD " + self.TWD.toFixed(2) + " delta ", + winkelabweichung.toFixed(2) + " Abw: " + self.TWD_Abweichung[0].toFixed(2) + ":" + self.TWD_Abweichung[1].toFixed(2) + " DT " + self.deltat.toFixed(0))
};


let DrawLaylineArea=function(ctx, radius, angle,TWD_Abweichung, color) {

	// TWA und LL-angle auf pos bereich umrechnen
	// wenn TWD+360 > LL-angle+360 -> grün sonst -> rot


	ctx.save();
	var radius = 0.9*radius	//0.45*Math.min(x,y)
									ctx.rotate((angle / 180) * Math.PI)

									// Laylines
	ctx.beginPath();
	ctx.moveTo(0, 0);   // Move pen to center
	ctx.lineTo(0, -radius);
	ctx.closePath();

	ctx.lineWidth = radius/20;//5;
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	let dashes=radius/4
	ctx.setLineDash([Math.floor(0.5*dashes), Math.floor(0.5*dashes)])	//0.1*Math.min(x,y), 0.1*Math.min(x,y)]);
	ctx.stroke();

	// Areas	
	ctx.globalAlpha *= 0.3;
	ctx.beginPath();
	ctx.moveTo(0, 0);   // Move pen to center
	ctx.arc(0, 0, radius, Math.PI * (TWD_Abweichung[0] - 90) / 180, Math.PI * (TWD_Abweichung[1] - 90) / 180)
													ctx.closePath();

	ctx.fillStyle = color;
	ctx.fill()
	ctx.restore()
}




let DrawWindpfeilIcon=function(ctx, radius,angle, color, Text) {
	ctx.save();

	var radius_kompassring = radius	//0.525*Math.min(x,y);
	var radius_outer_ring = radius *1.3//= 0.65*Math.min(x,y);
	var thickness = radius/4;

	ctx.rotate((angle / 180) * Math.PI)

													ctx.beginPath();
	if (Text == 'A')
		ctx.moveTo(0, -radius_kompassring + 0.75*thickness); // Move pen to bottom-center corner
	else
		ctx.moveTo(0, -radius_kompassring - 0.5*thickness); // Move pen to bottom-center corner
	ctx.lineTo(-0.75*thickness, -radius_outer_ring-thickness); // Line to top left corner
		ctx.lineTo(+0.75*thickness, -radius_outer_ring-thickness); // Line to top-right corner
	ctx.closePath(); // Line to bottom-center corner
		ctx.fillStyle = color;
	ctx.lineWidth = 0.05*thickness;
	ctx.strokeStyle = color;
	ctx.fill();
	ctx.strokeStyle = "rgb(0,0,0)";
	ctx.stroke(); // Render the path				ctx.fillStyle='rgb(255,255,255)';

	ctx.fillStyle = "rgb(255,255,255)";
	ctx.textAlign = "center";
	ctx.font = "bold "+radius/4+"px Arial";
	ctx.fillText(Text, 0, -radius_outer_ring);
	ctx.restore();

}




let DrawOuterRing=function(ctx,radius, angle){
	ctx.save();
	ctx.rotate((angle / 180) * Math.PI)

									var thickness = 0.2*radius
	radius*=1.25
	var someColors = [];
	someColors.push("#0F0");
	someColors.push("#000");
	someColors.push("#F00");

	drawMultiRadiantCircle(0, 0, radius, thickness, someColors);

	function drawMultiRadiantCircle(xc, yc, r, thickness, radientColors) 
	{
		var partLength = (2 * Math.PI) / 2;
		var start = -Math.PI / 2;
		var gradient = null;
		var startColor = null,
				endColor = null;

		for (var i = 0; i < 2; i++) {
			startColor = radientColors[i];
			endColor = radientColors[(i + 1) % radientColors.length];

			// x start / end of the next arc to draw
			var xStart = xc + Math.cos(start) * r;
			var xEnd = xc + Math.cos(start + partLength) * r;
			// y start / end of the next arc to draw
			var yStart = yc + Math.sin(start) * r;
			var yEnd = yc + Math.sin(start + partLength) * r;

			ctx.beginPath();

			gradient = ctx.createLinearGradient(xStart, yStart, xEnd, yEnd);
			gradient.addColorStop(0, startColor);
			gradient.addColorStop(1.0, endColor);

			ctx.strokeStyle = gradient;
			ctx.arc(xc, yc, r, start, start + partLength);
			ctx.lineWidth = thickness;
			ctx.stroke();
			ctx.closePath();

			start += partLength;
		}
	}
	for (var i = 0; i < 360; i += 10) {
		ctx.save();
		ctx.rotate((i / 180) * Math.PI);
		if (i % 30 == 0) {
			ctx.beginPath(); // Start a new path
			ctx.moveTo(0, -radius+0.9*thickness/2); // Move the pen to (30, 50)
			ctx.lineTo(0, -radius-0.9*thickness/2); // Draw a line to (150, 100)
			ctx.lineWidth = 0.1*thickness;
			ctx.strokeStyle = "rgb(255,255,255)";
			ctx.stroke(); // Render the path				ctx.fillStyle='rgb(255,255,255)';
		} else {
			ctx.beginPath();
			ctx.fillStyle = "rgb(190,190,190)";
			ctx.arc(0, -radius, 0.1*thickness, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.lineWidth = 0.05*thickness;
			ctx.strokeStyle = "rgb(190,190,190)";
			ctx.stroke();
		}
		ctx.restore();
	}
	ctx.restore();
} //Ende OuterRing

let DrawKompassring=function(ctx,radius, angle) {
	ctx.save();
	ctx.rotate((angle / 180) * Math.PI)
									var thickness = 0.2*radius//1*Math.min(x,y)
									ctx.beginPath();
	var fontsize=Math.round( radius/100*12 )
									ctx.arc(0, 0, radius, 0, 2 * Math.PI, false);
	ctx.lineWidth = thickness;
	ctx.strokeStyle = "rgb(255,255,255)";
	ctx.stroke();
	for (var i = 0; i < 360; i += 10) {
		ctx.save();
		ctx.rotate((i / 180) * Math.PI);
		if (i % 30 == 0) {
			ctx.fillStyle = "rgb(00,00,00)";
			ctx.textAlign = "center";
			ctx.font =  `bold ${fontsize}px Arial`;
			ctx.fillText(i.toString().padStart(3, "0"), 0, -radius + thickness/4);
		} else {
			ctx.beginPath();
			ctx.fillStyle = "rgb(100,100,100)";
			ctx.arc(0, -radius, 0.1*thickness, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.lineWidth = 0.05*thickness;
			ctx.strokeStyle = "rgb(100,100,100)";
			ctx.stroke();
		}
		ctx.restore();
	}
	ctx.restore();
} // Ende Kompassring



