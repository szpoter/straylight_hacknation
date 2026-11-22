const inks = {
  zasilek: ['ZASIŁEK', 'Podstawa', 'ustalenia wysokości zasiłku', 21],
  urlop: ['URLOP', 'Okres', 'korzystania z urlopu', 13],
  data: ['POTWIERDZENIE', 'Data wpływu', 'pisma w sprawie dziecka', 26],
};

export function printout(kind) {
  const [title, paragraph, detail, length] = inks[kind];
  const back = kind === 'urlop';
  const left = back ? -32 : -28;
  return `<g stroke-linejoin="round" stroke-linecap="round">
    <path d="M-39 -45Q-8 -51 27 -47l13 12q-3 37 0 81q-39 -4 -80 3q-3 -47 1 -94Z" fill="#25384a" opacity=".14" transform="translate(1.6 2)"/>
    <path d="M-39 -45Q-8 -51 27 -47l13 12q-3 37 0 81q-39 -4 -80 3q-3 -47 1 -94Z" fill="${back ? '#f3f4e9' : '#fffdf7'}" stroke="#283754" stroke-width="1.55"/>
    <path d="M27 -46l-1 12 13 -1" fill="#d8e4d8" stroke="#708379" stroke-width=".8"/>
    <g fill="#395b4c" font-family="Inter,Arial,sans-serif">
      <text x="-31" y="-30" font-weight="700" font-size="${kind === 'data' ? 5.4 : 7.2}">${title}</text>
      <path d="M-31 -26h48" stroke="#91a399" stroke-width=".75"/>
      <text x="${left}" y="-8" font-weight="600" font-size="4.8">${paragraph}</text>
      <text x="${left}" y="-.8" fill="#788781" font-size="2.95">${detail}</text>
    </g>
    <path d="M${left} -6.2q${length * .43} -1 ${length} -.3" fill="none" stroke="#20864b" stroke-width="1.7"/>
    ${back ? '<path d="M-31 2h5v5h-5zm0 11h5v5h-5zm0 11h5v5h-5z" fill="none" stroke="#718276" stroke-width="1.15"/>' : ''}
    <path d="M${back ? -21 : -28} 4h46m-46 4h32m-32 8h50m-50 4h40m-40 8h45m-45 4h27" fill="none" stroke="#99a5a2" stroke-width="1"/>
  </g>`;
}

function ease(f, start, end) {
  const t = Math.max(0, Math.min(1, (f - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function contact(sheet, x, y) {
  const a = sheet.angle * Math.PI / 180;
  return [sheet.x + x * Math.cos(a) - y * Math.sin(a), sheet.y + x * Math.sin(a) + y * Math.cos(a)];
}

function reach(start, end, t) {
  return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t - 9 * Math.sin(Math.PI * t)];
}

export function scene(f, k) {
  const right = ease(f, 4, 16);
  const left = ease(f, 26, 37);
  const middle = ease(f, 44, 53);
  const slip = ease(f, 54, 59);
  const zasilek = {kind:'zasilek', x:639 - 16 * left - 4 * slip, y:374 - 29 * left + 10 * slip, angle:-6 - 4 * left};
  const urlop = {kind:'urlop', x:726 + 20 * right, y:362 - 13 * right, angle:-4};
  const data = {kind:'data', x:694, y:376 - 38 * middle, angle:-5};
  const a = contact(urlop, -28, -24);
  const b = contact(zasilek, 8, -28);
  const c = contact(data, -4, -34);
  const [x, y] = f < 37 ? reach(a, b, ease(f, 16, 26)) : reach(b, c, ease(f, 37, 44));
  const wx = x + 41, wy = y + 18;
  const elbowX = 788 + (wx - 742) * .42, elbowY = 403 + (wy - 369) * .37 - 44 * middle;
  const pawel = k.person('pawel', {x:686, y:438, s:1.09, lean:2, head:18, gazeDown:.93,
    left:[-88,-17,-94/1.09,-35/1.09], right:[(elbowX-686)/1.09,(elbowY-438)/1.09,(wx-686)/1.09,(wy-438)/1.09], leftGrip:'hold',rightGrip:'hold'});
  const sheets = [data, zasilek, urlop].map(page => `<g transform="translate(${page.x} ${page.y}) rotate(${page.angle})">${printout(page.kind)}</g>`).join('');
  const forearm = `M${elbowX} ${elbowY}L${wx} ${wy}`;
  return `<g transform="translate(640 360) scale(5.55) translate(-679 -352)">
    ${k.queue()}${k.pram(535,612,1,120)}${pawel}${sheets}${k.folder(646,392,128,-6,.71)}${k.hand(592,403,-111,.94,'hold')}
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="${forearm}" fill="none" stroke="#283754" stroke-width="30"/><path d="${forearm}" fill="none" stroke="#2d3950" stroke-width="25"/>
      <g transform="translate(${x} ${y})">
        <path d="M46 6l-7 -2 -9 19 7 5Z" fill="#f7f6ed" stroke="#283754" stroke-width="1.55"/>
        <path d="M41 6q-5 -2 -10 -7q-5 -5 -11 -4L4 -3q-5 .4 -4 3q.5 2 5 2l13 -1 -6 3q-5 2 -4 5q.7 2 4 1q-1 5 4 5q1 4 5 3l4 -1q4 3 9 6Z" fill="#ffebdb" stroke="#283754" stroke-width="1.6"/>
        <path d="M1.7 -1q2.3 -1.7 5 -1.5l-.2 2q-2.2 .9 -4.4 .5m9.1 10.2 8 -4.4m-3.5 9 7.1 -4m-2 7 5 -3" fill="none" stroke="#af9180" stroke-width=".85"/>
      </g>
    </g>
  </g>`;
}
