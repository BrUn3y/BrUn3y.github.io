(() => {
  const form = document.querySelector('#chat-form');
  const log = document.querySelector('#chat-log');
  const nicknameInput = document.querySelector('#chat-nickname');
  const messageInput = document.querySelector('#chat-message');
  const nicknames = ['pixel_kit', 'bytekid', 'qbit_99', 'luna.exe', 'staticcat', 'neonfox', 'bit_runner', 'cache_me', 'orbitkid', 'hexghost', 'dialupdan', 'miso.png', 'ctrl_z', 'cassette', 'async_amy', 'tape_drive', 'shellfish', 'softreset', 'noodlebit', 'retro_rai', 'vhs_club', 'null_panda', 'circuitbee', 'nightshift'];
  const welcomedNicknames = new Set();
  const welcomeLines = [
    (name) => `Hey @${name}, welcome to the orbit! Grab a tab and get comfortable.`,
    (name) => `@${name} has entered the chat! The modem approves.`,
    (name) => `Welcome, @${name}! Quantum Lab on the left, coffee somewhere off-screen.`,
    (name) => `Oh hey @${name}! You made it through the dial-up handshake.`,
    (name) => `@${name}, welcome aboard! Your complimentary browser tab is ready.`,
    (name) => `Hi @${name}! Pick a project. Accidentally open five more. That is the tradition.`,
    (name) => `Welcome @${name}! Please keep your hands inside the agent loop.`,
    (name) => `Look who just materialized: @${name}! Welcome to this corner of the web.`,
    (name) => `@${name}! Good timing. We were just negotiating with a qubit.`,
    (name) => `Hey @${name}, pull up a pixel chair. The good kind with lumbar support.`,
    (name) => `Welcome, @${name}! Your nickname has passed the extremely unofficial vibe check.`,
    (name) => `@${name} just joined the party. Somebody turn the imaginary Winamp up.`,
  ];
  const funnyLines = [
    (name) => `@${name}, the quantum cat is both excited and asleep. We are not checking.`,
    (name) => `Fair warning @${name}: one more repo is how every weekend disappears.`,
    (name) => `@${name}, our debugging method is 10% logs and 90% staring meaningfully.`,
    (name) => `If you see three agents arguing, @${name}, that is a code review. Probably.`,
    (name) => `@${name}, the coffee is async but the need for it is blocking.`,
    (name) => `Welcome gift for @${name}: one bug. It was here when we arrived.`,
    (name) => `@${name}, the Strava agent says opening tabs does not count as cardio. Rude.`,
    (name) => `@${name}, we tried downloading more RAM. The qubits filed a complaint.`,
    (name) => `The first rule, @${name}: never ask a qubit to make up its mind.`,
    (name) => `@${name}, this room is powered by curiosity and a suspicious number of semicolons.`,
    (name) => `Someone get @${name} a floppy disk. We are going to need more storage for these ideas.`,
    (name) => `@${name}, my agent is reviewing my other agent. I am mostly supervising the snacks.`,
    (name) => `@${name}, the deadline is in superposition until someone opens the calendar.`,
    (name) => `Quick tip @${name}: if it works on your machine, your machine is now production.`,
    (name) => `@${name}, no bugs were harmed in the making of this website. They unionized.`,
    (name) => `@${name}, Bob asked for a coffee break. Docker said we are out of containers.`,
    (name) => `Good news @${name}: the bug is reproducible. Bad news: so is my confusion.`,
    (name) => `@${name}, our five-agent lab still cannot agree on a pizza topping.`,
    (name) => `@${name}, the code is open source. My sleep schedule is a proprietary mystery.`,
    (name) => `@${name}, a quantum computer walks into a bar. Also does not. Long story.`,
  ];
  const pick = (items) => items[Math.floor(Math.random() * items.length)];

  function roomReply(nickname, lines) {
    const otherMembers = nicknames.filter((name) => name.toLowerCase() !== nickname.toLowerCase());
    appendMessage(pick(otherMembers), pick(lines)(nickname));
  }

  function appendMessage(nickname, message, visitor = false) {
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    const item = document.createElement('li');
    item.className = `chat-message${visitor ? ' visitor-message' : ''}`;
    const name = document.createElement('span');
    name.className = 'chat-nick';
    name.textContent = nickname;
    const text = document.createElement('p');
    text.textContent = message;
    item.append(name, text);
    log.append(item);
    while (log.children.length > 18) log.firstElementChild.remove();
    if (nearBottom || visitor) log.scrollTop = log.scrollHeight;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const nickname = nicknameInput.value.trim();
    const message = messageInput.value.trim();
    if (!nickname) { nicknameInput.focus(); return; }
    if (!message) { messageInput.focus(); return; }
    appendMessage(nickname, message, true);
    messageInput.value = '';
    messageInput.focus();
    const normalizedNickname = nickname.toLowerCase();
    if (!welcomedNicknames.has(normalizedNickname)) {
      welcomedNicknames.add(normalizedNickname);
      setTimeout(() => roomReply(nickname, welcomeLines), 700 + Math.random() * 800);
      setTimeout(() => roomReply(nickname, funnyLines), 2400 + Math.random() * 1800);
    } else if (Math.random() < .45) {
      setTimeout(() => roomReply(nickname, funnyLines), 1000 + Math.random() * 1500);
    }
  });

  // Enable input only after the local-only submit handler is installed.
  for (const control of form.elements) control.disabled = false;

  async function startSimulation() {
    try {
      const response = await fetch('site/chat-messages.json');
      if (!response.ok) return;
      const messages = await response.json();
      if (!Array.isArray(messages) || messages.length < 4) return;
      let deck = [];
      let previousNickname = '';
      function nextMessage() {
        if (!deck.length) {
          deck = [...messages];
          for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
          }
        }
        const text = deck.pop();
        const candidates = nicknames.filter((name) => name !== previousNickname);
        const nickname = candidates[Math.floor(Math.random() * candidates.length)];
        previousNickname = nickname;
        appendMessage(nickname, text);
      }
      // Keep any visitor message submitted while the local file was loading.
      for (const message of [...log.children]) {
        if (!message.classList.contains('visitor-message')) message.remove();
      }
      for (let i = 0; i < 4; i++) nextMessage();
      function scheduleNext() {
        setTimeout(() => {
          if (!document.hidden) nextMessage();
          scheduleNext();
        }, 9_000 + Math.random() * 15_000);
      }
      scheduleNext();
    } catch {
      // Keep the static HTML conversation if the optional local file fails.
    }
  }
  startSimulation();
})();
