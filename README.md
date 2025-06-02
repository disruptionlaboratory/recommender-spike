# Recommender Spike

A RESTful API using Express, Sequelize and PostgreSQL database as a vector datastore

## Approach

- PostgreSQL database used as vector database
- Persisting Products in vector database - say, movies
- Based on user's preferences (movies purchased or liked) more movies will be recommended

## Technical Details

- Docker / Container
- Express API
- PostgreSQL



## How it works

- Created a collection of movies (thanks to LLama 3.3 running locally)
- Created embeddings for each movie using its description field
- Based on user's purchasing habits or likes, more movies are recommended based on similarity - and the similarity is how close those embeddings sit in vector space


Here, movies are returned based on this user's orders
```shell
curl -X GET "http://localhost:8383/api/products/recommendation?users_id=1"
```


Here is a Web UI example based on preferences:

http://localhost:8383/

## Initial Thoughts

It's a bit of a faff setting everything up and there's a compute, memory and size cost, but it works and is generalised enough that it would work with any kind of product that has a description.

However, it isn't really personalized yet.  It does NOT tell me what other people like me are watching, for example.  

It's basically grouping similar things together based on the description.

If you're able to structure the data, it would involve less compute and more accurate to simply use keywords...

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





