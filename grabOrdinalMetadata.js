const axios = require('axios')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

module.exports = async (sat) => {
    const { data } = await axios.get(`https://ordinals.com/sat/${sat}`)

    const { document } = (new JSDOM(data)).window;

    const dl = document.querySelector('dl');

    const obj = {}
    let key = null;
    for (let i = 0; i < dl.children.length; i++) {
        const element = dl.children[i];


        if (key === null) {
            key = element.textContent
        } else {
            obj[key] = element.textContent
            key = null;
        }
    }


    Object.keys(obj).forEach(key => {
        if (isNumeric(obj[key])) {
            obj[key] = parseFloat(obj[key]);
        }

        if (obj[key] === '' || typeof obj[key] === 'undefined') {
            delete obj[key]
        }
    })

    obj.dateMined = new Date(obj.timestamp).toISOString()
    delete obj.timestamp
    
    return obj
}