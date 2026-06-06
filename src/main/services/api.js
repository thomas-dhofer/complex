window.addEventListener('resize', handleResize);

let chatMode = false;
let conversationHistory = [];
let key;
let userInput;
let fileContents;

let responseOne;
let responseTwo;

let uiHistory = [];
let currentChatId = 'chat_' + Date.now();

const svg = `
<svg id="Arrow - Down 2" width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="Iconly/Light/Arrow---Down-2" stroke="none" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">
        <g id="Arrow---Down-2" transform="translate(5.000000, 8.500000)" stroke="currentColor" stroke-width="1.5">
            <polyline id="Stroke-1" points="14 0 7 7 0 0"></polyline>
        </g>
    </g>
</svg>`;

async function apiCall() {

    userInput = document.getElementById('text').value.trim();
    const outBox = document.getElementById('out');

    if (userInput === '') {
        return;
    }

    chatMode = true;

    handleResize();

    document.getElementById('animation').style.display = 'block';

    document.getElementById('center').style.display = "none";
    document.getElementById('out').style.visibility = "visible";

    const element = document.createElement('question');
    element.textContent = userInput;
    outBox.appendChild(element);

    document.getElementById('text').value = '';

    element.scrollIntoView({ behavior: 'smooth', block: 'end' });

    key = await window.electronAPI.loadKey();

    if (!key) {
        alert('Please enter a key');
        return;
    }

    uiHistory.push({ type: 'question', content: userInput });

    conversationHistory.push({ role: "user", content: userInput });

    fileContents = await filesToMessages(allFiles);

    conversationHistory = conversationHistory.slice(-10);

    responseOne = await singeAPICall(localStorage.getItem('modellOne'), false, "Du bekommst folgende Aufgabe: "+userInput+"\n" +
        "\n" +
        "GIb alles nur in: "+localStorage.getItem('language')+" aus.\n" +
        "\n" +
        "Geh systematisch vor:\n" +
        "1. Identifiziere zuerst die Kernfragen\n" +
        "2. Löse schrittweise\n" +
        "3. Markiere explizit wo du unsicher bist\n" +
        "\n" +
        "Keine Absicherungen, keine Relativierungen —\n" +
        "klare Antworten.");

    if (responseOne && responseOne.includes("Error:")){
        uiHistory.push({ type: 'error', content: responseOne });
    }
    else {
        uiHistory.push({ type: 'one', content: responseOne });
    }

    responseTwo = await singeAPICall(localStorage.getItem('modellTwo'), false, "Hier ist eine Antwort auf "+userInput+": "+responseOne+"\n" +
        "\n" +
        "GIb alles nur in: "+localStorage.getItem('language')+" aus.\n" +
        "\n" +
        "Deine Aufgabe ist NICHT zu verbessern sondern zu zerstören.\n" +
        "Finde:\n" +
        "- Logikfehler\n" +
        "- Falsche Annahmen\n" +
        "- Was fehlt\n" +
        "- Was falsch ist\n" +
        "\n" +
        "Stimme nichts zu nur weil es plausibel klingt.\n" +
        "Wenn du keinen Fehler findest, sag es explizit —\n" +
        "aber such gründlich.");

    if (responseTwo && responseTwo.includes("Error:")){
        uiHistory.push({ type: 'error', content: responseTwo });
    }
    else {
        uiHistory.push({ type: 'one', content: responseTwo });
    }

    let response = await singeAPICall(localStorage.getItem('modellThree'), true, "Original-Aufgabe: "+userInput+"\n" +
        "\n" +
        "GIb alles nur in: "+localStorage.getItem('language')+" aus.\n" +
        "\n" +
        "Erster Entwurf: "+responseOne+"\n" +
        "Kritik: "+responseTwo+"\n" +
        "\n" +
        "Erstelle eine überarbeitete Antwort.\n" +
        "Geh auf jeden Kritikpunkt ein —\n" +
        "werde aber nicht zu lange es soll sich gut und schlüssig lesen.\n");

    if (response && response.includes("Error:")){
        uiHistory.push({ type: 'error', content: response });
    }
    else {
        uiHistory.push({ type: 'final', content: response });
    }

    document.getElementById('animation').style.display = 'none';

    await window.electronAPI.saveChat({
        id: currentChatId,
        title: userInput.substring(0, 50),
        createdAt: new Date().toISOString(),
        history: conversationHistory,
        uiHistory: uiHistory
    });

    await loadChatList();

}


async function singeAPICall(model,thirdCall, prompt){

    let responseTxt;

    let response;

    const outBox = document.getElementById('out');

    try {

        if (fileContents.length > 0) {
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://complex",
                    "X-Title": "Complex"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [...conversationHistory, {
                        role: "user",
                        content: [...fileContents, { type: "text", text: userInput }]
                    }]
                })
            });
        }

        else {
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://complex",
                    "X-Title": "Complex"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [...conversationHistory, { role: "user", content: prompt }],
                })
            });
        }

        let respnoseJson = await response.json();

        if (respnoseJson.error) {
            throw new Error(respnoseJson.error.message);
        }

        if (respnoseJson.choices && respnoseJson.choices.length > 0) {

            responseTxt = respnoseJson.choices[0].message.content;

            if (thirdCall) {

                const element = document.createElement('answerEnd');
                element.innerHTML = marked.parse(responseTxt);

                const allLinksThree = element.querySelectorAll('a');

                allLinksThree.forEach((link) => {
                    link.addEventListener('click', e => {
                        e.preventDefault();
                        const url = link.href;
                        openLink(url);
                    })
                })

                outBox.appendChild(element);

                element.scrollIntoView({ behavior: 'smooth', block: 'end' });

            }

            else {

                let firstPress = true;
                const element = document.createElement('answer');

                element.innerHTML = marked.parse(responseTxt);

                element.insertAdjacentHTML('afterbegin', svg);

                element.addEventListener('mousedown', (e) => {
                    if (e.detail > 1) {
                        e.preventDefault();
                    }
                }, false);

                const allLinksOne = element.querySelectorAll('a');
                allLinksOne.forEach((link) => {
                    link.addEventListener('click', e => {
                        e.preventDefault();
                        const url = link.href;
                        openLink(url);
                    })
                })

                element.addEventListener('click', (e) => {
                    if (firstPress) {
                        firstPress = false;
                        element.style.minHeight='max-content';
                        element.style.height='auto';
                        element.querySelector('svg').style.transform='rotate(-90deg)';
                        const allChildren = element.querySelectorAll('*');

                        allChildren.forEach(child => {
                            child.style.visibility = "visible";
                        })
                    }

                    else{
                        firstPress = true;
                        element.style.minHeight='1em';
                        element.style.height='1em';
                        element.querySelector('svg').style.transform='rotate(0deg)';

                        const allChildrenExceptSvg = element.querySelectorAll(':not(svg):not(svg *)');

                        allChildrenExceptSvg.forEach(child => {
                            child.style.visibility = "hidden";
                        })
                    }

                })
                outBox.appendChild(element);
            }

            return responseTxt;
        }

    } catch (e) {
        const element = document.createElement('error');
        element.textContent = "Error: "+model+" is not responging";
        outBox.appendChild(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return" Error: "+model+" is not responging";
    }

}


async function filesToMessages(files) {
    const fileMessages = await Promise.all(files.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    type: "text",
                    text: `Datei: ${file.name}\n\n${reader.result}`
                });
            };
            reader.readAsText(file);
        });
    }));
    return fileMessages;
}


async function getKey() {
    const key = await window.electronAPI.loadKey();
    document.getElementById('inputAPI').value = key;
}


function handleResize(){
    if (chatMode) {
        document.getElementById('input-wrapper').style.top = "calc(100% - 6.5em)";
        document.getElementById('out').style.height = "calc(100dvh - 7em)";
    }
}

