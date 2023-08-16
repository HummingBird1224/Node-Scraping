// const axios = require('axios');
// const Captcha = require("2captcha");

// const captchaSolver = new Captcha.Solver("ae73173b700344e0bc87654d0dab8b75");

// exports.getInfo = async function  () {
// 	console.log('lets start scraping!');

// 	const { data } = await captchaSolver.hcaptcha(
//       "ae73173b700344e0bc87654d0dab8b75",
//       "https://www.biccamera.com/bc/category/001/150/005/"
//   );

// 	axios.get(
// 		'https://www.biccamera.com/bc/main/', 
// 			// {
// 			// 	captcha_key: data,
// 			// 	user_agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
// 			// }
// 		)
// 		.then((res) => {
// 			console.log(res.data);
// 		})

// 	// var urlPrefix = 'https://hoikuhiroba-kuchikomi.com/company?page='
// 	// var pageIndex = 1;

// 	// var getInterval = setInterval(() => {
// 	// 	var pageUrl = urlPrefix + pageIndex;
// 	// 	const companyUl = axios.get(pageUrl);
// 	// }, 10000);
// }

const { ZenRows } = require("zenrows");
const axios = require('axios');
// const { categoryList } = require("../models/category.model");
const mysql = require('mysql2/promise');
const fs = require('fs');

// create the connection pool
const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'bigcamera'
});
const baseUrl = "https://www.biccamera.com/bc/category/001/";


class GetItemInfo {
	constructor(page, url, category_id) {
		this.page = page;
		// this.client = client;
		this.url = url;
		this.category_id = category_id;
	}
	async asinToJan() {
		const page_url = this.url + '?p=' + this.page;
		console.log(page_url);
		// try {
		// console.log(this.client)
		await axios.get(page_url)
			.then(({ data }) => {
				// console.log(data);
				fs.writeFile('data.txt', this.page + data, err => {
					if (err) {
						console.error(err);
					}
				});
				const ul = data.split('<div class="bcs_listItem"')[1].split('</form>')[0];
				// console.log(ul.length);
				const lists = ul.split('<li class="prod_box');
				for (let i = 1; i < lists.length; i++) {
					var product = {};
					var image_link = lists[i].split('<a')[1].split('</a>')[0];
					product.image_link = '<a ' + image_link + '\n</a>';
					product.name = lists[i].split('class="bcs_item">')[1].split('</a>')[0];
					product.price = parseInt(lists[i].split('<span class="val">')[1].split('円</span>')[0].replace(/,/g, ''));
					product.bc_id = parseInt(lists[i].split('data-item-id="')[1].split('" data-item-name')[0]);
					product.category_id = this.category_id;
					// console.log(typeof (product.price));
					pool.query('INSERT INTO products SET ?', product, (err, result) => {
						if (err) {
							console.error(err);
							return;
						}
						console.log(result);
					})
				}
			})
			.catch((err) => {
				console.log(err);
			});

		// } catch (err) {
		// 	console.error(error.message);
		// }
	}
}

class GetPageInfo {
	constructor(num, dataAry) {
		this.num = num;
		this.dataAry = dataAry;
		// this.client = client;
	}
	async asinToJan() {
		// console.log(this.num, this.dataAry);
		const url = baseUrl + this.dataAry[this.num].category_id + '/' + this.dataAry[this.num].bc_id + '/';
		console.log(url);
		const category_id = this.dataAry[this.num].id;
		// const url = "https://www.biccamera.com/bc/category/001/150/005/?p=2";
		// console.log(this.client);
		// console.log(typeof(this.dataAry[this.num].category_id));					
		// try {
		// await this.client.get(url, {})
		await axios.get(url)
			.then(({ data }) => {
				console.log(data);
				// const pages = data.split('<div class="bcs_pager">')[1].split('</div>')[0];
				// const page_list = pages.split('<li>');
				// const page_num = page_list[page_list.length - 1].split('">')[1].split('</')[0];
				// console.log(page_num);
				// var page = 1;
				// var getInterval = setInterval(() => {
				// 	if (page <= page_num) {
				// 		// const page_url = 'https://www.biccamera.com/bc/category/001/150/005/';
				// 		// console.log(page_url);
				// 		// const { page_data } = await this.client.get(page_url, {});
				// 		// console.log(page_data);
				// 		let getItemInfo = new GetItemInfo(page, url, category_id);
				// 		getItemInfo.asinToJan();
				// 		page++;
				// 	} else {
				// 		clearInterval(getInterval);
				// 	}
				// }, 500);
			})
			.catch((err) => {
				console.log(err);
			});
		// console.log(data);
		// fs.writeFile('data.txt', data, err => {
		// 	if (err) {
		// 		console.error(err);
		// 	}
		// });
		// const ul = data.split('<div class="bcs_listItem"')[1].split('</form>')[0];
		// var ul = data.split('<div class="bcs_listItem"');
		// console.log(ul.length);
		// const lists = ul.split('<li class="prod_box');
		// const pages = data.split('<div class="bcs_pager">')[1].split('</div>')[0];
		// const page_list = pages.split('<li>');
		// const page_num = page_list[page_list.length - 1].split('">')[1].split('</')[0];
		// console.log(page_num)
		// var page = 1;
		// const page_url = 'https://www.biccamera.com/bc/category/001/150/005/?p=5';
		// console.log(page_url);
		// await this.client.get(page_url, {})
		// 	.then((page_data) => {

		// 		console.log(page_data);
		// 	});
		// var getInterval = setInterval(() => {
		// if (page <= page_num) {
		// const page_url = 'https://www.biccamera.com/bc/category/001/150/005/';
		// console.log(page_url);
		// const { page_data } = await this.client.get(page_url, {});
		// console.log(page_data);
		// let getItemInfo = new GetItemInfo(page, this.client);
		// getItemInfo.asinToJan();
		// page++;
		// 	} else {
		// 		clearInterval(getInterval);
		// 	}
		// }, 1000);
		// for (let i = 1; i < lists.length; i++) {
		// 	var product = {};
		// 	var image_link = lists[i].split('<a')[1].split('</a>')[0];
		// 	product.image_link = '<a ' + image_link + '\n</a>';
		// 	product.name = lists[i].split('class="bcs_item">')[1].split('</a>')[0];
		// 	product.price = lists[i].split('<span class="val">')[1].split('円</span>')[0];
		// 	// console.log(product);
		// }
		// }
		// catch (error) {
		// 	console.log(error);
		// 	// if (error.response) {
		// 	// 		console.error(error.response.data);
		// 	// }
		// }
	}
}

exports.getInfo = async () => {
	// const client = new ZenRows("");
	// const url = "https://www.biccamera.com/bc/category/001/150/005/";
	pool.query('SELECT * FROM sub_categories')
		.then(results => {
			const subCategories = results[0];

			var max = subCategories.length;
			var index = 44;
			var inputInterval = setInterval(() => {

				if (index <= max) {
					let getPageInfo = new GetPageInfo(index, subCategories);
					getPageInfo.asinToJan();
					index++;
				} else {
					clearInterval(inputInterval);
				}

			}, 1000 * 10);

			// for(let i=1; i<=subCategories.length;i++){
			// 	setTimeout(async()=>{
			// 		// console.log(subCategories[0])
			// 		const url=baseUrl+subCategories[i-1].category_id+'/'+subCategories[i-1].bc_id;	
			// 		// console.log(url);					
			// 		try {
			// 				const { data } = await client.get(url, {});
			// 				console.log(data);
			// 				var ul = data.split('<div class="bcs_listItem"')[1].split('</form>')[0];
			// 				var lists=ul.split('<li class="prod_box');
			// 				for(let i = 1; i<lists.length; i++){
			// 					var product={};
			// 					var image_link=lists[i].split('<a')[1].split('</a>')[0];
			// 					product.image_link='<a '+image_link+'\n</a>';
			// 					product.name=lists[i].split('class="bcs_item">')[1].split('</a>')[0];
			// 					product.price=lists[i].split('<span class="val">')[1].split('円</span>')[0];
			// 					// console.log(product);
			// 				}
			// 		} 
			// 		catch (error) {
			// 				console.error(error.message);
			// 				if (error.response) {
			// 						console.error(error.response.data);
			// 				}
			// 		}
			// 	}, 10000*i)
			// }
			// console.log(subCategories);
		})
		.catch(err => {
			console.log(err);
		})
	// try {
	// 		const { data } = await client.get(url, {});
	// 		var ul = data.split('<div class="bcs_listItem"')[1].split('</form>')[0];
	// 		// console.log(ul);
	// 		var lists=ul.split('<li class="prod_box');
	// 		for(let i = 1; i<lists.length; i++){
	// 			var product={};
	// 			var image_link=lists[i].split('<a')[1].split('</a>')[0];
	// 			product.image_link='<a '+image_link+'\n</a>';
	// 			product.name=lists[i].split('class="bcs_item">')[1].split('</a>')[0];
	// 			product.price=lists[i].split('<span class="val">')[1].split('円</span>')[0];
	// 			console.log(product);
	// 		}
	// } 
	// catch (error) {
	// 		console.error(error.message);
	// 		if (error.response) {
	// 				console.error(error.response.data);
	// 		}
	// }
};