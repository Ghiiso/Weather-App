window.addEventListener('load',()=>{
    let coord = [];
    let gradi = document.querySelector('.gradi-numero');
    let descrizione = document.querySelector('.descrizione-meteo');
    let posizione_luogo = document.querySelector('.posizione-luogo');
    let posizione_regione = document.querySelector('.posizione-regione');
    let icona = document.querySelector('.descrizione-icona');
    let ora = new Date().getHours();

    if(ora >18 || ora<7){ // se ora è dopo le 18 o prima delle 7, mette il tema notturno
        let body = document.getElementsByTagName('body')[0];
        body.className = 'notte';
    }
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(position => {
            coord[0]= position.coords.latitude;
            coord[1]= position.coords.longitude;
            const city_authkey = '[AUTHKEY]'
            const proxy = 'https://cors-anywhere.herokuapp.com/';
            const weather_api = `${proxy}https://api.open-meteo.com/v1/forecast?latitude=${coord[0]}&longitude=${coord[1]}&hourly=temperature_2m,apparent_temperature,weathercode&timezone=auto`;
            const city_api = `${proxy}https://api.bigdatacloud.net/data/reverse-geocode?latitude=${coord[0]}&longitude=${coord[1]}&localityLanguage=it&key=${city_authkey}`;

            fetch(weather_api)
                .then(api_response => {
                    return api_response.json();
                })
                .then(api_data => {
                    timeIndex = api_data.hourly.time.indexOf(getDate()); // indice degli array corrispondente all'ora corrente
                    weathercode = api_data.hourly.weathercode[timeIndex]; // codice per definire il tempo 
                    gradi.textContent = api_data.hourly.temperature_2m[timeIndex]; // imposta i gradi
                    descrizione.textContent = getWeatherDescr(weathercode); // imposta la descrizione
                    icona.setAttribute("src",`icone/${getIcon(weathercode)}.png`); // imposta l'icona
                    console.log('Codice meteo: '+weathercode);
                });
            fetch(city_api)
                .then(api_response => {
                    return api_response.json();
                })
                .then(api_data => {
                    posizione_luogo.textContent = api_data.city; // imposta il nome della città
                    posizione_regione.textContent = api_data.principalSubdivision; // imposta il nome della regione
                })
        })
    }
    else{
        console.log('¯\_(ツ)_/¯');
    }
    
});

function getDate(){
    let d = new Date();
    function z(n){return (n<10?'0':'') + n}
    return d.getFullYear() + '-' + z(d.getMonth()+1) + '-' +
        z(d.getDate()) + 'T' + z(d.getHours()) + ':00'
}

function getWeatherDescr(codice){
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
        80:'',
        81:'',
        82:'',
        85:'',
        86:'Temporali',
        95:'Temporali',
        96:'Temporali con neve a tratti',
        99:'Temporali con neve'
    }
    return descrizioni[codice];
}

function getIcon(codice){
    const icone = {
        0:'soleggiato',
        1:'soleggiato',
        2:'parsoleggiato',
        3:'nuvoloso',
        45:'nebbia',
        48:'nebbia',
        51:'pioggia1',
        53:'pioggia1',
        55:'pioggia1',
        56:'pioggianeve',
        57:'pioggianeve',
        61:'pioggia1',
        63:'pioggia2',
        65:'pioggia3',
        66:'grandine',
        67:'grandine',
        71:'neve1',
        73:'neve1',
        75:'neve2',
        77:'neve1',
        80:'temporale',
        81:'temporale',
        82:'temporale',
        85:'temporale',
        86:'temporale',
        95:'temporale',
        96:'temporale',
        99:'temporale'
    }
    return icone[codice];
}


