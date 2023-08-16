const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const { executablePath } = require("puppeteer");

const mysql = require('mysql2/promise');
const fs = require('fs');

// Use stealth 
puppeteer.use(pluginStealth());

const baseUrl = "https://www.biccamera.com/bc/category/001/";

const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'bigcamera'
});

exports.getInfo = async () => {
	console.log("getInfo start!!!!!!");
	puppeteer.launch({
		headless: "true",
		//executablePath: '/usr/bin/chromium-browser',
		args: [
			"--disable-gpu",
			"--disable-dev-shm-usage",
			"--no-sandbox",
			"--disable-extensions",
			"--disable-setuid-sandbox",
			//"user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.8 Safari/537.36"
		]
	}).then(async browser => {
		console.log("aaaaaaaaaaaaaa2");
		// Create a new page 
		const page = await browser.newPage();
		console.log("aaaaaaaaaaaaaa3");
		await page.setDefaultNavigationTimeout(0);
		await page.setDefaultTimeout(0);
		// Set page view 
		await page.setViewport({ width: 0, height: 0 });
		console.log("aaaaaaaaaaaaaa4");
		let selectedCategories, max, subCategories;

		// navigate to the website
		await pool.query('SELECT * FROM sub_categories where status=?', [1])
			.then(async results => {
				selectedCategories = results[0];
				max = selectedCategories.length;
			})
			.catch(err => {
				throw err;
			});

		try {
			const data = fs.readFileSync('url.txt', 'utf8');
			const urlList = data.split(',');
			console.log(max);

			url = urlList[0] + '&rowPerPage=100';
			console.log("FFFF1");
			console.log(url);
			await page.goto(url, { waitUntil: 'load', timeout: 0 });
			//console.log("FFFF2");
			const pagination = await page.$$('.bcs_pager');
			//console.log("FFFF3");
			//console.log("FFFF4",pagination.length);

			if (pagination.length > 0) {
				const content = JSON.stringify(await Promise.all(pagination.map(async (p) => {
					return await p.evaluate(x => x.textContent);
				})));
				pageNum = content.match(/\d+/g).pop();
			}
			else {
				pageNum = 1;
			}

			console.log("pageNum>>>>", pageNum);

			// 	for (let i = 1; i <= 2; i++) {
			// 		url = urlList[i - 1] + '&rowPerPage=100';
			// 		console.log(url);

			// 		await page.goto(url, { waitUntil: 'load', timeout: 0 });
			// 		const pagination = await page.$$('.bcs_pager');
			// 		console.log("FFFF");

			// 		if (pagination.length > 0) {
			// 			const content = JSON.stringify(await Promise.all(pagination.map(async (p) => {
			// 				return await p.evaluate(x => x.textContent);
			// 			})));
			// 			pageNum = content.match(/\d+/g).pop();
			// 		}
			// 		else {
			// 			pageNum = 1;
			// 		}
			// 		console.log(pageNum);
			// 		for (let j = 1; j <= pageNum; j++) {
			// 			const page_url = url + '&p=' + j;
			// 			console.log(page_url);

			// 			await page.goto(page_url, { waitUntil: 'load', timeout: 0 });

			// 			const element = await page.$('.bcs_listItem');
			// 			const ul = await page.evaluate(element => {
			// 				return element.innerHTML;
			// 			}, element);
			// 			var list = ul.split('<li class="prod_box');

			// 			for (let k = 1; k < list.length; k++) {
			// 				var product = {};
			// 				var image_link = list[k].split('<a')[1].split('</a>')[0];
			// 				product.name = list[k].split('class="bcs_item">')[1].split('</a>')[0];
			// 				product.bc_id = parseInt(list[k].split('data-item-id="')[1].split('" data-item-name')[0]);
			// 				product.category_id = selectedCategories[i - 1].id;
			// 				product.price = {};
			// 				product.price['value'] = list[k].split('<span class="val">')[1] ? parseInt(list[k].split('<span class="val">')[1].split('円</span>')[0].replace(/,/g, '')) : null;
			// 				product.price['date'] = new Date();
			// 				product.created_at = new Date();
			// 				product.updated_at = new Date();
			// 				product.image_link = '<a ' + image_link + '\n</a>';
			// 				let result = await pool.query('SELECT * FROM products WHERE bc_id = ?', [product.bc_id], function (error, results, fields) {
			// 					if (error) throw error;
			// 					return results;
			// 				});

			// 				if (result[0].length == 0) {
			// 					pool.query('INSERT INTO products (name, bc_id, category_id, price, created_at, updated_at, image_link, max_price, min_price) VALUES(?,?,?,?,?,?,?,?,?)',
			// 						[product.name, product.bc_id, product.category_id, JSON.stringify([product.price]), product.created_at, product.updated_at, product.image_link, product.price.value, product.price.value],
			// 						(err, result) => {
			// 							if (err) {
			// 								console.error(err);
			// 								return;
			// 							}
			// 							return result;
			// 						});
			// 				}
			// 				else {
			// 					const _product = result[0][0];
			// 					const prices = JSON.parse(_product.price);
			// 					const jsonData = JSON.stringify([...prices, product.price]);
			// 					// const current_price = product.price.value;
			// 					// const prev_price = _product.current_price;
			// 					// const price_difference = current_price - prev_price;
			// 					// const price_percent = current_price / prev_price * 100;
			// 					const max_price = Math.max(_product.max_price, product.price.value);
			// 					const min_price = Math.min(_product.max_price, product.price.value);
			// 					product.price = jsonData;
			// 					pool.query('UPDATE products SET name=?, bc_id=?, category_id=?, price=?, updated_at=?, image_link=?, max_price=?, min_price=? WHERE id = ?',
			// 						[product.name, product.bc_id, product.category_id, product.price, product.updated_at, product.image_link, max_price, min_price, _product.id], (err, results, fields) => {
			// 							if (err) throw err;
			// 							console.log(results);
			// 						});
			// 				}
			// 			}
			// 		}
			// 	}
		} catch (err) {
			console.error(err);
		}

		await browser.close();
	});
}