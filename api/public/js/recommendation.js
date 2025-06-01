const checkboxElements = document.querySelectorAll("input[type=checkbox]");

const preferences = {}

checkboxElements.forEach((ele) => {
    preferences[ele.value] = ele.checked;
    ele.addEventListener("click", (e) => {
        preferences[ele.value] = ele.checked;
        const keys = Object.keys(preferences)
        const payload = []
        keys.map((k) => {
            if (preferences[k]) {
                payload.push(Number(k))
            }
        })
        const url = 'http://localhost:8383/api/products/recommendation';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                products: payload
            })
        };

        fetch(url, options)
            .then(response => response.json())
            .then(products => {
                console.log('Recommendations:', products)

                // Let's add the products to the DOM
                const productsElement = document.querySelector(".products");
                productsElement.innerHTML = "";

                products.forEach(({ product, similarity}) => {
                    // console.log(product.name);
                    // console.log(similarity);

                    const cardElement = document.createElement("div")
                    cardElement.classList.add("column")
                    cardElement.classList.add("product-card")

                    const h2Element = document.createElement("h2")
                    h2Element.innerText = product.name

                    const pElement = document.createElement("p")
                    pElement.innerText = product.description

                    const ratingElement = document.createElement("p")
                    ratingElement.classList.add("rating");
                    ratingElement.innerText = product.rating;

                    const similarityElement = document.createElement("p")
                    similarityElement.classList.add("similarity")
                    similarityElement.innerText = similarity

                    cardElement.appendChild(h2Element);
                    cardElement.appendChild(pElement);
                    cardElement.appendChild(ratingElement);
                    cardElement.appendChild(similarityElement);

                    productsElement.appendChild(cardElement);
                })

            })
            .catch(error => console.error('Error making API call:', error));
    })
});

console.log(preferences);