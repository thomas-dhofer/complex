let menuHidden = false;
let allFiles = [];

window.addEventListener('DOMContentLoaded', start);

async function start() {
    document.getElementById('color1').value = localStorage.getItem('g-color1') || '#00ff9699';
    document.getElementById('color2').value = localStorage.getItem('g-color2') || '#0096ff8c';
    document.getElementById('color3').value = localStorage.getItem('g-color3') || '#0096ff73';
    document.getElementById('colorBackground').value = localStorage.getItem('g-colorBackground') || '#020810';
    updateGradient();
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.getElementById('inputName').value = localStorage.getItem('name');
    document.getElementById('inputLanguage').value = localStorage.getItem('language');

    document.getElementById('modellOne').value = localStorage.getItem('modellOne') || '';
    document.getElementById('modellTwo').value = localStorage.getItem('modellTwo') || '';
    document.getElementById('modellThree').value = localStorage.getItem('modellThree') || '';

    setModel();

    if (localStorage.getItem('name') === null || localStorage.getItem('name') === '' ) {
        document.getElementById('centerTitel').textContent = "Are you ready?";
    }

    else {
        document.getElementById('centerTitel').textContent = "Are you ready " + localStorage.getItem('name') + "?";
    }

    getKey();

    requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
            document.getElementById('main').classList.add('active');
        })
    })

    loadChatList();

}

function resetGradient() {
    document.getElementById('color1').value = '#00ff96';
    document.getElementById('color2').value = '#0096ff';
    document.getElementById('color3').value = '#0096ff';
    document.getElementById('colorBackground').value = '#020810';
    updateGradient();
}

function openMenu(x) {
    if (menuHidden){
        x.classList.toggle("change");
        document.getElementById("menu").style.height = '2em';
        document.getElementById("menu").style.width = '3.1em';
        document.getElementById("menu").style.marginTop = '3.2em';
        document.getElementById("menu-item").classList.toggle("show");
        document.getElementById("menu").style.visibility = 'hidden';
        menuHidden = false;
    }

    else{
        x.classList.toggle("change");
        document.getElementById("menu").style.visibility = 'visible';
        document.getElementById("menu").style.height = 'auto';
        document.getElementById("menu").style.width = '20em';
        document.getElementById("menu").style.marginTop = '3em';
        document.getElementById("menu-item").classList.toggle("show");
        menuHidden = true;
    }

}

function showSection(sectionId, element) {

    const sections = document.querySelectorAll('.settings-section');
    for (let s of sections) {
        s.style.display = 'none';
    }

    const targetSection = document.getElementById('section-' + sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    const navItems = document.querySelectorAll('.nav-item');
    for (let item of navItems) {
        item.classList.remove('active');
    }

    if (element) {
        element.classList.add('active');
    }
}

function openLink(url){
    window.electronAPI.openLink(url);
}

document.getElementById('text').addEventListener('paste', function(e) {
    const files = e.clipboardData.files;

    if (files.length !== 0){
        e.preventDefault();
        if (files.length > 0) handleFiles(files);
    }
});

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', function(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFiles(files);
});


function handleFiles(files) {
    for (const file of files) {
        allFiles.push(file);

        const div = document.createElement('li');
        div.textContent = `📄 ${file.name}`;

        div.addEventListener('click', e => {
            allFiles = allFiles.filter(f => f !== file);
            div.remove();
        });

        document.getElementById('docList').appendChild(div);
    }
}

async function loadChatList() {
    const allChats = await window.electronAPI.loadChats();

    allChats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const list = document.getElementById('chatList');
    list.innerHTML = '';

    allChats.forEach(chat => {
        const el = document.createElement('div');
        el.textContent = chat.title;
        el.addEventListener('click', () => openChat(chat.id));
        list.appendChild(el);
    });
}

async function openChat(chatId) {
    const chat = await window.electronAPI.loadChat(chatId);
    if (!chat) return;

    currentChatId = chat.id;
    conversationHistory = chat.history;
    uiHistory = chat.uiHistory;

    renderChat(chat);
}

function renderChat(chat) {
    const outBox = document.getElementById('out');
    outBox.innerHTML = '';

    document.getElementById('center').style.display = 'none';
    document.getElementById('out').style.visibility = 'visible';
    chatMode = true;
    handleResize();

    chat.uiHistory.forEach(item => {

        if (item.type === 'question') {
            const el = document.createElement('question');
            el.textContent = item.content;
            outBox.appendChild(el);
        }

        else if (item.type === 'one' || item.type === 'two') {
            let firstPress = true;
            const el = document.createElement('answer');
            el.innerHTML = marked.parse(item.content);
            el.insertAdjacentHTML('afterbegin', svg);

            el.addEventListener('mousedown', (e) => {
                if (e.detail > 1) e.preventDefault();
            }, false);

            el.addEventListener('click', () => {
                if (firstPress) {
                    firstPress = false;
                    el.style.minHeight = 'max-content';
                    el.style.height = 'auto';
                    el.querySelector('svg').style.transform = 'rotate(-90deg)';
                    el.querySelectorAll('*').forEach(child => {
                        child.style.visibility = 'visible';
                    });
                } else {
                    firstPress = true;
                    el.style.minHeight = '1em';
                    el.style.height = '1em';
                    el.querySelector('svg').style.transform = 'rotate(0deg)';
                    el.querySelectorAll(':not(svg):not(svg *)').forEach(child => {
                        child.style.visibility = 'hidden';
                    });
                }
            });

            outBox.appendChild(el);
        }

        else if (item.type === 'final') {
            const el = document.createElement('answerEnd');
            el.innerHTML = marked.parse(item.content);

            el.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    openLink(link.href);
                });
            });

            outBox.appendChild(el);
        }

        else if (item.type === 'error') {
            const el = document.createElement('error');
            el.innerHTML = marked.parse(item.content);
            outBox.appendChild(el);

        }
    });
}

function newChat() {
    currentChatId = 'chat_' + Date.now();
    conversationHistory = [];
    uiHistory = [];
    allFiles = [];

    document.getElementById('out').innerHTML = '';
    document.getElementById('out').style.visibility = 'hidden';
    document.getElementById('center').style.display = 'block';
    document.getElementById('input-wrapper').style.top = "calc(50%)";
    chatMode = false;
}

