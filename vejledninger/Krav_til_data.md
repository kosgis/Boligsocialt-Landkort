Krav til data
========
Der er en række krav til de data, som web-løsningen skal visualisere. Der kan hentes inspiration fra demodata, da disse opfylder kravene.

Web-GIS løsningen er sat op til at pege på:

- GeoJSON-filer (distrikter)
- JSON-filer (data)

Det er desuden vigtigt, at der kun er det nødvendige data i GeoJSON/JSON filerne dvs. antallet af kolonner, rækker, tegn mv. skal minimeres, således data fylder mindst muligt.

###GeoJSON###
GeoJSON-filerne indeholder geometrier/distrikter, som har rumlig reference. I demodataet er der to GeoJSON-filer hhv. karreer og kvadratnet for Frederiksberg Kommune. WebGiS løsningen kan tilpasses til at vise flere forskellige/andre distrikter, eksempelvis distrikter fra Danmarks Statistik.

**Projektion**<br>
WebGIS-løsningen er sat op til at køre i Googles projektion **3857** (Spherical Mercator), men alt data er sat op til projektionen 4326 (WGS 84). Det anbefales at projektion 4326 benyttes til dataprojektion.

**Datastruktur GeoJSON**<br>
Der er krav til, hvad GeoJSON-filerne skal indeholde af data. Det er vigtigt at de udover geometrien som minimum indeholder et unikt felt ved navnet ```Distrikt_id```

Eksempel:

    {
        "type" : "FeatureCollection",
        "crs" : {
            "type" : "name",
            "properties" : {
                "name" : "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features" : [{
                "type" : "Feature",
                "properties" : {
                    "distrikt_id" : "6806"
                },
                "geometry" : {
                    "type" : "MultiPolygon",
                    "coordinates" : [[[[12.506952, 55.674697], [12.506746, 55.674125], [12.506457, 55.67416], [12.506248, 55.674174], [12.506038, 55.674179], [12.505827, 55.674175], [12.505618, 55.674162], [12.505463, 55.674145], [12.505295, 55.674625], [12.506952, 55.674697]]]]
                }
            }, {
                "type" : "Feature",
                "properties" : {
                    "distrikt_id" : "6515"
                },
                "geometry" : {
                    "type" : "MultiPolygon",
                    "coordinates" : [[[[12.502603, 55.672466], [12.502551, 55.672429], [12.500548, 55.672475], [12.500489, 55.672936], [12.502095, 55.672963], [12.502431, 55.672996], [12.502603, 55.672466]]]]
                }
            }, 
            ...
        ]
    }


###JSON###

JSON-filerne skal indeholde tabeller med det aggrerede data, som skal fremvises i webGIS-løsningen. Data skal være aggreret ud på geometrien, dvs. hvis rådata er i punktform, skal det aggreres ud på en rumligt refereret geometri (eks. karreer), således der i JSON tabellerne er et ID (Distrikt_id), som er unikt og henviser til GeoJSON objekterne.

**Datastruktur JSON**<br>
JSON tabellerne kan struktureres som nedenstående:

- Distrikt_id *(unikt ID for hver række i tabellen)*
- Type_id (den type geometri, data skal pege på)
- Antal samlet *(Samlet antal borgere i geometrien)*
- Antal *(samlet antal forekomster i geometrien, eks. 0-5 årige i geometrien)*
- Procent *(Relativ andel forekomster eks. relativ andel 0-5 årige i geometrien - denne kan med fordel fremvises i webGIS-løsningen)*
- Udtraek_dato *(dato for dataudtræk - bruges til at vise data over tid)*

Eksempel:

    [{
            "distrikt_id" : "100m_61762_7196",
            "type_id" : 11,
            "antal_samlet" : 21,
            "antal" : 0,
            "procent" : 0,
            "udtraek_dato" : "2012-10-02"
        }, {
            "distrikt_id" : "100m_61763_7196",
            "type_id" : 11,
            "antal_samlet" : 7,
            "antal" : 0,
            "procent" : 0,
            "udtraek_dato" : "2012-10-02"
        }, 
        ...
    }]

###Behandling af data i pilotprojektet:###
I pilotprojektet er data behandlet som vist i figuren nedenfor. 

![](https://raw.githubusercontent.com/kosgis/Boligsocialt-Landkort/master/screendumps/workflow_GIS.png)
