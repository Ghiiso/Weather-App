const settimana = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']
const cities_api = `https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json`;
const ita_cities_api = 'https://raw.githubusercontent.com/MatteoHenryChinaski/Comuni-Italiani-2018-Sql-Json-excel/master/italy_geo.json'
var coord = [];
var ora = new Date().getHours();

window.addEventListener('load',()=>{

    document.getElementById("defaultbutt").click(); // clicca il bottone con scheda default

    if(ora >18 || ora<7){ // se ora è dopo le 18 o prima delle 7, mette il tema notturno
        let body = document.getElementsByTagName('body')[0];
        body.className = 'notte';
    }

    fetch('settings.json') // FETCH settings
            .then(response => response.json())
            .then(settings => {
            initTab(settings); // inizializza la tabella
            });

    if(navigator.geolocation){ // inizializzazione con coordinate della posizione attuale
        navigator.geolocation.getCurrentPosition(position => {
            coord[0]= position.coords.latitude;
            coord[1]= position.coords.longitude;

            callWeatherApi(coord);
            callCityApi(coord,'');
        });

        document.getElementById('citybar').addEventListener("keypress", function(event){ // chiama la funzione cerca se viene premuto invio
            if (event.key == 'Enter'){
                cerca()
            }
        });
    }
    else{
        console.log('¯\_(ツ)_/¯');
    }
    
});

function callWeatherApi(coord){
    // aggiorna la tabella con i dati relativi alle coordinate passate
    fetch('settings.json') // FETCH json
    .then(response => response.json())
    .then(settings => {
        const proxy = settings.proxy;
        var weather_api = getWeatherApi(proxy,coord); // api per il meteo
        
        fetch(weather_api) // FETCH meteo
            .then(api_response => {
                return api_response.json();
            })
            .then(api_data => {
                aggiornaTab(api_data,settings);
            });
    });
}

function callCityApi(coord,city_bak){
    // aggiorna il nome in base alle coordinate passate
    fetch('settings.json') // FETCH json
    .then(response => response.json())
    .then(settings => {
        const proxy = settings.proxy;
        var city_api = getCityApi(proxy,coord,settings); // api per reverse geocoding

        fetch(city_api) // FETCH reverse geocoding
            .then(api_response => {
                return api_response.json();
            })
            .then(api_data => {
                if(api_data.ok){
                cambiaIntestazione(api_data.city,api_data.principalSubdivision);
                }
                else{
                    cambiaIntestazione(city_bak,'')
                }
            })
    });
}

function callAllCitiesApi(city,ita_url,world_url){ // ew
    // ottiene le coordinate di city e aggiorna il meteo e il nome
    var coord = []
    var name;
    fetch(ita_url)
        .then(api_response => {
            return api_response.json();
        })
        .then(api_data => {
            try{ // se la città è italiana
                var newcity = api_data.find(el => el.comune.toLowerCase()==city.toLowerCase()) // restituisce l'oggetto nella lista delle città italiane con il nome uguale a quello passato
                coord[0] = newcity.lat;
                coord[1] = newcity.lng;
                name = newcity.comune
            }
            catch{ // se la città non è italiana
                fetch(world_url)
                .then(api_response => {
                    return api_response.json()
                })
                .then(api_data => {
                    var newcity = api_data.find(el => el.name.toLowerCase()==city.toLowerCase())
                    name = newcity.name
                    coord[0] = newcity.lat;
                    coord[1] = newcity.lng;
                })
            }

            callWeatherApi(coord); // aggiorna il meteo
            callCityApi(coord,name); // aggiorna il nome della città
        });
}

function cerca(){
    // chiamata quando viene premuto il bottone di searchbar o quando viene premuto invio
    let input = document.getElementById('citybar');
    
    if(input.value.length>0){
        callAllCitiesApi(input.value,ita_cities_api,cities_api);
        input.value=''; // svuota la barra di ricerca
    }

}

function cambiaIntestazione(luogo,regione){
    var posizione_luogo = document.querySelector('.posizione-luogo');
    var posizione_regione = document.querySelector('.posizione-regione');
    posizione_luogo.textContent = luogo; // imposta il nome della città
    posizione_regione.textContent = regione; // imposta il nome della regione
}

function initTab(settings){
    // inizializza le tabelle del menu
    var tabella_meteo = document.getElementsByClassName('previsioni-table');
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < settings.n_ore_previsioni; j++) {
            temp = tabella_meteo[0].rows[i].insertCell();
            if(i==2){
                temp.append(document.createElement("i"));
            }
        }
        for (let j = 0; j < settings.n_giorni_previsioni; j++) {
            if(i<3) temp = tabella_meteo[1].rows[i].insertCell();
            if(i==1) temp.append(document.createElement("i"));
            if(i==2){
                span = document.createElement('span') // riga temperature
                temp.append(span)
                span = document.createElement('span')
                temp.append(span)
            }
        }
    }
}

function aggiornaTab(api_data,settings){
    // aggiorna le tabelle con i dati passati
    var gradi = document.querySelector('.gradi-numero');
    var descrizione = document.querySelector('.descrizione-meteo');
    var icona = document.getElementById('icona');
    var tabella_meteo = document.getElementsByClassName('previsioni-table');

    timeIndex = api_data.hourly.time.indexOf(getDate()); // indice degli array corrispondente all'ora corrente
    weathercode = api_data.hourly.weathercode[timeIndex]; // codice per definire il tempo 
    gradi.textContent = api_data.hourly.temperature_2m[timeIndex]; // imposta i gradi
    descrizione.textContent = getWeatherDescr(weathercode); // imposta la descrizione
    icona.className = 'fas fa-'+getIcon(weathercode)+' fa-5x fa-fw'; // imposta l'icona
    console.log('Coordinate:'+coord+'\nCodice meteo: '+weathercode);

    let oggi = new Date().getDay()
    for(let i=1;i<=settings.n_ore_previsioni;i++){ // imposta i campi della tabella delle previsioni
        let cella_ora = tabella_meteo[0].rows[0].cells[i-1]; // riga delle ore
        cella_ora.innerHTML = api_data.hourly.time[timeIndex+i].slice(-5);

        let cella_temp = tabella_meteo[0].rows[1].cells[i-1]; // riga temperature
        cella_temp.innerHTML = api_data.hourly.temperature_2m[timeIndex+i]+'°C';

        let cella_descr = tabella_meteo[0].rows[3].cells[i-1]; // riga descrizioni
        cella_descr.innerHTML = getWeatherDescr(api_data.hourly.weathercode[timeIndex+i]);

        tabella_meteo[0].rows[2].cells[i-1].firstChild.className = 'fas fa-'+getIcon(api_data.hourly.weathercode[timeIndex+i])+' fa-2x'; // riga icone
    }

    for(let i=1;i<=settings.n_giorni_previsioni;i++){ // imposta i campi della tabella delle previsioni dei giorni successivi
        cella_giorno = tabella_meteo[1].rows[0].cells[i-1]; // riga giorni della settimana
        if(i==1) cella_giorno.innerHTML = 'Domani'
        else if(i==2) cella_giorno.innerHTML = 'Dopodomani'
        else cella_giorno.innerHTML = settimana[index(oggi+i-1)];

        tabella_meteo[1].rows[1].cells[i-1].firstChild.className = 'fas fa-'+getIcon(api_data.daily.weathercode[i])+' fa-2x';
        
        temp = tabella_meteo[1].rows[2].cells[i-1].children;
        span = temp[0] // riga temperature
        span.innerHTML = api_data.daily.temperature_2m_max[i]+'°C';
        span = temp[1];
        span.innerHTML = api_data.daily.temperature_2m_min[i]+'°C';
    }
}


function getDate(){
    // ritorna la data attuale in formato ISO 8601
    let d = new Date();
    function z(n){return (n<10?'0':'') + n}
    return d.getFullYear() + '-' + z(d.getMonth()+1) + '-' +
        z(d.getDate()) + 'T' + z(d.getHours()) + ':00'
}

function cambiaScheda(evt,nomeTab) {
    // nasconde tutti i tab e mostra solo nomeTab
    let tabprevisioni = document.getElementsByClassName("previsioni"); // nasconde tutti i tab
    Array.from(tabprevisioni).forEach((tab) => {
        tab.style.display = "none";
    });
  
    let tabbutt = document.getElementsByClassName("tabbutt"); // toglie la classe active a tutti i bottoni
    Array.from(tabbutt).forEach(tab => {
        tab.className = tab.className.replace(" active", "");
    });

    document.getElementById(nomeTab).style.display = "flex"; // mostra il tab passato
    evt.currentTarget.className += " active"; // aggiunge la classe active al bottone premuto
}

function getWeatherDescr(codice){
    // ritorna la descrizione in base all'indice passato
    const descrizioni = {
        0:'Soleggiato',
        1:'Perlopiù soleggiato',
        2:'Parzialmente nuvoloso',
        3:'Nuvoloso',
        45:'Nebbia',
        48:'Nebbia e brina',
        51:'Piovoso',
        53:'Piovoso a tratti',
        55:'Perlopiù piovoso',
        56:'Pioggia ghiacciata leggera',
        57:'Pioggia ghiacciata',
        61:'Pioggia leggera',
        63:'Pioggia',
        65:'Pioggia forte',
        66:'Grandine leggera',
        67:'Grandine',
        71:'Neve leggera',
        73:'Neve',
        75:'Neve forte',
        77:'Nevischio',
        80:'Temporali',
        81:'Temporali',
        82:'Temporali',
        85:'Temporali',
        86:'Temporali',
        95:'Temporali',
        96:'Temporali con neve a tratti',
        99:'Temporali con neve'
    }
    return descrizioni[codice];
}

function getIcon(codice){
    // ritorna l'icona in base all'indice passato
    const icone = {
        0:'sun',
        1:'sun',
        2:'cloud-sun',
        3:'cloud',
        45:'smog',
        48:'smog',
        51:'raindrops',
        53:'raindrops',
        55:'raindrops',
        56:'cloud-sleet',
        57:'cloud-sleet',
        61:'cloud-rain',
        63:'cloud-rain',
        65:'cloud-showers-heavy',
        66:'cloud-hail',
        67:'cloud-hail',
        71:'cloud-snow',
        73:'cloud-snow',
        75:'cloud-snowflake',
        77:'cloud-snow',
        80:'cloud-showers-heavy',
        81:'cloud-showers-heavy',
        82:'cloud-showers-heavy',
        85:'cloud-sleet',
        86:'cloud-bolt',
        95:'cloud-bolt',
        96:'cloud-bolt',
        99:'cloud-bolt'
    }
    return icone[codice];
}

function getWeatherApi(proxy,coord){
    // ritorna la stringa dell'indirizzo web formattata
    return `${proxy}https://api.open-meteo.com/v1/forecast?latitude=${coord[0]}&longitude=${coord[1]}&hourly=temperature_2m,apparent_temperature,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
}
function getCityApi(proxy,coord,settings){
    // ritorna la stringa dell'indirizzo web formattata
    return `${proxy}https://api.bigdatacloud.net/data/reverse-geocode?latitude=${coord[0]}&longitude=${coord[1]}&localityLanguage=it&key=${settings.Oauth}`;
}

function index(i){
    if(i<7) return i;
    else return i-7;
}
