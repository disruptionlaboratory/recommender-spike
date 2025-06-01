# Embeddings

```shell
python3 -m venv .  
source bin/activate
```

### Example prompt in order to get vector
```shell
curl -X POST http://127.0.0.1:7474/api/generate -H 'Content-Type: application/json' -d '{"sentence": "Fiction"}'
```
