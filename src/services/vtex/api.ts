const options = {
	method: 'GET',
	headers: {'Content-Type': 'application/json', Accept: 'application/json'}
}
  
fetch('https://apiexamples.vtexcommercestable.com.br/api/catalog_system/pvt/products/GetProductAndSkuIds?categoryId=1&_from=1&_to=10', options)
	.then(response => console.log(response))
	.catch(err => console.error(err))


