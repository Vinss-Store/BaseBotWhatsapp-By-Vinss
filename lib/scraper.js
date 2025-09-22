const axios = require('axios')
const cheerio = require('cheerio')
const FormData = require("form-data");
const https = require("https");

function pinterest(querry){
	return new Promise(async(resolve,reject) => {
		 axios.get('https://id.pinterest.com/search/pins/?autologin=true&q=' + querry, {
			headers: {
			"cookie" : "_auth=1; _b=\"AVna7S1p7l1C5I9u0+nR3YzijpvXOPc6d09SyCzO+DcwpersQH36SmGiYfymBKhZcGg=\"; _pinterest_sess=TWc9PSZHamJOZ0JobUFiSEpSN3Z4a2NsMk9wZ3gxL1NSc2k2NkFLaUw5bVY5cXR5alZHR0gxY2h2MVZDZlNQalNpUUJFRVR5L3NlYy9JZkthekp3bHo5bXFuaFZzVHJFMnkrR3lTbm56U3YvQXBBTW96VUgzVUhuK1Z4VURGKzczUi9hNHdDeTJ5Y2pBTmxhc2owZ2hkSGlDemtUSnYvVXh5dDNkaDN3TjZCTk8ycTdHRHVsOFg2b2NQWCtpOWxqeDNjNkk3cS85MkhhSklSb0hwTnZvZVFyZmJEUllwbG9UVnpCYVNTRzZxOXNJcmduOVc4aURtM3NtRFo3STlmWjJvSjlWTU5ITzg0VUg1NGhOTEZzME9SNFNhVWJRWjRJK3pGMFA4Q3UvcHBnWHdaYXZpa2FUNkx6Z3RNQjEzTFJEOHZoaHRvazc1c1UrYlRuUmdKcDg3ZEY4cjNtZlBLRTRBZjNYK0lPTXZJTzQ5dU8ybDdVS015bWJKT0tjTWYyRlBzclpiamdsNmtpeUZnRjlwVGJXUmdOMXdTUkFHRWloVjBMR0JlTE5YcmhxVHdoNzFHbDZ0YmFHZ1VLQXU1QnpkM1FqUTNMTnhYb3VKeDVGbnhNSkdkNXFSMXQybjRGL3pyZXRLR0ZTc0xHZ0JvbTJCNnAzQzE0cW1WTndIK0trY05HV1gxS09NRktadnFCSDR2YzBoWmRiUGZiWXFQNjcwWmZhaDZQRm1UbzNxc21pV1p5WDlabm1UWGQzanc1SGlrZXB1bDVDWXQvUis3elN2SVFDbm1DSVE5Z0d4YW1sa2hsSkZJb1h0MTFpck5BdDR0d0lZOW1Pa2RDVzNySWpXWmUwOUFhQmFSVUpaOFQ3WlhOQldNMkExeDIvMjZHeXdnNjdMYWdiQUhUSEFBUlhUVTdBMThRRmh1ekJMYWZ2YTJkNlg0cmFCdnU2WEpwcXlPOVZYcGNhNkZDd051S3lGZmo0eHV0ZE42NW8xRm5aRWpoQnNKNnNlSGFad1MzOHNkdWtER0xQTFN5Z3lmRERsZnZWWE5CZEJneVRlMDd2VmNPMjloK0g5eCswZUVJTS9CRkFweHc5RUh6K1JocGN6clc1JmZtL3JhRE1sc0NMTFlpMVErRGtPcllvTGdldz0=; _ir=0"
		}
			}).then(({ data }) => {
		const $ = cheerio.load(data)
		const result = [];
		const hasil = [];
   		 $('div > a').get().map(b => {
        const link = $(b).find('img').attr('src')
            result.push(link)
		});
   		result.forEach(v => {
		 if(v == undefined) return
		 hasil.push(v.replace(/236/g,'736'))
			})
			hasil.shift();
		resolve(hasil)
		})
	})
}

function wallpaper(title, page = '1') {
    return new Promise((resolve, reject) => {
        axios.get(`https://www.besthdwallpaper.com/search?CurrentPage=${page}&q=${title}`)
        .then(({ data }) => {
            let $ = cheerio.load(data)
            let hasil = []
            $('div.grid-item').each(function (a, b) {
                hasil.push({
                    title: $(b).find('div.info > a > h3').text(),
                    type: $(b).find('div.info > a:nth-child(2)').text(),
                    source: 'https://www.besthdwallpaper.com/'+$(b).find('div > a:nth-child(3)').attr('href'),
                    image: [$(b).find('picture > img').attr('data-src') || $(b).find('picture > img').attr('src'), $(b).find('picture > source:nth-child(1)').attr('srcset'), $(b).find('picture > source:nth-child(2)').attr('srcset')]
                })
            })
            resolve(hasil)
        })
    })
}

function wikimedia(title) {
    return new Promise((resolve, reject) => {
        axios.get(`https://commons.wikimedia.org/w/index.php?search=${title}&title=Special:MediaSearch&go=Go&type=image`)
        .then((res) => {
            let $ = cheerio.load(res.data)
            let hasil = []
            $('.sdms-search-results__list-wrapper > div > a').each(function (a, b) {
                hasil.push({
                    title: $(b).find('img').attr('alt'),
                    source: $(b).attr('href'),
                    image: $(b).find('img').attr('data-src') || $(b).find('img').attr('src')
                })
            })
            resolve(hasil)
        })
    })
}

function quotesAnime() {
    return new Promise((resolve, reject) => {
        const page = Math.floor(Math.random() * 184)
        axios.get('https://otakotaku.com/quote/feed/'+page)
        .then(({ data }) => {
            const $ = cheerio.load(data)
            const hasil = []
            $('div.kotodama-list').each(function(l, h) {
                hasil.push({
                    link: $(h).find('a').attr('href'),
                    gambar: $(h).find('img').attr('data-src'),
                    karakter: $(h).find('div.char-name').text().trim(),
                    anime: $(h).find('div.anime-title').text().trim(),
                    episode: $(h).find('div.meta').text(),
                    up_at: $(h).find('small.meta').text(),
                    quotes: $(h).find('div.quote').text().trim()
                })
            })
            resolve(hasil)
        }).catch(reject)
    })
}

function aiovideodl(link) {
    return new Promise((resolve, reject) => {
        axios({
            url: 'https://aiovideodl.ml/',
            method: 'GET',
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "cookie": "PHPSESSID=69ce1f8034b1567b99297eee2396c308; _ga=GA1.2.1360894709.1632723147; _gid=GA1.2.1782417082.1635161653"
            }
        }).then((src) => {
            let a = cheerio.load(src.data)
            let token = a('#token').attr('value')
            axios({
                url: 'https://aiovideodl.ml/wp-json/aio-dl/video-data/',
                method: 'POST',
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "cookie": "PHPSESSID=69ce1f8034b1567b99297eee2396c308; _ga=GA1.2.1360894709.1632723147; _gid=GA1.2.1782417082.1635161653"   
                },
                data: new URLSearchParams(Object.entries({ 'url': link, 'token': token }))
            }).then(({ data }) => {
                resolve(data)
            })
        })
    })
}

async function tiktokDl(url) {
	return new Promise(async (resolve, reject) => {
		try {
			let data = []
			function formatNumber(integer) {
				let numb = parseInt(integer)
				return Number(numb).toLocaleString().replace(/,/g, '.')
			}
			
			function formatDate(n, locale = 'en') {
				let d = new Date(n)
				return d.toLocaleDateString(locale, {
					weekday: 'long',
					day: 'numeric',
					month: 'long',
					year: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric'
				})
			}
			
			let domain = 'https://www.tikwm.com/api/';
			let res = await (await axios.post(domain, {}, {
				headers: {
					'Accept': 'application/json, text/javascript, /; q=0.01',
					'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Origin': 'https://www.tikwm.com',
					'Referer': 'https://www.tikwm.com/',
					'Sec-Ch-Ua': '"Not)A;Brand" ;v="24" , "Chromium" ;v="116"',
					'Sec-Ch-Ua-Mobile': '?1',
					'Sec-Ch-Ua-Platform': 'Android',
					'Sec-Fetch-Dest': 'empty',
					'Sec-Fetch-Mode': 'cors',
					'Sec-Fetch-Site': 'same-origin',
					'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
					'X-Requested-With': 'XMLHttpRequest'
				},
				params: {
					url: url,
					hd: 1
				}
			})).data.data
			if (res && !res.size && !res.wm_size && !res.hd_size) {
				res.images.map(v => {
					data.push({ type: 'photo', url: v })
				})
			} else {
				if (res && res.wmplay) {
					data.push({ type: 'watermark', url: res.wmplay })
				}
				if (res && res.play) {
					data.push({ type: 'nowatermark', url: res.play })
				}
				if (res && res.hdplay) {
					data.push({ type: 'nowatermark_hd', url: res.hdplay })
				}
			}
			let json = {
				status: true,
				title: res.title,
				taken_at: formatDate(res.create_time).replace('1970', ''),
				region: res.region,
				id: res.id,
				durations: res.duration,
				duration: res.duration + ' Seconds',
				cover: res.cover,
				size_wm: res.wm_size,
				size_nowm: res.size,
				size_nowm_hd: res.hd_size,
				data: data,
				music_info: {
					id: res.music_info.id,
					title: res.music_info.title,
					author: res.music_info.author,
					album: res.music_info.album ? res.music_info.album : null,
					url: res.music || res.music_info.play
				},
				stats: {
					views: formatNumber(res.play_count),
					likes: formatNumber(res.digg_count),
					comment: formatNumber(res.comment_count),
					share: formatNumber(res.share_count),
					download: formatNumber(res.download_count)
				},
				author: {
					id: res.author.id,
					fullname: res.author.unique_id,
					nickname: res.author.nickname,
					avatar: res.author.avatar
				}
			}
			resolve(json)
		} catch (e) {
			reject(e)
		}
	});
}

async function mediafireDl(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);

      // Cari tombol download utama
      let link = $("a#downloadButton").attr("href");

      // fallback kalau selector di atas gagal
      if (!link) {
        link = $("a[href*='download']").attr("href");
      }

      if (!link || !/^https?:\/\//.test(link)) {
        return reject(new Error("Link download tidak ditemukan!"));
      }

      const name = $("div.filename, .dl-btn-label").text().trim() || decodeURIComponent(link.split("/").pop());
      const size = $("#downloadButton").text().replace(/Download|\(|\)/gi, "").trim() || "Unknown";
      const upload_date = $(".dl-info .details li span").last().text().trim() || "Unknown";
      const type = name.includes(".") ? name.split(".").pop() : "";

      resolve({ name, type, upload_date, size, link });
    } catch (e) {
      reject(e);
    }
  });
}


async function pinterest(query) {
    return new Promise(async (resolve, reject) => {
        const baseUrl = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
        const params = {
            source_url: '/search/pins/?q=' + encodeURIComponent(query),
            data: JSON.stringify({
                options: {
                    isPrefetch: false,
                    query,
                    scope: 'pins',
                    no_fetch_context_on_resource: false
                },
                context: {}
            }),
            _: Date.now()
        };
        const headers = {
            'accept': 'application/json, text/javascript, */*, q=0.01',
            'accept-encoding': 'gzip, deflate',
            'accept-language': 'en-US,en;q=0.9',
            'dnt': '1',
            'referer': 'https://www.pinterest.com/',
            'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
            'sec-ch-ua-full-version-list': '"Not(A:Brand";v="99.0.0.0", "Microsoft Edge";v="133.0.3065.92", "Chromium";v="133.0.6943.142"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-model': '""',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua-platform-version': '"10.0.0"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
            'x-app-version': 'c056fb7',
            'x-pinterest-appstate': 'active',
            'x-pinterest-pws-handler': 'www/[username]/[slug].js',
            'x-pinterest-source-url': '/hargr003/cat-pictures/',
            'x-requested-with': 'XMLHttpRequest'
        };
        try {
            const { data } = await axios.get(baseUrl, { httpsAgent: agent, headers, params });
            const results = data.resource_response?.data?.results?? [];
            const result = results.map(item => ({
                pin: 'https://www.pinterest.com/pin/' + item.id?? '',
                link: item.link?? '',
                created_at: (new Date(item.created_at)).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }) ?? '',
                id: item.id?? '',
                images_url: item.images?.['736x']?.url?? '',
                grid_title: item.grid_title?? ''
            }));
            resolve(result);
        } catch (e) {
            reject([])
        }
    });
}

async function remini(buffer, method = "recolor") {
  return new Promise(async (resolve, reject) => {
    try {
      const form = new FormData();
      form.append("model_version", "1");
      form.append("image", buffer, {
        filename: "enhance_image_body.jpg",
        contentType: "image/jpeg",
      });

      const agent = new https.Agent({
        rejectUnauthorized: false,
        servername: "inferenceengine.vyro.ai",
        insecureHTTPParser: true,
      });

      const { data } = await axios.post(
        "https://inferenceengine.vyro.ai/" + method,
        form,
        {
          httpsAgent: agent,
          headers: {
            ...form.getHeaders(),
            "accept-encoding": "gzip, deflate",
            "user-agent": "okhttp/4.9.3",
          },
          responseType: "arraybuffer",
        }
      );

      resolve(data);
    } catch (e) {
      reject(e);
    }
  });
}

async function styletext(teks) {
    return new Promise(async (resolve, reject) => {
        axios.get('http://qaz.wtf/u/convert.cgi?text=' + teks).then(({ data }) => {
            let $ = cheerio.load(data)
            let hasil = []
            $('table > tbody > tr').each(function (a, b) {
                hasil.push({ name: $(b).find('td:nth-child(1) > span').text(), result: $(b).find('td:nth-child(2)').text().trim() })
            });
            resolve(hasil)
        });
    });
}

async function hitamkan(buffer, filter = 'coklat') {
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await axios.post('https://negro.consulting/api/process-image', JSON.stringify({
                imageData: Buffer.from(buffer).toString('base64'),
                filter
            }), {
                headers: {
                    'content-type': 'application/json'
                }
            });
            if(data && data.status === 'success') {
                resolve(Buffer.from(data.processedImageUrl.split(',')[1], 'base64'))
            }
        } catch (e) {
            reject(e)
        }
    });
}

async function ringtone(title) {
    return new Promise(async (resolve, reject) => {
        axios.get('https://meloboom.com/en/search/' + title).then(({ data }) => {
            let $ = cheerio.load(data)
            let hasil = []
            $('#__next > main > section > div.jsx-2244708474.container > div > div > div > div:nth-child(4) > div > div > div > ul > li').each(function (a, b) {
                hasil.push({ title: $(b).find('h4').text(), source: 'https://meloboom.com/'+$(b).find('a').attr('href'), audio: $(b).find('audio').attr('src') })
            });
            resolve(hasil)
        });
    });
}

async function wallpaper(title, page = '1') {
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await axios.get(`https://www.besthdwallpaper.com/search?CurrentPage=${page}&q=${title}`);
            const $ = cheerio.load(data);
            const hasil = [];
            $('div.grid-item').each(function (a, b) {
                hasil.push({
                    title: $(b).find('div.info > p').attr('title'),
                    type: $(b).find('div.info > a:nth-child(2)').text(),
                    source: 'https://www.besthdwallpaper.com' + $(b).find('a').attr('href'),
                    image: [
                        $(b).find('picture > img').attr('data-src') || $(b).find('picture > img').attr('src'), 
                        $(b).find('picture > source:nth-child(1)').attr('srcset'), 
                        $(b).find('picture > source:nth-child(2)').attr('srcset')
                    ]
                });
            });
            resolve(hasil)
        } catch (e) {
            reject(e)
        }
    });
}

async function wikimedia(title) {
    return new Promise(async (resolve, reject) => {
        axios.get(`https://commons.wikimedia.org/w/index.php?search=${title}&title=Special:MediaSearch&go=Go&type=image`).then(({ data }) => {
            let $ = cheerio.load(data)
            let hasil = []
            $('.sdms-search-results__list-wrapper > div > a').each(function (a, b) {
                hasil.push({ title: $(b).find('img').attr('alt'), source: $(b).attr('href'), image: $(b).find('img').attr('data-src') || $(b).find('img').attr('src') })
            });
            resolve(hasil)
        });
    });
}

async function instagramDl(url) {
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await axios.post('https://yt1s.io/api/ajaxSearch', new URLSearchParams({ q: url, w: '', p: 'home', lang: 'en' }), {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Origin': 'https://yt1s.io',
                    'Referer': 'https://yt1s.io/',
                    'User-Agent': 'Postify/1.0.0',
                }
            });
            const $ = cheerio.load(data.data);
            let anu = $('a.abutton.is-success.is-fullwidth.btn-premium').map((_, b) => ({
                title: $(b).attr('title'),
                url: $(b).attr('href')
            })).get()
            resolve(anu)
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = { pinterest, wallpaper, wikimedia, quotesAnime, aiovideodl, tiktokDl, instagramDl, wikimedia, wallpaper, ringtone, styletext, hitamkan, remini, mediafireDl}