from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn.functional as F
from typing import List
from fastapi.responses import JSONResponse

app = FastAPI()

# Load model and tokenizer outside the API endpoint for efficiency
tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/all-mpnet-base-v2')
model = AutoModel.from_pretrained('sentence-transformers/all-mpnet-base-v2')

#Mean Pooling - Take attention mask into account for correct averaging
def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0] #First element of model_output contains all token embeddings
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)


class SentenceRequest(BaseModel):
    sentence: str


@app.post("/api/generate-embedding")
async def generate_embedding(request: SentenceRequest):
    """
    Generates sentence embedding for a given sentence.

    Args:
        request: A SentenceRequest object containing the sentence to embed.

    Returns:
        A JSON response containing the sentence embedding.
    """
    try:
        sentence = request.sentence

        # Tokenize sentences
        encoded_input = tokenizer(sentence, padding=True, truncation=True, return_tensors='pt')

        # Compute token embeddings
        with torch.no_grad():
            model_output = model(**encoded_input)

        # Perform pooling
        sentence_embedding = mean_pooling(model_output, encoded_input['attention_mask'])

        # Normalize embeddings
        sentence_embedding = F.normalize(sentence_embedding, p=2, dim=1)

        # Convert to list for JSON serialization
        embedding_list = sentence_embedding.tolist()

        return {"embedding": embedding_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  # Handle errors gracefully



# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)