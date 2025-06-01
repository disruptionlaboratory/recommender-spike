# Recommender Spike

A RESTful API using Express, Sequelize and PostgreSQL database as a vector datastore

## Approach

- PostgreSQL database used as vector database
- Persisting Users preferences in vector database
- Persisting Products in vector database - say, Audible books

## Technical Details

- Docker / Container
- Express API
- PostgreSQL

## Next Steps

- Possibilities include making the capability available via a SaaS service, or simply another tool in the Developer's toolkit.


### Spinning up the local environment

Spin up the environment
```shell
docker compose -p recommender-spike up -d
```

SSH into the container
```shell
docker compose -p recommender-spike exec api bash
```

Access the database via psql client
```shell
psql -U root -h recommender_spike
```

Rebuild the database
```shell
npm run rebuild-db
```

Spin down the environment
```shell
docker compose -p recommender-spike down
```

### PostgreSQL Cheatsheet

List databases

```shell
\l
```
Connect to database

```shell
\c recommender_spike
```

List tables
```shell
\dt
```





