const fetch = require('node-fetch');
const { Select, Input, Toggle, Invisible, Form } = require('enquirer');
const jimp = require('jimp');
const fs = require('fs');
const cheerio = require('cheerio');

function titleCase(str) {
    str = str.toString() //this is so cursed but it sometimes breaks otherwise
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
    }
    return str.join(' ');
}

function resizeIcons() {
    console.log("Collio, just a little resizing and we'll be good to go...")
    jimp.read(`/home/runner/${process.env['REPL_SLUG']}/images/icon.png`)
    .then(image => {
        image
            .resize(192, 192)
            .write(`/home/runner/${process.env['REPL_SLUG']}/images/icon-192.png`)
            .resize(512, 512)
            .write(`/home/runner/${process.env['REPL_SLUG']}/images/icon-512.png`);
    })
    .catch(err => {
        console.log("oopsie poopsie! i went bleh!")
        console.log(err)
    });
}

function getAndResizeIcons(url) {
    console.log("Noice noice. Lemme download and resize that real quick... (this might take a few seconds)")
    jimp.read({
        url: url,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0' }
    })
    .then(image => {
        //console.log("Collio, just a little resizing and we'll be good to go...")
        image
            .write(`/home/runner/${process.env['REPL_SLUG']}/images/icon.png`)
            .resize(192, 192)
            .write(`/home/runner/${process.env['REPL_SLUG']}/images/icon-192.png`)
            .resize(512, 512)
            .write(`/home/runner/${process.env['REPL_SLUG']}/images/icon-512.png`);
    })
    .catch(err => {
        console.log("oopsie poopsie! i went bleh!")
        console.log(err)
    });
}

(async() => {

    //let meta = await fetch().json()
    let resRepl = await fetch(`https://replit.com/data/repls/@${process.env['REPL_OWNER']}/${process.env['REPL_SLUG']}`, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0' }})
    let metadata = await resRepl.json()
    //console.log(metadata)

    let resUser = await fetch(`https://replit.com/data/profiles/${process.env['REPL_OWNER']}`, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0' }});
    let userMetadata = await resUser.json()
    //console.log(userMetadata)
    
    let webManifest = {
        "short_name": metadata.title,
        "name": `${metadata.title} - A ${titleCase(process.env['REPL_LANGUAGE'])} Repl by ${titleCase(process.env['REPL_OWNER'])}`,
        "description": `A ${titleCase(process.env['REPL_LANGUAGE'])} Repl by ${titleCase(process.env['REPL_OWNER'])}`,
        "icons": [
            {
                "src": "/images/icon-192.png",
                "type": "image/png",
                "sizes": "192x192"
            },
            {
                "src": "/images/icon-512.png",
                "type": "image/png",
                "sizes": "512x512"
            }
        ],
        "start_url": "/",
        "background_color": "#080b12",
        "theme_color": "#080b12",
        "display": "standalone",
        "scope": "/",
        "shortcuts": [],
        "screenshots": []
    }

    console.log(`Welcome ${titleCase(process.env['REPL_OWNER'])} to the Repl to PWA generator! I'll be guiding you through how to turn this regular old website into a fully installable PWA.\n`)

    console.log('Please note this currently only works in root directory of a repl, though support for other directories could come later.\n')

    new Toggle({
        message: 'Would you like to get started?',
        initial: 'Yep',
        enabled: 'Yep',
        disabled: 'Nah'
    }).run().then((response) => {
        console.log(response)

        new Form({
            name: '',
            message: 'Go ahead and put in the following information about your site using the arrow keys to navigate! Remember, anything you think looks good you can leave as it is, plus you can always change these later, so don\'t sweat it. :)  ',
            choices: [
                { name: 'name', message: 'PWA Name: ', initial: webManifest['name'] },
                { name: 'short_name', message: 'Shortened PWA Name: ', initial: webManifest['short_name'] },
                { name: 'description', message: 'Description of your PWA: ', initial: webManifest['description'] },
                { name: 'background_color', message: 'Background Color: ', initial: webManifest['background_color'] },
                { name: 'theme_color', message: 'Theme: ', initial: webManifest['theme_color'] },
            ]
        }).run().then((promptedMeta) => {

            let promptedMetaKeys = Object.keys(promptedMeta);

            promptedMetaKeys.forEach((key) => {
                webManifest[key] = promptedMeta[key]
            })
    
            new Select({
                name: '',
                message: 'Where would you like your icon to come from?',
                choices: ['My Profile Picture', 'A Picture from a URL', 'A Picture in this Repository', 'Skip this...']
            }).run().then((output) => {
        
                if (!fs.existsSync(`/home/runner/${process.env['REPL_SLUG']}/images`)) {
                    fs.mkdirSync(`/home/runner/${process.env['REPL_SLUG']}/images`, { recursive: true })
                }
        
                switch(output) {
                        
                    case 'My Profile Picture':
                        getAndResizeIcons(userMetadata.icon.url)
                        break;
                    case 'A Picture from a URL':
                        new Input({
                            message: 'What is the URL to your image?',
                            initial: ''
                        }).run().then((imageURL) => {
                            getAndResizeIcons(imageURL)
                        });
                        break;
                    case 'A Picture in this Repository':
                        console.log('Very cool indeed! I\'ve made a folder called "images" (or it already exists) which you can put your icon in. Make sure to name it "icon.png" and i\'ll do the rest!')
                         new Invisible({
                            message: 'Press enter when you\'re done doing that',
                            initial: ''
                        }).run().then(() => {
                            resizeIcons()
                        })
                        break;
                    default:
                        console.log('Alrighty, moving on!')
                }

                new Input({
                    message: 'Cool we\'re all done with that! Where do you you wanna save your web manifest?',
                    initial: 'webmanifest.json'
                }).run().then((location) => {
                    let data = JSON.stringify(webManifest, null, 2);
                    fs.writeFileSync(`/home/runner/${process.env['REPL_SLUG']}/${location}`, data);

                    console.log("Generating your service worker...")

                    let filesToCache = fs.readdirSync(`/home/runner/${process.env['REPL_SLUG']}/`);                   

                    const swRegistrarTemplate = `if ("serviceWorker" in navigator) {
	window.addEventListener("load", function() {
		navigator.serviceWorker
			.register("./serviceWorker.js")
			.then(res => console.log("service worker registered"))
			.catch(err => console.log("service worker not registered", err))
	})
}`
                    
                    // you didn't see this code
                    const safeReplSlug = process.env['REPL_SLUG'].replace('-', '_');
                    const swTemplate = `const ${safeReplSlug} = '${safeReplSlug}'
const assets = ${JSON.stringify(filesToCache)}

self.addEventListener("install", installEvent => {
	installEvent.waitUntil(
		caches.open(${safeReplSlug}).then(cache => {
			cache.addAll(assets)
		})
	)
})

self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(res => {
            return res || fetch(fetchEvent.request)
        })
    )
})
`
                    let htmlText = fs.readFileSync(`/home/runner/${process.env['REPL_SLUG']}/index.html`)

                    $ = cheerio.load(htmlText)

                    $('head').append(`<link rel="manifest" href="./${location}" />`);
                    $('body').append(`<script>${swRegistrarTemplate}</script>`)

                    fs.writeFileSync(`/home/runner/${process.env['REPL_SLUG']}/serviceWorker.js`, swTemplate)
                    fs.writeFileSync(`/home/runner/${process.env['REPL_SLUG']}/index.html`, $.html())
                    
                    
                    console.log("Alrighty, you're almost all set and ready to go. You'll notice i've edited your index.html to include a new <script> and <meta> element. These are just there to ensure browsers know how to get the information for your PWA.\n")
                    console.log("If you want some more in depth information about how PWAs work and how to customize your's even more, I highly recommend the MDN docs here: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps. Anyways, happy hacking and have a nice day!")
                })
            })
        })
    });

})();