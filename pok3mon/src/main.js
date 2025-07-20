const rand = () => Math.floor(Math.random() * 151) + 1;

const qs = (sel) => document.querySelector(sel);
const img   = qs('#pokeImg');
const form  = qs('#guessForm');
const input = qs('#guessInput');
const btn   = qs('#actionBtn');
const fb    = qs('#feedback');
const score = qs('#score');

let mystery, pikachu, streak = 0;

const get = (id) =>
  fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((r) => r.json());

const sprite = (p) =>
  p.sprites.other?.['official-artwork'].front_default ?? p.sprites.front_default;

async function newRound() {
  fb.textContent = '';
  fb.className   = '';
  input.value    = '';
  input.disabled = false;
  btn.textContent = 'Guess';

  mystery = await get(rand());
  pikachu ??= await get('pikachu');

  console.log('%c[NEW ROUND]', 'color:#3b4cca;font-weight:bold',
              `#${mystery.id} ${mystery.name}`);

  img.src = sprite(mystery);
  img.classList.add('silhouette');
  input.focus();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (btn.textContent === 'Guess') {
    const guess   = input.value.trim();
    const correct = guess.toLowerCase() === mystery.name.toLowerCase();

    console.log('%c[GUESS]', 'color:#ffcb05;font-weight:bold',
                'typed:', guess, '| apiName:', mystery.name,
                '| correct?', correct);

    img.classList.remove('silhouette');
    img.src = sprite(pikachu);
    input.disabled = true;
    btn.textContent = 'Next';

    fb.textContent = correct
      ? 'You were right! It was Pikachu'
      : 'Wrong! It was Pikachu!';
    fb.className   = correct ? 'correct' : 'incorrect';
    streak         = correct ? streak + 1 : 0;
    score.textContent = `Consecutive correct: ${streak}`;

  } else {
    btn.disabled = true;
    await newRound();
    btn.disabled = false;
  }
});

newRound().then(() => document.body.classList.add('loaded'));

export { rand };