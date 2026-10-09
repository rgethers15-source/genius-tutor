/** Original vector portraits. Uploaded/generated pictures still take priority. */
export function princessPortrait(index: number): string {
  const colors = ['#b58ce0', '#66b9ad', '#e59b78', '#ca82ad', '#8b9bd4', '#dba655', '#92ba79', '#b786a3'];
  const dress = colors[index % colors.length];
  const skin = ['#794a36', '#995f40', '#603d30', '#a96d49'][index % 4];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
  <defs><radialGradient id="bg"><stop stop-color="${dress}"/><stop offset="1" stop-color="#302344"/></radialGradient></defs>
  <rect width="480" height="480" rx="40" fill="url(#bg)"/>
  <g fill="#fce1ad" opacity=".5"><path d="m65 100 4 12 12 4-12 4-4 12-4-12-12-4 12-4zm340 70 4 12 12 4-12 4-4 12-4-12-12-4 12-4z"/><circle cx="90" cy="320" r="3"/><circle cx="390" cy="280" r="4"/></g>
  <path d="M129 272q-42-139 39-167 70-57 146 9 67 49 27 169l-34 47H153z" fill="#241d27"/>
  <path d="M76 480q8-139 119-155h90q111 16 119 155" fill="${dress}"/>
  <path d="M208 281h64v69q-32 35-64 0" fill="${skin}"/>
  <ellipse cx="240" cy="210" rx="86" ry="112" fill="${skin}"/>
  <path d="M155 194q-20-115 79-119 94 0 95 115-43-7-58-66-46 56-116 70" fill="#241d27"/>
  <g fill="#271c22"><path d="M184 209q18-15 35 0-17 10-35 0m77 0q18-15 35 0-17 10-35 0"/></g>
  <g stroke="#271c22" stroke-width="5" fill="none" stroke-linecap="round"><path d="M183 192q18-10 36-1m42 0q17-10 36 1"/></g>
  <g fill="#fff2de"><circle cx="203" cy="207" r="3"/><circle cx="280" cy="207" r="3"/></g>
  <path d="M237 216l-8 31h17" fill="none" stroke="#4e302b" stroke-width="3" stroke-linecap="round"/>
  <path d="M214 272q26 22 52 0-26 6-52 0" fill="#e9a098"/>
  <path d="m184 97-9-47 35 24 30-39 30 39 35-24-9 47z" fill="#eacc8c" stroke="#fff1bd" stroke-width="3"/>
  <path d="m240 67 9 12-9 12-9-12z" fill="${dress}"/>
  <g fill="#edcf94"><circle cx="158" cy="243" r="7"/><circle cx="322" cy="243" r="7"/><path d="M194 334q46 43 92 0l-4 14q-42 39-84 0z"/></g>
  <path d="m240 359 12 17-12 17-12-17z" fill="#ffe5ac"/>
  <path d="M110 460q20-67 64-88m196 88q-20-67-64-88" fill="none" stroke="#fff0d0" stroke-opacity=".25" stroke-width="6"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
