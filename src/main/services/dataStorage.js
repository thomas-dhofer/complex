function saveName(){
    const name = document.getElementById('inputName').value
    localStorage.setItem('name', name);
    start();
}

function saveLanguage(){
    const language = document.getElementById('inputLanguage').value
    localStorage.setItem('language', language);
    start();
}

function saveKey(){
    window.electronAPI.saveKey(document.getElementById('inputAPI').value);
}

function updateGradient() {
    const c1 = document.getElementById('color1').value;
    const c2 = document.getElementById('color2').value;
    const c3 = document.getElementById('color3').value;
    const cbg = document.getElementById('colorBackground').value;

    const root = document.documentElement;
    root.style.setProperty('--gradient-start', c1 + '99');
    root.style.setProperty('--gradient-middle', c2 + '8c');
    root.style.setProperty('--gradient-end', c3 + '73');
    root.style.setProperty('--gradient-bg', cbg);

    localStorage.setItem('g-color1', c1);
    localStorage.setItem('g-color2', c2);
    localStorage.setItem('g-color3', c3);
    localStorage.setItem('g-colorBackground', cbg);
}

function setModel(){
    const m1 = document.getElementById('modellOne').value.trim();
    const m2 = document.getElementById('modellTwo').value.trim();
    const m3 = document.getElementById('modellThree').value.trim();

    if (m1) localStorage.setItem('modellOne', m1);
    if (m2) localStorage.setItem('modellTwo', m2);
    if (m3) localStorage.setItem('modellThree', m3);
}

function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
}

