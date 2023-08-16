const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const { executablePath } = require("puppeteer");
const iconv = require('iconv-lite');
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

class GetItemInfo {
	constructor(page) {
		this.page = page;
	}
	async asinToJan(max) {
		console.log(max);
		const data = fs.readFileSync('url.txt', 'utf8');
		const urlList = data.split(',');
		// console.log(max);
		let url;
		for (let i = 1; i <= max; i++) {
			url = urlList[i - 1];
			console.log(url);
			await this.page.goto(url, { waitUntil: 'load', timeout: 0 });
			const pagination = await this.page.$$('.bcs_pager');

			if (pagination.length > 0) {
				const content = JSON.stringify(await Promise.all(pagination.map(async (p) => {
					return await p.evaluate(x => x.textContent);
				})));
				pageNum = content.match(/\d+/g).pop();
			}
			else {
				pageNum = 1;
			}
			console.log(pageNum);
			for (let j = 1; j <= pageNum; j++) {
				const page_url = url + '&p=' + j;
				// console.log(page_url);

				await this.page.goto(page_url, { waitUntil: 'load', timeout: 0 });

				const element = await this.page.$('.bcs_listItem');
				const ul = await this.page.evaluate(element => {
					return element.innerHTML;
				}, element);
				var list = ul.split('<li class="prod_box');

				for (let k = 1; k < list.length; k++) {
					var product = {};
					var image_link = list[k].split('<a')[1].split('</a>')[0];
					product.name = list[k].split('class="bcs_item">')[1].split('</a>')[0];
					product.bc_id = parseInt(list[k].split('data-item-id="')[1].split('" data-item-name')[0]);
					product.category_id = selectedCategories[i - 1].id;
					product.price = {};
					product.price['value'] = list[k].split('<span class="val">')[1] ? parseInt(list[k].split('<span class="val">')[1].split('円</span>')[0].replace(/,/g, '')) : null;
					product.price['date'] = new Date();
					// product.created_at = new Date();
					// product.updated_at = new Date();
					product.image_link = '<a ' + image_link + '\n</a>';
					let result = await pool.query('SELECT * FROM products WHERE bc_id = ?', [product.bc_id], function (error, results, fields) {
						if (error) throw error;
						return results;
					});

					if (result[0].length == 0) {
						pool.query('INSERT INTO products (name, bc_id, category_id, price,  image_link, max_price, min_price) VALUES(?,?,?,?,?,?,?,?,?)',
							[product.name, product.bc_id, product.category_id, JSON.stringify([product.price]), product.image_link, product.price.value, product.price.value],
							(err, result) => {
								if (err) {
									console.error(err);
									return;
								}
								return result;
							});
					}
					else {
						const _product = result[0][0];
						const prices = JSON.parse(_product.price);
						const jsonData = JSON.stringify([...prices, product.price]);
						// const current_price = product.price.value;
						// const prev_price = _product.current_price;
						// const price_difference = current_price - prev_price;
						// const price_percent = current_price / prev_price * 100;
						const max_price = Math.max(_product.max_price, product.price.value);
						const min_price = Math.min(_product.max_price, product.price.value);
						product.price = jsonData;
						pool.query('UPDATE products SET name=?, bc_id=?, category_id=?, price=?,  image_link=?, max_price=?, min_price=? WHERE id = ?',
							[product.name, product.bc_id, product.category_id, product.price, product.image_link, max_price, min_price, _product.id], (err, results, fields) => {
								if (err) throw err;
								// console.log(results);
							});
					}
				}
			}
		}
	}
}

// Launch puppeteer-stealth
exports.getInfo = async () => {
	let sub_categories, max;
	let index = 1;
	// await pool.query('SELECT * FROM sub_categories WHERE status = 1')
	// 	.then(async results => {
	// 		sub_categories = results[0];
	// 		max = results[0].length;
	// 		// console.log('Result 1 -------------------------->>>>>>>>>>>>>', results);
	// 	})
	// 	.catch(err => {
	// 		throw err;
	// 	});

	puppeteer.launch({
		headless: true,
		args: [
			"--disable-gpu",
			"--disable-dev-shm-usage",
			"--no-sandbox",
			"--disable-setuid-sandbox"
		]
	}).then(async browser => {

		const page = await browser.newPage();
		await page.setDefaultNavigationTimeout(0);
		await page.setDefaultTimeout(0);

		await page.setViewport({ width: 1280, height: 720 });

		let selectedCategories, max, subCategories;

		await pool.query('SELECT * FROM sub_categories where status=?', [1])
			.then(async results => {
				fs.truncate('url.txt', 0, (err) => {
					if (err) {
						console.error(err);
						return;
					}
					console.log('File content deleted successfully!');
				});
				// console.log('Result 2 -------------------------->>>>>>>>>>>>>', results);
				selectedCategories = results[0];
				max = selectedCategories.length;
				var _url = '';
				let index = 0;

				var getInterval = setInterval(() => {
					// for (let selectedCategory of selectedCategories) {
					try {
						let selectedCategory = selectedCategories[index];

						// Make makers
						if (selectedCategory.makers != null) {
							var allMaker = '';
							var s_makers = JSON.parse(selectedCategory.makers);

							for (let k = 0; k < s_makers.length; k++) {

								if (s_makers[k].status == 1) {
									var encodedText = '';
									var japaneseText = s_makers[k].value;

									for (let i = 0; i < japaneseText.length; i++) {
										let char = japaneseText.charAt(i);
										let charCode = japaneseText.charCodeAt(i);

										if ((charCode >= 0x3000 && charCode <= 0x9FFF) || char.match(/[^\x00-\x7F]/)) {
											// Japanese or non-ASCII character, encode using Shift JIS
											let encodedChar = iconv.encode(char, 'Shift_JIS').toString('hex');
											encodedText += encodedChar.toUpperCase().replace(/^(\w{2})(\w{2})$/, '%$1%$2');
										} else {
											// ASCII character, leave as is
											encodedText += char;
										}
									}
									allMaker += (allMaker != '') ? ('|' + encodedText) : encodedText;
								}
							}
						}

						_url = 'https://www.biccamera.com/bc/category/001/' + selectedCategory.category_id + '/' + selectedCategory.bc_id + '/?entr_nm=' + allMaker + '&rowPerPage=100';
						var stringToWrite = _url + ",\n";
						console.log(_url);

						fs.appendFile('url.txt', stringToWrite, (err) => {
							if (err) {
								console.error(err);
								return;
							}
						});
						index++;
					}
					catch {
						clearInterval(getInterval);
						console.log('success');
						let getItemInfo = new GetItemInfo(page);
						getItemInfo.asinToJan(max);
					}

				}, 1000)

			})
			.catch(err => {
				throw err;
			});

		// try {
		// 	const data = fs.readFileSync('url.txt', 'utf8');
		// 	const urlList = data.split(',');
		// 	// console.log(max);
		// 	for (let i = 1; i <= max; i++) {
		// 		url = urlList[i - 1] + '&rowPerPage=100';
		// 		// console.log(url);
		// 		await page.goto(url, { waitUntil: 'load', timeout: 0 });
		// 		const pagination = await page.$$('.bcs_pager');

		// 		if (pagination.length > 0) {
		// 			const content = JSON.stringify(await Promise.all(pagination.map(async (p) => {
		// 				return await p.evaluate(x => x.textContent);
		// 			})));
		// 			pageNum = content.match(/\d+/g).pop();
		// 		}
		// 		else {
		// 			pageNum = 1;
		// 		}
		// 		// console.log(pageNum);
		// 		for (let j = 1; j <= pageNum; j++) {
		// 			const page_url = url + '&p=' + j;
		// 			// console.log(page_url);

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
		// 							// console.log(results);
		// 						});
		// 				}
		// 			}
		// 		}
		// 	}
		// } catch (err) {
		// 	console.error(err);
		// }

		await browser.close();
	});
}