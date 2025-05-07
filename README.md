## Puppetter Proxy

# Launch Docker Container

Launches proxy on localhost:8080

```
docker-compose up
```

# Make Proxied Request
```
curl -x http://localhost:8080 https://www.google.com 
```