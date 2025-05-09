## Puppetter Proxy

### Launch Docker Container

Launches proxy on localhost:8080

```
docker-compose up
```

### Make Proxied Request
```
make POST request to: http://localhost:8080/search
```

### Request JSON Body Structure

Structure:
````
{
    "site_url": "",
    "api_url": "",
    "site_headers": {},
    "api_headers": {},
    "api_payload": {}
}
````

Example:
````
{
    "site_url": "https://www.crexi.com",
    "api_url": "https://api.crexi.com/assets/search",
    "site_headers": {},
    "api_headers": {},
    "api_payload": {
        "latitudeMax": 27.7964110959304,
        "latitudeMin": 27.06936507741394,
        "longitudeMax": -80.2220699004829,
        "longitudeMin": -80.63817707821727,
        "locations": [
            {
                "location": {
                    "latitude": 27.4469878,
                    "longitude": -80.3259631
                },
                "placeId": "ChIJ8bUnop_x3ogRrmeIm8QXhvA",
                "type": "city",
                "viewport": {
                    "northeast": {
                        "lat": 27.48395703777111,
                        "lng": -80.27429803322013
                    },
                    "southwest": {
                        "lat": 27.36184798819152,
                        "lng": -80.42793995918755
                    }
                },
                "city": "Fort Pierce",
                "county": "St. Lucie County",
                "stateCode": "FL"
            }
        ],
        "count": 60,
        "offset": 0,
        "userId": "$device:196ac15342b4f2-036455c8cf0d0f-26011c51-384000-196ac15342b4f2",
        "sortDirection": "Descending",
        "sortOrder": "rank",
        "includeUnpriced": false
    }
}
````

