window.addEventListener('load',()=>{
    const settimana = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']
    let coord = [];
    let gradi = document.querySelector('.gradi-numero');
    let descrizione = document.querySelector('.descrizione-meteo');
    let posizione_luogo = document.querySelector('.posizione-luogo');
    let posizione_regione = document.querySelector('.posizione-regione');
    let icona = document.querySelector('.icona');
    let ora = new Date().getHours();
    let tabella_meteo = document.getElementsByClassName('previsioni-table');
    document.getElementById("defaultbutt").click(); // clicca il bottone con scheda default

    if(ora >18 || ora<7){ // se ora è dopo le 18 o prima delle 7, mette il tema notturno
        let body = document.getElementsByTagName('body')[0];
        body.className = 'notte';
    }
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(position => {
            coord[0]= position.coords.latitude;
            coord[1]= position.coords.longitude;
            const proxy = 'https://cors-anywhere.herokuapp.com/';
            const weather_api = `${proxy}https://api.open-meteo.com/v1/forecast?latitude=${coord[0]}&longitude=${coord[1]}&hourly=temperature_2m,apparent_temperature,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`; // api per il meteo
            fetch('settings.json')
            .then(response => response.json())
            .then(settings => {
                const city_api = `${proxy}https://api.bigdatacloud.net/data/reverse-geocode?latitude=${coord[0]}&longitude=${coord[1]}&localityLanguage=it&key=${settings.Oauth}`; // api per reverse geocoding
                let n_ore_previsioni = settings.n_ore_previsioni;
                let n_giorni_previsioni = settings.n_giorni_previsioni;
                fetch(weather_api)
                    .then(api_response => {
                        return api_response.json();
                    })
                    .then(api_data => {
                        timeIndex = api_data.hourly.time.indexOf(getDate()); // indice degli array corrispondente all'ora corrente
                        weathercode = api_data.hourly.weathercode[timeIndex]; // codice per definire il tempo 
                        gradi.textContent = api_data.hourly.temperature_2m[timeIndex]; // imposta i gradi
                        descrizione.textContent = getWeatherDescr(weathercode); // imposta la descrizione
                        icona.className = 'fas fa-'+getIcon(weathercode)+' fa-5x fa-fw'; // imposta l'icona
                        console.log('Coordinate:'+coord+'\nCodice meteo: '+weathercode);
                        console.log(api_data)
                        let oggi = new Date().getDay()
                        for(let i=1;i<=n_ore_previsioni;i++){ // imposta i campi della tabella delle previsioni
                            let cella_ora = tabella_meteo[0].rows[0].insertCell(-1); // riga delle ore
                            cella_ora.innerHTML = api_data.hourly.time[timeIndex+i].slice(-5);

                            let cella_temp = tabella_meteo[0].rows[1].insertCell(-1); // riga temperature
                            cella_temp.innerHTML = api_data.hourly.temperature_2m[timeIndex+i]+'°C';

                            let cella_descr = tabella_meteo[0].rows[3].insertCell(-1); // riga descrizioni
                            cella_descr.innerHTML = getWeatherDescr(api_data.hourly.weathercode[timeIndex+i]);

                            let img = document.createElement("i");
                            img.className = 'fas fa-'+getIcon(api_data.hourly.weathercode[timeIndex+i])+' fa-2x';
                            tabella_meteo[0].rows[2].insertCell(-1).append(img); // riga icone
                        }

                        for(let i=1;i<=n_giorni_previsioni;i++){ // imposta i campi della tabella delle previsioni dei giorni successivi
                            cella_giorno = tabella_meteo[1].rows[0].insertCell(-1); // riga giorni della settimana
                            if(i==1) cella_giorno.innerHTML = 'Domani'
                            else if(i==2) cella_giorno.innerHTML = 'Dopodomani'
                            else cella_giorno.innerHTML = settimana[index(oggi+i-1)];

                            img = document.createElement("i"); // riga icone
                            img.className = 'fas fa-'+getIcon(api_data.daily.weathercode[i])+' fa-2x';
                            tabella_meteo[1].rows[1].insertCell(-1).append(img);
                            
                            temp = tabella_meteo[1].rows[2].insertCell(-1);
                            span = document.createElement('span') // riga temperature
                            span.innerHTML = api_data.daily.temperature_2m_max[i]+'°C';
                            temp.append(span)
                            span = document.createElement('span')
                            span.innerHTML = api_data.daily.temperature_2m_min[i]+'°C';
                            temp.append(span)
                        }
                    });
                fetch(city_api)
                    .then(api_response => {
                        return api_response.json();
                    })
                    .then(api_data => {
                        posizione_luogo.textContent = api_data.city; // imposta il nome della città
                        posizione_regione.textContent = api_data.principalSubdivision; // imposta il nome della regione
                    });
            });
        });
    }
    else{
        console.log('¯\_(ツ)_/¯');
    }
    
});

function getDate(){ // ritorna la data attuale in formato ISO 8601
    let d = new Date();
    function z(n){return (n<10?'0':'') + n}
    return d.getFullYear() + '-' + z(d.getMonth()+1) + '-' +
        z(d.getDate()) + 'T' + z(d.getHours()) + ':00'
}

function cambiaScheda(evt,nomeTab) {
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

function getWeatherDescr(codice){ // ritorna la descrizione in base all'indice passato
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

function getIcon(codice){ // ritorna l'icona in base all'indice passato
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

function index(i){
    if(i<7) return i;
    else return i-7;
}
